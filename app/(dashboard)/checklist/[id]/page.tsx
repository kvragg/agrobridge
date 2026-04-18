import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChecklistClient from './checklist-client'

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: processo } = await supabase
    .from('processos')
    .select('id, status, banco, valor, perfil_json, created_at')
    .eq('id', id)
    .single()

  if (!processo) notFound()

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const checklistMd =
    typeof perfilJson._checklist_md === 'string' ? perfilJson._checklist_md : null

  return (
    <ChecklistClient
      processoId={id}
      banco={processo.banco}
      valor={processo.valor}
      checklistMdInicial={checklistMd}
      perfilDisponivel={!!processo.perfil_json && !!(perfilJson as Record<string, unknown>).perfil}
    />
  )
}
