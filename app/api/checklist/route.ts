import { createClient } from '@/lib/supabase/server'
import { gerarChecklist, SONNET_MODEL } from '@/lib/anthropic/sonnet'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

// Vercel: Sonnet pode levar 30–90s; default Hobby é 10s.
export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(request: NextRequest) {
  console.log(
    `[api/checklist] POST iniciado — modelo=${SONNET_MODEL}, key_presente=${!!process.env.ANTHROPIC_API_KEY}`
  )
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json()) as { processo_id: string }
  const { processo_id } = body

  if (!processo_id) {
    return Response.json({ erro: 'processo_id obrigatório' }, { status: 400 })
  }

  const { data: processo } = await supabase
    .from('processos')
    .select('id, perfil_json, status')
    .eq('id', processo_id)
    .single()

  if (!processo) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  if (!processo.perfil_json) {
    return Response.json(
      { erro: 'Entrevista ainda não concluída — perfil_json ausente' },
      { status: 422 }
    )
  }

  // Se já tem checklist gerado, retornar do cache
  const perfilJson = processo.perfil_json as Record<string, unknown>
  if (perfilJson._checklist_md && typeof perfilJson._checklist_md === 'string') {
    return Response.json({ checklist: perfilJson._checklist_md })
  }

  // Gerar checklist com Sonnet
  let checklistMarkdown: string
  try {
    checklistMarkdown = await gerarChecklist(
      processo.perfil_json as unknown as PerfilEntrevista
    )
  } catch (err) {
    const e = err as {
      status?: number
      message?: string
      error?: { type?: string; message?: string }
    }
    const status = e.status
    const msg = e.error?.message ?? e.message ?? String(err)
    console.error(
      `[api/checklist] erro Sonnet status=${status} msg=${msg}`,
      err
    )
    let curta = 'Falha ao gerar checklist. Tente novamente em alguns segundos.'
    if (status === 401) curta = 'Chave da API inválida ou ausente no servidor.'
    else if (status === 404) curta = `Modelo não encontrado (${SONNET_MODEL}).`
    else if (status === 400 && /credit balance/i.test(msg))
      curta = 'Saldo Anthropic esgotado. Contate o administrador.'
    else if (status === 429) curta = 'Limite de requisições atingido. Aguarde.'
    else if (status === 529 || status === 503)
      curta = 'IA sobrecarregada. Tente em alguns segundos.'
    return Response.json({ erro: curta }, { status: 502 })
  }

  // Salvar markdown no perfil_json para cache (evita regerar)
  await supabase
    .from('processos')
    .update({
      status: 'documentos',
      perfil_json: { ...perfilJson, _checklist_md: checklistMarkdown },
    })
    .eq('id', processo_id)

  return Response.json({ checklist: checklistMarkdown })
}
