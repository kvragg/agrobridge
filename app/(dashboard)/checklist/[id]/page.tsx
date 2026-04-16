import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: itens } = await supabase
    .from('checklist_itens')
    .select('id, nome, urgencia, status, dados_json')
    .eq('processo_id', id)
    .order('urgencia')

  if (!itens) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Checklist de documentos</h1>
      <p className="text-muted-foreground">{itens.length} documento(s) encontrado(s)</p>
      {/* BlocoChecklist — em construção */}
    </div>
  )
}
