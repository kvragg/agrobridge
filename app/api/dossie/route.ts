import { createClient } from '@/lib/supabase/server'
import { gerarLaudo } from '@/lib/anthropic/defesa'
import { montarDossiePDF } from '@/lib/dossie/pdf'
import { calcularCompletude } from '@/lib/dossie/status'
import { enviarDossiePronto } from '@/lib/email/resend'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 90

/**
 * Gera (ou regenera) o dossiê em PDF do processo:
 *  0. Verifica se TODOS os documentos do checklist estão anexados — bloqueia caso contrário
 *  1. Chama Sonnet para redigir o LAUDO DE AVALIAÇÃO DE CRÉDITO (cacheado em perfil_json._laudo_md)
 *  2. Monta o PDF com pdfkit
 *  3. Faz upload ao bucket "documentos" em {user_id}/{processo_id}/dossie.pdf
 *  4. Retorna URL assinada por 1h
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
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
    .select('id, perfil_json, banco, valor, status')
    .eq('id', processoId)
    .single()

  if (errProc || !processo) {
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

  // 1. Laudo completo via Sonnet (cacheado). Se já tinha _defesa_md antigo, ignora.
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
      return Response.json({ erro: curta }, { status: 502 })
    }
    await supabase
      .from('processos')
      .update({ perfil_json: { ...perfilJson, _laudo_md: laudoMd } })
      .eq('id', processoId)
  }

  // 2. Montar PDF (capa + laudo em markdown)
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
    return Response.json({ erro: 'Erro ao montar PDF do dossiê' }, { status: 500 })
  }

  // 3. Upload no storage (upsert para permitir regeração)
  const pdfPath = `${user.id}/${processoId}/dossie.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('documentos')
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErr) {
    console.error('[api/dossie] upload falhou', uploadErr)
    return Response.json({ erro: 'Falha ao salvar dossiê' }, { status: 500 })
  }

  // Marca status=concluido e guarda timestamp
  await supabase
    .from('processos')
    .update({
      status: 'concluido',
      perfil_json: {
        ...perfilJson,
        _laudo_md: laudoMd,
        _dossie_gerado_em: new Date().toISOString(),
      },
    })
    .eq('id', processoId)

  const { data: signed } = await supabase.storage
    .from('documentos')
    .createSignedUrl(pdfPath, 60 * 60)

  // Envia email "dossiê pronto" só na primeira geração
  const jaNotificado = typeof perfilJson._dossie_gerado_em === 'string'
  if (!jaNotificado && user.email) {
    const perfilBloco = (perfilJson.perfil ?? {}) as { nome?: string }
    const nome = perfilBloco.nome || user.email.split('@')[0]
    try {
      await enviarDossiePronto({ to: user.email, nome, processoId })
    } catch (err) {
      console.error('[api/dossie] falha email dossiê pronto', err)
    }
  }

  return Response.json({
    url: signed?.signedUrl ?? null,
    gerado_em: new Date().toISOString(),
  })
}
