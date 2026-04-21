import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChecklistClient from './checklist-client'
import ViabilidadeClient from './viabilidade-client'
import { lerTier } from '@/lib/tier'

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
  const parecerMd =
    typeof perfilJson._parecer_md === 'string' ? perfilJson._parecer_md : null
  const perfilDisponivel =
    !!processo.perfil_json && !!(perfilJson as Record<string, unknown>).perfil

  // Tier `diagnostico` (R$29,99) entrega o Parecer de Viabilidade — não tem
  // checklist nem dossiê. Tier `dossie` e `mentoria` seguem o fluxo completo.
  const tier = lerTier(perfilJson)
  if (tier === 'diagnostico') {
    return (
      <ViabilidadeClient
        processoId={id}
        parecerMdInicial={parecerMd}
        perfilDisponivel={perfilDisponivel}
      />
    )
  }

  return (
    <ChecklistClient
      processoId={id}
      banco={processo.banco}
      valor={processo.valor}
      checklistMdInicial={checklistMd}
      perfilDisponivel={perfilDisponivel}
    />
  )
}
