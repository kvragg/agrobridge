'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, MessageSquare, Menu, X, Sprout } from 'lucide-react'
import SignOutButton from '@/components/ui/sign-out-button'

const NAV = [
  { href: '/dashboard', label: 'Processos', icon: LayoutDashboard },
  { href: '/entrevista/nova', label: 'Nova Entrevista', icon: MessageSquare },
]

interface DashboardShellProps {
  nome: string
  email: string | undefined
  children: React.ReactNode
}

export function DashboardShell({ nome, email, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const [pathnameAnterior, setPathnameAnterior] = useState(pathname)
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Overlay mobile */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#14532d] transition-transform duration-300 ease-in-out md:relative md:w-60 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo + close */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-5 md:h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Sprout className="h-4 w-4 text-[#86efac]" />
            </div>
            <span className="text-base font-black tracking-tight text-white">
              Agro<span className="text-[#86efac]">Bridge</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-sm font-bold text-white">
              {nome[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{nome}</p>
              <p className="truncate text-xs text-white/50">{email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-gray-200 bg-white px-3 md:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#14532d]">
              <Sprout className="h-3.5 w-3.5 text-[#86efac]" />
            </div>
            <span className="text-sm font-black tracking-tight text-gray-900">
              Agro<span className="text-[#16a34a]">Bridge</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
