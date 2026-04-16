import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — em construção */}
      <aside className="w-64 border-r bg-muted/40 p-4">
        <p className="font-semibold">AgroBridge</p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
