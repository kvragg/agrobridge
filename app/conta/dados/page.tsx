import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContaDadosClient from '@/components/conta/ContaDadosClient'
import { getPlanoAtual } from '@/lib/plano'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meus dados — AgroBridge',
  description:
    'Exporte ou exclua seus dados da plataforma AgroBridge (direitos LGPD Art. 18).',
  robots: { index: false, follow: false },
}

export default async function ContaDadosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/conta/dados')
  }

  const nome =
    (typeof user.user_metadata?.nome === 'string' && user.user_metadata.nome) ||
    (user.email ? user.email.split('@')[0] : 'Produtor')

  const plano = await getPlanoAtual()

  return (
    <ContaDadosClient
      nome={nome}
      email={user.email ?? ''}
      plano={plano.plano}
    />
  )
}
