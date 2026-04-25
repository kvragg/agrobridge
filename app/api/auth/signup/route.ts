import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
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
import { capturarErroProducao, logger } from '@/lib/logger'

const MAX_CADASTROS = 3
const JANELA_MS = 60 * 60 * 1000 // 1 hora

export async function POST(request: NextRequest) {
  const ip = extrairIp(request)
  const limite = await rateLimitRemoto(`signup:${ip}`, MAX_CADASTROS, JANELA_MS)

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
      // E-mail já cadastrado. Pra preservar anti-enumeração (E5) sem
      // deixar o lead legítimo esperando email que nunca vem (Bug A
      // 2026-04-25), tentamos autenticar com a senha que ele já forneceu:
      //  - Se senha correta + email confirmado: criamos sessão e
      //    sinalizamos temSessao=true → frontend vai pra /planos (mesmo
      //    caminho de cadastro novo com sessão imediata).
      //  - Se senha errada OU email não-confirmado: respondemos
      //    indistinguível do caminho de sucesso (anti-enumeração mantida
      //    — atacante sem senha continua sem oráculo).
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password: senha })
      if (!signInError && signInData.session) {
        logger.info({
          msg: 're-registro com senha válida → login automático',
          modulo: 'signup',
        })
        void logAuditEvent({
          userId: signInData.user?.id ?? null,
          eventType: 'signup_resignup_logged_in',
          request,
          payload: { ja_existia: true, ja_confirmado: true },
        })
        return NextResponse.json({ ok: true, temSessao: true, jaExistia: true })
      }

      logger.info({
        msg: 'tentativa de re-registro silenciosamente ignorada',
        modulo: 'signup',
      })
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
    capturarErroProducao(e, {
      modulo: 'signup',
      userId: data.user?.id ?? null,
      extra: { etapa: 'notificar_lead' },
    })
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
