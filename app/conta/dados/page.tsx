import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ContaDadosClient from '@/components/conta/ContaDadosClient'
import { getPlanoAtual } from '@/lib/plano'
import { tipoDominio } from '@/lib/email/dominios-corporativos'
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

  const [plano, perfilRes] = await Promise.all([
    getPlanoAtual(),
    createAdminClient()
      .from('perfis_lead')
      .select('email_alternativo')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const emailAlternativo =
    (perfilRes.data?.email_alternativo as string | null) ?? null
  const tipoEmailPrincipal = user.email ? tipoDominio(user.email) : 'outro'

  return (
    <ContaDadosClient
      nome={nome}
      email={user.email ?? ''}
      plano={plano.plano}
      userId={user.id}
      emailAlternativo={emailAlternativo}
      tipoEmailPrincipal={tipoEmailPrincipal}
    />
  )
}
