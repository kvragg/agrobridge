import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarEmail, validarEmail } from '@/lib/validation'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'

// POST /api/conta/email-alternativo
//   Body: { email: string }
//   Cadastra/atualiza email pessoal alternativo no perfis_lead pra
//   recebimento duplo de emails críticos (quando email principal é
//   corporativo). Self-service — só user logado mexe no próprio.
//
// DELETE /api/conta/email-alternativo
//   Remove email alternativo (volta a só receber no principal).

const MAX_OPS = 10
const JANELA_MS = 60 * 60 * 1000 // 1h

async function sessaoUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user || !user.email) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const limite = await rateLimitRemoto(
    `email-alt:${user.id}`,
    MAX_OPS,
    JANELA_MS,
  )
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Muitas atualizações. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  const email = normalizarEmail(body.email ?? '')
  const v = validarEmail(email)
  if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 })

  if (email.toLowerCase() === user.email.toLowerCase()) {
    return NextResponse.json(
      { erro: 'O email alternativo precisa ser diferente do email principal.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('perfis_lead')
    .update({ email_alternativo: email })
    .eq('user_id', user.id)

  if (error) {
    capturarErroProducao(error, {
      modulo: 'conta/email-alternativo',
      userId: user.id,
      extra: { etapa: 'update', op: 'POST' },
    })
    return NextResponse.json(
      { erro: 'Falha ao salvar. Tente de novo.' },
      { status: 500 },
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: { campos_alterados: ['email_alternativo'] },
  })

  return NextResponse.json({ ok: true, email_alternativo: email })
}

export async function DELETE(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user || !user.email) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('perfis_lead')
    .update({ email_alternativo: null })
    .eq('user_id', user.id)

  if (error) {
    capturarErroProducao(error, {
      modulo: 'conta/email-alternativo',
      userId: user.id,
      extra: { etapa: 'update', op: 'DELETE' },
    })
    return NextResponse.json(
      { erro: 'Falha ao remover. Tente de novo.' },
      { status: 500 },
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: { campos_alterados: ['email_alternativo'], removed: true },
  })

  return NextResponse.json({ ok: true })
}
