import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, MessageSquare, LogOut, Sprout } from 'lucide-react'
import SignOutButton from '@/components/ui/sign-out-button'

const NAV = [
  { href: '/dashboard', label: 'Processos', icon: LayoutDashboard },
  { href: '/entrevista/nova', label: 'Nova Entrevista', icon: MessageSquare },
]

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
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col bg-[#14532d]">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Sprout className="h-4.5 w-4.5 text-[#86efac]" />
            </div>
            <span className="text-base font-black tracking-tight text-white">
              Agro<span className="text-[#86efac]">Bridge</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Menu
          </p>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-sm font-bold text-white">
              {nome[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{nome}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
