import { createClient } from '@/lib/supabase/server'
import { gerarParecerViabilidade } from '@/lib/anthropic/viabilidade'
import { montarViabilidadePDF } from '@/lib/dossie/pdf-viabilidade'
import {
  marcarEntregaEnfileirada,
  marcarEntregaGerando,
  marcarEntregaPronta,
  marcarEntregaErro,
} from '@/lib/dossie/entrega-tracker'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
import { lerTier, temAcesso, TIER_NOME } from '@/lib/tier'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import { SONNET_MODEL } from '@/lib/anthropic/sonnet'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================================
// POST /api/viabilidade — entregável do tier `diagnostico` (R$29,99)
// ============================================================
// Gera o "Parecer de Viabilidade" curto (1-2 páginas) com base apenas
// no PERFIL_JSON da entrevista. NÃO gera checklist, NÃO gera defesa.
// Cache no perfil_json._parecer_md para evitar regerar.
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // Rate-limit por usuário — viabilidade é mais leve que dossiê,
  // mas ainda chama Sonnet. 10/h cobre uso normal.
  const limite = await rateLimitRemoto(`ia:viabilidade:${user.id}`, 10, 60 * 60 * 1000)
  if (!limite.ok) {
    return Response.json(
      {
        erro: 'Limite de gerações por hora atingido. Tente novamente em alguns minutos.',
      },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    processo_id?: string
    forcar?: boolean
  }
  const processoId = body.processo_id
  const forcar = body.forcar === true
  if (!processoId) {
    return Response.json({ erro: 'processo_id obrigatório' }, { status: 400 })
  }

  const { data: processo, error: errProc } = await supabase
    .from('processos')
    .select('id, perfil_json, user_id')
    .eq('id', processoId)
    .single()

  if (errProc || !processo || processo.user_id !== user.id) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  const perfilJson =
    (processo.perfil_json as Record<string, unknown> | null) ?? {}

  if (!perfilJson.perfil) {
    return Response.json(
      { erro: 'Entrevista ainda não concluída — perfil_json ausente' },
      { status: 422 }
    )
  }

  // Gate de tier: viabilidade exige tier `diagnostico` (mínimo) — qualquer
  // tier pago pode gerar (cumulativo).
  const tier = lerTier(perfilJson)
  if (!temAcesso(tier, 'diagnostico')) {
    return Response.json(
      {
        erro: 'É necessário ter um plano ativo para gerar o parecer de viabilidade.',
        codigo: 'tier_insuficiente',
        tier_atual: tier ?? 'nenhum',
        tier_atual_nome: tier ? TIER_NOME[tier] : null,
        tier_minimo: 'diagnostico',
        tier_minimo_nome: TIER_NOME.diagnostico,
      },
      { status: 402 }
    )
  }

  const perfil = perfilJson as unknown as PerfilEntrevista

  // Tracker de entrega (best-effort — alimenta a IA do chat com status real).
  // Tier de viabilidade é sempre 'diagnostico' (Bronze) — qualquer tier pago
  // pode gerar viabilidade, mas o snapshot é o tier mínimo desse entregável.
  await marcarEntregaEnfileirada(supabase, processoId, 'diagnostico', 'viabilidade')
  await marcarEntregaGerando(supabase, processoId, 'viabilidade')

  // Cache: parecer já gerado e não estamos forçando regeração
  let parecerMd =
    typeof perfilJson._parecer_md === 'string' ? perfilJson._parecer_md : ''

  if (!parecerMd || forcar) {
    try {
      parecerMd = await gerarParecerViabilidade(perfil)
    } catch (err) {
      const e = err as {
        status?: number
        message?: string
        error?: { type?: string; message?: string }
      }
      const status = e.status
      const msg = e.error?.message ?? e.message ?? String(err)
      capturarErroProducao(err, {
        modulo: 'viabilidade',
        userId: user.id,
        extra: { etapa: 'sonnet_parecer', status: status ?? 0, msg: msg.slice(0, 200) },
      })
      let curta = 'Falha ao gerar parecer. Tente novamente em alguns segundos.'
      if (status === 401) curta = 'Chave da API inválida ou ausente no servidor.'
      else if (status === 404) curta = `Modelo não encontrado (${SONNET_MODEL}).`
      else if (status === 400 && /credit balance/i.test(msg))
        curta = 'Saldo Anthropic esgotado. Contate o administrador.'
      else if (status === 429) curta = 'Limite de requisições atingido. Aguarde.'
      else if (status === 529 || status === 503)
        curta = 'IA sobrecarregada. Tente em alguns segundos.'
      await marcarEntregaErro(supabase, processoId, 'Falha ao gerar parecer (IA)', 'viabilidade')
      return Response.json({ erro: curta }, { status: 502 })
    }

    await supabase
      .from('processos')
      .update({
        perfil_json: { ...perfilJson, _parecer_md: parecerMd },
      })
      .eq('id', processoId)
      .eq('user_id', user.id)
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await montarViabilidadePDF({
      produtor: {
        nome: perfil.perfil?.nome || user.email?.split('@')[0] || 'Produtor',
        cpf: perfil.perfil?.cpf || '',
        email: user.email,
      },
      processoId,
      perfil,
      parecerMd,
    })
  } catch (err) {
    capturarErroProducao(err, {
      modulo: 'viabilidade',
      userId: user.id,
      extra: { etapa: 'montar_pdf', processoId },
    })
    await marcarEntregaErro(supabase, processoId, 'Falha ao montar PDF', 'viabilidade')
    return Response.json({ erro: 'Erro ao montar PDF' }, { status: 500 })
  }

  const pdfPath = `${user.id}/${processoId}/viabilidade.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('documentos')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErr) {
    capturarErroProducao(uploadErr, {
      modulo: 'viabilidade',
      userId: user.id,
      extra: { etapa: 'upload_storage', processoId },
    })
    await marcarEntregaErro(supabase, processoId, 'Falha ao salvar arquivo', 'viabilidade')
    return Response.json({ erro: 'Falha ao salvar parecer' }, { status: 500 })
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { data: signed } = await supabase.storage
    .from('documentos')
    .createSignedUrl(pdfPath, 60 * 60)

  if (signed?.signedUrl) {
    await marcarEntregaPronta(supabase, processoId, signed.signedUrl, expiresAt, 'viabilidade')
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'viabilidade_gerada',
    targetId: processoId,
    request,
  })

  return Response.json({
    url: signed?.signedUrl ?? null,
    parecer_md: parecerMd,
  })
}
