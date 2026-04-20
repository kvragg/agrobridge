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

  const nome =
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  return <PlanosClient nome={nome} />
}
