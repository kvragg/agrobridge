import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminUser()
  if (!admin) {
    redirect('/login?next=/admin/compras')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-black tracking-tight text-gray-900">
              AgroBridge · <span className="text-red-700">Admin</span>
            </span>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/compras"
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                Compras
              </Link>
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
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
