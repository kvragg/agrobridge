import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/ui/dashboard-shell'

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

  return (
    <DashboardShell nome={nome} email={user.email}>
      {children}
    </DashboardShell>
  )
}
