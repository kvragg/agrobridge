import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanosClient from '@/components/planos/PlanosClient'
import { getPlanoAtual } from '@/lib/plano'

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

  // Processo ativo é só o "ref" repassado ao Cakto pra facilitar o match no
  // webhook. Se não existir, o webhook tem fallback por email + auto-cria
  // placeholder — não precisamos bloquear a visualização de planos.
  const { data: processoAtivo } = await supabase
    .from('processos')
    .select('id')
    .eq('user_id', user.id)
    .eq('pagamento_confirmado', false)
    .neq('status', 'concluido')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nome =
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  const plano = await getPlanoAtual()

  return (
    <PlanosClient
      nome={nome}
      processoId={processoAtivo?.id ?? null}
      tierAtual={plano.tier}
      userId={user.id}
    />
  )
}
