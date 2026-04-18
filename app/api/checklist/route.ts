import { createClient } from '@/lib/supabase/server'
import { gerarChecklist } from '@/lib/anthropic/sonnet'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
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
  const checklistMarkdown = await gerarChecklist(
    processo.perfil_json as unknown as PerfilEntrevista
  )

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
