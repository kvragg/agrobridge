import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SegurancaClient from '@/components/conta/SegurancaClient'
import { getPlanoAtual } from '@/lib/plano'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Segurança da conta — AgroBridge',
  description:
    'Verificação em duas etapas (2FA) e configurações de segurança da sua conta AgroBridge.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SegurancaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/conta/seguranca')
  }

  const nome =
    (typeof user.user_metadata?.nome === 'string' && user.user_metadata.nome) ||
    (user.email ? user.email.split('@')[0] : 'Produtor')

  const plano = await getPlanoAtual()

  return (
    <SegurancaClient
      nome={nome}
      email={user.email ?? ''}
      plano={plano.plano}
      userId={user.id}
    />
  )
}
