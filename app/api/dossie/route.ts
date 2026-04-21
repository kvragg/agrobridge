import { createClient } from '@/lib/supabase/server'
import { gerarLaudo } from '@/lib/anthropic/defesa'
import { montarDossiePDF } from '@/lib/dossie/pdf'
import { calcularCompletude } from '@/lib/dossie/status'
import { enviarDossiePronto } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { lerTier, temAcesso, TIER_NOME } from '@/lib/tier'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 90

// ============================================================
// POST /api/dossie — post-hardening A2 (Eixo 1 / APEX-SEC).
// ============================================================
// Lock atômico via `iniciar_geracao_dossie` (CAS em
// processos.dossie_gerando_desde). Só o vencedor chama Sonnet,
// monta PDF, faz upload e envia email. Concorrentes recebem 409
// imediato com motivo='em_geracao'.
// Persistência final (laudo + status + zera lock) ocorre em UMA
// única RPC `finalizar_geracao_dossie`, que também retorna
// `was_first_generation` para o envio controlado do email.
// ============================================================

interface InicioGeracao {
  acquired: boolean
  motivo: string
}

interface FinalGeracao {
  was_first_generation: boolean
  gerado_em: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // Rate-limit IA por usuário — dossiê é a operação mais cara
  // (Sonnet + PDF + Storage). 5/h cobre uso normal e barra abuso.
  const limite = rateLimit(`ia:dossie:${user.id}`, 5, 60 * 60 * 1000)
  if (!limite.ok) {
    return Response.json(
      { erro: 'Limite de gerações de dossiê por hora atingido. Tente novamente em uma hora.' },
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
    .select('id, perfil_json, banco, valor, status, user_id')
    .eq('id', processoId)
    .single()

  // Defense-in-depth (E2): bloqueio explícito de IDOR mesmo se RLS falhar.
  if (errProc || !processo || processo.user_id !== user.id) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const perfil = perfilJson as unknown as PerfilEntrevista
  const checklistMd =
    typeof perfilJson._checklist_md === 'string' ? perfilJson._checklist_md : ''

  if (!perfilJson.perfil) {
    return Response.json({ erro: 'Entrevista ainda não concluída' }, { status: 422 })
  }
  if (!checklistMd) {
    return Response.json(
      { erro: 'Checklist ainda não foi gerado para este processo' },
      { status: 422 }
    )
  }

  // Gate de tier: dossiê com defesa de crédito exige tier `dossie` ou `mentoria`.
  const tier = lerTier(perfilJson)
  if (!temAcesso(tier, 'dossie')) {
    return Response.json(
      {
        erro: 'Dossiê Bancário Completo (plano Prata) é necessário para gerar a defesa de crédito.',
        codigo: 'tier_insuficiente',
        tier_atual: tier ?? 'nenhum',
        tier_atual_nome: tier ? TIER_NOME[tier] : null,
        tier_minimo: 'dossie',
        tier_minimo_nome: TIER_NOME.dossie,
      },
      { status: 402 }
    )
  }

  // 0. Gate de completude — só libera dossiê com 100% anexado
  const completude = await calcularCompletude({
    supabase,
    userId: user.id,
    processoId,
    checklistMd,
    perfilJson,
  })

  if (completude.total > 0 && completude.pendentes.length > 0) {
    return Response.json(
      {
        erro: 'Dossiê bloqueado: ainda há documentos pendentes.',
        pendentes: completude.pendentes.map((p) => ({
          categoria: p.categoria,
          nome: p.nome_esperado,
        })),
        total: completude.total,
        anexados: completude.anexados,
      },
      { status: 409 }
    )
  }

  // 1. LOCK: CAS atômico em dossie_gerando_desde. Concorrentes caem aqui.
  const { data: lockData, error: lockErr } = await supabase.rpc(
    'iniciar_geracao_dossie',
    { p_processo_id: processoId }
  )
  if (lockErr) {
    console.error('[api/dossie] RPC iniciar_geracao_dossie falhou', lockErr)
    return Response.json({ erro: 'Falha ao iniciar geração' }, { status: 500 })
  }
  const lockRow = (Array.isArray(lockData) ? lockData[0] : lockData) as
    | InicioGeracao
    | null
    | undefined
  if (!lockRow || !lockRow.acquired) {
    return Response.json(
      { erro: 'Dossiê já está sendo gerado. Tente em alguns segundos.', motivo: 'em_geracao' },
      { status: 409 }
    )
  }

  // A partir daqui somos o ÚNICO generator. Qualquer saída precisa
  // liberar o lock (RPC abortar_geracao_dossie) para não travar retries.
  try {
    // 2. Laudo Sonnet (usa cache se presente e não for forcar)
    let laudoMd =
      typeof perfilJson._laudo_md === 'string' ? perfilJson._laudo_md : ''
    if (!laudoMd || forcar) {
      try {
        laudoMd = await gerarLaudo({
          perfil,
          checklistMd,
          documentos: completude.documentos,
        })
      } catch (err) {
        const e = err as {
          status?: number
          message?: string
          error?: { type?: string; message?: string }
        }
        const status = e.status
        const msg = e.error?.message ?? e.message ?? String(err)
        console.error('[api/dossie] erro Sonnet laudo', status, msg, err)
        let curta = 'Falha ao gerar laudo. Tente novamente em alguns segundos.'
        if (status === 401) curta = 'Chave da API inválida ou ausente no servidor.'
        else if (status === 400 && /credit balance/i.test(msg))
          curta = 'Saldo Anthropic esgotado. Contate o administrador.'
        else if (status === 429) curta = 'Limite de requisições atingido. Aguarde.'
        else if (status === 529 || status === 503)
          curta = 'IA sobrecarregada. Tente em alguns segundos.'
        await supabase.rpc('abortar_geracao_dossie', { p_processo_id: processoId })
        return Response.json({ erro: curta }, { status: 502 })
      }
    }

    // 3. Montar PDF
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await montarDossiePDF({
        produtor: {
          nome: perfil.perfil?.nome || user.email?.split('@')[0] || 'Produtor',
          cpf: perfil.perfil?.cpf || '',
          email: user.email,
        },
        processoId,
        banco: processo.banco as string | null,
        valor: processo.valor as number | null,
        perfil,
        laudoMd,
      })
    } catch (err) {
      console.error('[api/dossie] falha ao montar PDF', err)
      await supabase.rpc('abortar_geracao_dossie', { p_processo_id: processoId })
      return Response.json({ erro: 'Erro ao montar PDF do dossiê' }, { status: 500 })
    }

    // 4. Upload no storage
    const pdfPath = `${user.id}/${processoId}/dossie.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('documentos')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (uploadErr) {
      console.error('[api/dossie] upload falhou', uploadErr)
      await supabase.rpc('abortar_geracao_dossie', { p_processo_id: processoId })
      return Response.json({ erro: 'Falha ao salvar dossiê' }, { status: 500 })
    }

    // 5. Finalize atomicamente (persiste laudo + zera lock + timestamp)
    const { data: finData, error: finErr } = await supabase.rpc(
      'finalizar_geracao_dossie',
      { p_processo_id: processoId, p_laudo_md: laudoMd }
    )
    if (finErr) {
      console.error('[api/dossie] RPC finalizar_geracao_dossie falhou', finErr)
      await supabase.rpc('abortar_geracao_dossie', { p_processo_id: processoId })
      return Response.json({ erro: 'Falha ao finalizar dossiê' }, { status: 500 })
    }
    const finRow = (Array.isArray(finData) ? finData[0] : finData) as
      | FinalGeracao
      | null
      | undefined

    // 6. Email apenas na PRIMEIRA geração (was_first_generation).
    if (finRow?.was_first_generation && user.email) {
      const perfilBloco = (perfilJson.perfil ?? {}) as { nome?: string }
      const nome = perfilBloco.nome || user.email.split('@')[0]
      try {
        await enviarDossiePronto({ to: user.email, nome, processoId })
      } catch (err) {
        console.error('[api/dossie] falha email dossiê pronto', err)
      }

      // Audit (E4): registra apenas na PRIMEIRA geração — replays de
      // download não poluem a trilha.
      void logAuditEvent({
        userId: user.id,
        eventType: 'dossie_gerado',
        targetId: processoId,
        request,
      })
    }

    const { data: signed } = await supabase.storage
      .from('documentos')
      .createSignedUrl(pdfPath, 60 * 60)

    return Response.json({
      url: signed?.signedUrl ?? null,
      gerado_em: finRow?.gerado_em ?? new Date().toISOString(),
    })
  } catch (err) {
    // Salvaguarda: qualquer exceção não prevista também libera o lock.
    console.error('[api/dossie] erro inesperado', err)
    await supabase.rpc('abortar_geracao_dossie', { p_processo_id: processoId })
    return Response.json({ erro: 'Erro inesperado ao gerar dossiê' }, { status: 500 })
  }
}
