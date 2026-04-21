import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Bloqueia open redirect: só aceita caminhos relativos internos.
function sanitizeNext(raw: string | null): string {
  const fallback = '/auth/confirmado'
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//')) return fallback
  if (raw.startsWith('/\\')) return fallback
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?erro=confirmacao`
  )
}
