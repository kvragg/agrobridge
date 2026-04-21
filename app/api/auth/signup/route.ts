import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import {
  extrairIp,
  normalizarEmail,
  sanitizarTexto,
  validarEmail,
  validarNome,
  validarSenha,
  validarWhatsApp,
} from '@/lib/validation'
import { enviarLeadNotification } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'

const MAX_CADASTROS = 3
const JANELA_MS = 60 * 60 * 1000 // 1 hora

export async function POST(request: NextRequest) {
  const ip = extrairIp(request)
  const limite = rateLimit(`signup:${ip}`, MAX_CADASTROS, JANELA_MS)

  if (!limite.ok) {
    return NextResponse.json(
      {
        erro: `Muitos cadastros deste IP. Tente novamente em ${Math.ceil(limite.retryAfterSeconds / 60)} minutos.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limite.retryAfterSeconds) },
      }
    )
  }

  let body: {
    nome?: string
    email?: string
    senha?: string
    whatsapp?: string
    origin?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  const nome = sanitizarTexto(body.nome, 120)
  const email = normalizarEmail(body.email ?? '')
  const whatsapp = sanitizarTexto(body.whatsapp, 30)
  const senha = typeof body.senha === 'string' ? body.senha : ''

  const vNome = validarNome(nome)
  if (!vNome.ok) return NextResponse.json({ erro: vNome.erro }, { status: 400 })

  const vEmail = validarEmail(email)
  if (!vEmail.ok) return NextResponse.json({ erro: vEmail.erro }, { status: 400 })

  const vWa = validarWhatsApp(whatsapp)
  if (!vWa.ok) return NextResponse.json({ erro: vWa.erro }, { status: 400 })

  const vSenha = validarSenha(senha)
  if (!vSenha.ok) return NextResponse.json({ erro: vSenha.erro }, { status: 400 })

  const origin =
    typeof body.origin === 'string' && /^https?:\/\//.test(body.origin)
      ? body.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, whatsapp },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.message === 'User already registered') {
      // Anti-enumeração (E5/APEX-SEC): resposta indistinguível do
      // caminho de sucesso. Nunca confirmar nem negar existência do
      // e-mail. Atacante perde o oráculo; usuário legítimo encontra os
      // botões "Reenviar confirmação" e "Fazer login" na tela de
      // confirmação. Lead notification NÃO é disparada (canal lateral).
      console.info('[signup] tentativa de re-registro silenciosamente ignorada')
      return NextResponse.json({ ok: true, temSessao: false })
    }
    return NextResponse.json(
      { erro: error.message || 'Erro ao criar conta.' },
      { status: 400 }
    )
  }

  // Notifica lead — falha não bloqueia cadastro
  try {
    await enviarLeadNotification({ nome, email, whatsapp })
  } catch (e) {
    console.error('[signup] erro ao notificar lead:', e)
  }

  // Audit (E4): fire-and-forget.
  void logAuditEvent({
    userId: data.user?.id ?? null,
    eventType: 'signup',
    request,
    payload: { tem_sessao: Boolean(data.session) },
  })

  // Se já houver sessão (email confirmation off), informar client
  const temSessao = Boolean(data.session)
  return NextResponse.json({ ok: true, temSessao })
}
