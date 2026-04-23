import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const ABAS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/compras', label: 'Compras' },
  { href: '/admin/debug', label: 'Debug' },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminUser()
  if (!admin) {
    redirect('/login?next=/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-black tracking-tight text-gray-900">
                AgroBridge · <span className="text-red-700">Admin</span>
              </span>
              <nav className="flex gap-1 text-sm">
                {ABAS.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="rounded-md px-3 py-1 font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    {a.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{admin.email}</span>
              <Link
                href="/dashboard"
                className="rounded-md border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100"
              >
                Sair do admin
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
