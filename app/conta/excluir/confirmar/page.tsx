import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmarExclusaoClient from '@/components/conta/ConfirmarExclusaoClient'
import { sanitizarCaminhoInterno } from '@/lib/safe-redirect'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirmar exclusão — AgroBridge',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ t?: string }>
}

export default async function ConfirmarExclusaoPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Preserva o token no next — pós-login volta pra cá e confirma.
    const sp = await searchParams
    const caminho = sanitizarCaminhoInterno(
      sp.t ? `/conta/excluir/confirmar?t=${encodeURIComponent(sp.t)}` : '/conta/dados',
      '/conta/dados'
    )
    redirect(`/login?next=${encodeURIComponent(caminho)}`)
  }

  const sp = await searchParams
  const token = typeof sp.t === 'string' ? sp.t.trim() : ''

  return <ConfirmarExclusaoClient token={token} />
}
