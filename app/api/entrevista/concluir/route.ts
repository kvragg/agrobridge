import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
import { capturarErroProducao, logger } from '@/lib/logger'
import { logAuditEvent } from '@/lib/audit'
import {
  leadTemPerfilMinimo,
  montarPerfilEntrevistaDeLead,
} from '@/lib/entrevista/montar-perfil'
import { getPlanoAtual } from '@/lib/plano'
import type { PerfilLead } from '@/types/perfil-lead'

// POST /api/entrevista/concluir
//
// Sinaliza fim da entrevista — chamado pelo botão "Concluir entrevista"
// no ChatClient e WidgetIA. Antes deste fix (25/04/2026), a entrevista
// fluía pelo /api/chat que populava perfis_lead, mas NUNCA tocava
// processos.perfil_json — resultado: lead conversava, terminava, e o
// /checklist/[id] continuava bloqueado com "Conclua a entrevista".
//
// Comportamento:
//  1. Carrega perfis_lead do user.
//  2. Se perfil tem corpo mínimo (nome + cultura/área/valor/UF), monta
//     PerfilEntrevista a partir dos campos diretos + memoria_ia.
//  3. Acha processo aberto do user (mais recente sem soft-delete) ou
//     cria um novo se não existir nenhum.
//  4. Atualiza processo.perfil_json com o perfil montado + status='checklist'.
//  5. Audit + retorna { processo_id } pro client redirecionar.
//
// Se perfis_lead vazio → 422 com mensagem amigável pra IA fazer mais
// perguntas. Se nem perfil mínimo, é cedo demais pra concluir.

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  // Rate limit conservador: concluir é raro (1× por entrevista) e cria
  // processo no DB. 5/h chega de sobra.
  const limite = await rateLimitRemoto(
    `entrevista:concluir:${user.id}`,
    5,
    60 * 60 * 1000,
  )
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Limite atingido — aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  const admin = createAdminClient()

  // 1. Carrega perfil
  const { data: perfilRaw } = await admin
    .from('perfis_lead')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const perfilLead = (perfilRaw ?? null) as PerfilLead | null

  if (!leadTemPerfilMinimo(perfilLead)) {
    return NextResponse.json(
      {
        erro: 'Conversa ainda muito curta. Continue conversando com a IA — basta me dar nome, cultura, e o valor pretendido pra eu montar seu checklist.',
        codigo: 'perfil_insuficiente',
      },
      { status: 422 },
    )
  }

  // 2. Monta PerfilEntrevista a partir dos dados que TEMOS
  const perfilEntrevista = montarPerfilEntrevistaDeLead(perfilLead!)

  // 3. Acha processo aberto OU cria novo. Preferimos atualizar o
  //    processo mais recente (mesmo sem perfil_json) pra preservar
  //    a continuidade de pagamentos/compras já vinculados.
  const { data: processoAberto } = await admin
    .from('processos')
    .select('id, perfil_json, status')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const plano = await getPlanoAtual()
  const tierInterno = plano.tier // null | diagnostico | dossie | mentoria

  let processoId: string

  if (processoAberto?.id) {
    processoId = processoAberto.id
    // Merge: mantém o que já tinha em perfil_json (ex: _pagamento, _tier,
    // _checklist_md cache) e SOBRESCREVE só o bloco "perfil" e os campos
    // de domínio principal.
    const perfilAtual =
      (processoAberto.perfil_json as Record<string, unknown> | null) ?? {}
    const perfilJsonNovo = {
      ...perfilAtual,
      ...perfilEntrevista,
      _tier: perfilAtual._tier ?? tierInterno,
    }

    const { error: errUpdate } = await admin
      .from('processos')
      .update({
        perfil_json: perfilJsonNovo,
        status:
          processoAberto.status === 'pagamento'
            ? 'pagamento' // não regredir status do funil de pagamento
            : 'checklist',
        banco: perfilEntrevista.necessidade_credito.banco_preferido || null,
        valor: perfilEntrevista.necessidade_credito.valor || null,
      })
      .eq('id', processoId)

    if (errUpdate) {
      capturarErroProducao(errUpdate, {
        modulo: 'entrevista/concluir',
        userId: user.id,
        extra: { etapa: 'update_processo', processoId },
      })
      return NextResponse.json(
        { erro: 'Falha ao salvar perfil. Tente de novo.' },
        { status: 500 },
      )
    }
  } else {
    // Criar novo processo
    const perfilJsonNovo = { ...perfilEntrevista, _tier: tierInterno }
    const { data: criado, error: errInsert } = await admin
      .from('processos')
      .insert({
        user_id: user.id,
        perfil_json: perfilJsonNovo,
        status: 'checklist',
        fase: 'qualificacao',
        banco: perfilEntrevista.necessidade_credito.banco_preferido || null,
        valor: perfilEntrevista.necessidade_credito.valor || null,
      })
      .select('id')
      .single()

    if (errInsert || !criado) {
      capturarErroProducao(errInsert ?? new Error('insert sem retorno'), {
        modulo: 'entrevista/concluir',
        userId: user.id,
        extra: { etapa: 'insert_processo' },
      })
      return NextResponse.json(
        { erro: 'Falha ao criar processo. Tente de novo.' },
        { status: 500 },
      )
    }
    processoId = criado.id
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'processo_criado',
    targetId: processoId,
    request,
    payload: {
      origem: 'entrevista_concluida_via_chat',
      tier: tierInterno,
      tem_pagamento: processoAberto?.status === 'pagamento' ? false : null,
    },
  })

  logger.info({
    msg: 'entrevista concluída via chat → processo atualizado',
    modulo: 'entrevista/concluir',
    extra: { processoId, tier: tierInterno },
  })

  return NextResponse.json({
    ok: true,
    processo_id: processoId,
    tier: tierInterno,
    redirect_para:
      tierInterno === 'diagnostico' || tierInterno === 'dossie' || tierInterno === 'mentoria'
        ? `/checklist/${processoId}`
        : `/checklist`, // Free vai pro genérico
  })
}
