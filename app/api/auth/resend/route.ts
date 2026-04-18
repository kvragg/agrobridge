import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { extrairIp, normalizarEmail, validarEmail } from '@/lib/validation'

const MAX_REENVIOS = 3
const JANELA_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  const ip = extrairIp(request)
  const limite = rateLimit(`resend:${ip}`, MAX_REENVIOS, JANELA_MS)

  if (!limite.ok) {
    return NextResponse.json(
      {
        erro: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limite.retryAfterSeconds) },
      }
    )
  }

  let body: { email?: string; origin?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  const email = normalizarEmail(body.email ?? '')
  const v = validarEmail(email)
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 })

  const origin =
    typeof body.origin === 'string' && /^https?:\/\//.test(body.origin)
      ? body.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin)

  const supabase = await createClient()
  // resend não revela se o email existe (comportamento genérico)
  await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  return NextResponse.json({ ok: true })
}
