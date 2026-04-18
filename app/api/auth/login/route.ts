import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { extrairIp, normalizarEmail, validarEmail } from '@/lib/validation'

const MAX_TENTATIVAS = 5
const JANELA_MS = 15 * 60 * 1000 // 15 minutos

export async function POST(request: NextRequest) {
  const ip = extrairIp(request)
  const limite = rateLimit(`login:${ip}`, MAX_TENTATIVAS, JANELA_MS)

  if (!limite.ok) {
    return NextResponse.json(
      {
        erro: `Muitas tentativas. Tente novamente em ${Math.ceil(limite.retryAfterSeconds / 60)} minutos.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limite.retryAfterSeconds) },
      }
    )
  }

  let body: { email?: string; senha?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  const email = normalizarEmail(body.email ?? '')
  const senha = typeof body.senha === 'string' ? body.senha : ''

  const vEmail = validarEmail(email)
  if (!vEmail.ok) {
    return NextResponse.json({ erro: vEmail.erro }, { status: 400 })
  }
  if (!senha || senha.length < 1 || senha.length > 200) {
    return NextResponse.json({ erro: 'Senha inválida.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('email not confirmed')) {
      return NextResponse.json(
        {
          erro: 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e spam.',
          codigo: 'email_nao_confirmado',
        },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { erro: 'E-mail ou senha incorretos.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
