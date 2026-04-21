import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanosClient from '@/components/planos/PlanosClient'

export const metadata = {
  title: 'Planos · AgroBridge',
  description: 'Escolha como aprovar seu crédito rural',
}

export default async function PlanosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/planos')
  }

  // Processo ativo = aberto pelo user e ainda sem pagamento. O webhook Cakto
  // precisa desse id pra confirmar o pagamento. Sem ele, manda o user pra
  // entrevista pra criar um — o checkout sem processo_id seria órfão.
  const { data: processoAtivo } = await supabase
    .from('processos')
    .select('id')
    .eq('user_id', user.id)
    .eq('pagamento_confirmado', false)
    .neq('status', 'concluido')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!processoAtivo) {
    redirect('/entrevista/nova?next=/planos')
  }

  const nome =
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  return <PlanosClient nome={nome} processoId={processoAtivo.id} />
}
