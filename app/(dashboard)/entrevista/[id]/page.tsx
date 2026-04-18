import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EntrevistaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: processo } = await supabase
    .from('processos')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!processo) redirect('/dashboard')

  // Se já passou da entrevista, ir para o checklist
  if (processo.status !== 'entrevista') {
    redirect(`/checklist/${id}`)
  }

  // Redirecionar para nova entrevista
  redirect('/entrevista/nova')
}
