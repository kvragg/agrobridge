import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/ui/dashboard-shell'
import { getPlanoAtual } from '@/lib/plano'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const nome =
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'Usuário'

  const plano = await getPlanoAtual()

  return (
    <DashboardShell nome={nome} email={user.email} plano={plano.plano}>
      {children}
    </DashboardShell>
  )
}
