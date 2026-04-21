import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/audit'
import { enviarConfirmacaoExclusao } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 30

// ============================================================
// POST /api/conta/excluir — Exclusão de conta (LGPD Art. 18 VI)
// ============================================================
// Fluxo de dupla confirmação — evita botão fatal + mitiga
// sequestro de sessão:
//
//   Step 1 (body vazio):
//     - Gera token 32 bytes random, grava SHA-256 em
//       `pedidos_exclusao_conta` (status='pendente', TTL 30 min)
//     - Envia email com link /conta/excluir/confirmar?t=<token>
//     - Resposta SEMPRE 202 indistinguível (anti-enumeração)
//
//   Step 2 (body = { token: '<token>' }):
//     - Hash e lookup; se pendente e não expirou:
//       * chama RPC soft_delete_user_data()
//       * anonimiza auth.users (email → deleted_<uuid>@agrobridge.invalid)
//       * marca pedido status='confirmado'
//       * grava audit 'conta_excluida'
//       * invalida sessão (remove cookies)
//     - Senão: 400 com motivo genérico
//
// Rate limits:
//   - Step 1: 3/h por user (evita spam de emails)
//   - Step 2: 10/h por IP (evita brute force do token de 32 bytes
//     mesmo sendo impossível; defense-in-depth)
// ============================================================

const TTL_MIN = 30

interface BodyConfirm {
  token?: string
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as BodyConfirm
  const token = body?.token?.trim()

  // ─── Step 2 — confirmação ──────────────────────────────────
  if (token) {
    return confirmarExclusao(request, user.id, token)
  }

  // ─── Step 1 — solicitação ──────────────────────────────────
  const limite = rateLimit(`conta:excluir:step1:${user.id}`, 3, 60 * 60 * 1000)
  if (!limite.ok) {
    return Response.json(
      {
        erro: 'Muitas solicitações. Tente novamente em alguns minutos.',
      },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const admin = createAdminClient()
  const tokenRaw = crypto.randomBytes(32).toString('hex')
  const hash = tokenHash(tokenRaw)
  const expiraEm = new Date(Date.now() + TTL_MIN * 60 * 1000)

  const { error: insErr } = await admin.from('pedidos_exclusao_conta').insert({
    user_id: user.id,
    token_hash: hash,
    ip: extrairIp(request),
    user_agent: request.headers.get('user-agent'),
    expira_em: expiraEm.toISOString(),
    status: 'pendente',
  })
  if (insErr) {
    console.error('[api/conta/excluir] falha registrar pedido', insErr.message)
    return Response.json({ erro: 'Falha ao processar' }, { status: 500 })
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'conta_exclusao_solicitada',
    request,
    payload: { ttl_minutos: TTL_MIN },
  })

  if (user.email) {
    const nome =
      (typeof user.user_metadata?.nome === 'string' && user.user_metadata.nome) ||
      user.email.split('@')[0]
    const urlConfirmacao = `${baseUrl()}/conta/excluir/confirmar?t=${encodeURIComponent(
      tokenRaw
    )}`
    void enviarConfirmacaoExclusao({
      to: user.email,
      nome,
      urlConfirmacao,
      expiraEmMinutos: TTL_MIN,
    }).catch((err) =>
      console.error('[api/conta/excluir] falha email confirmacao', err)
    )
  }

  // 202 Accepted — processamento pendente de confirmação.
  return Response.json(
    {
      ok: true,
      mensagem:
        'Enviamos um e-mail com o link de confirmação. O link expira em ' +
        TTL_MIN +
        ' minutos.',
    },
    { status: 202 }
  )
}

async function confirmarExclusao(
  request: NextRequest,
  userId: string,
  token: string
): Promise<Response> {
  const ip = extrairIp(request) ?? 'sem-ip'
  const limite = rateLimit(`conta:excluir:step2:${ip}`, 10, 60 * 60 * 1000)
  if (!limite.ok) {
    return Response.json(
      { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const admin = createAdminClient()
  const hash = tokenHash(token)

  // Lookup restrito ao próprio user (defense-in-depth: mesmo com token
  // vazado, só consome para o user logado).
  const { data: pedido, error: qerr } = await admin
    .from('pedidos_exclusao_conta')
    .select('id, user_id, status, expira_em')
    .eq('token_hash', hash)
    .eq('user_id', userId)
    .maybeSingle()

  if (qerr) {
    console.error('[api/conta/excluir] falha lookup token', qerr.message)
    return Response.json({ erro: 'Falha ao processar' }, { status: 500 })
  }

  if (!pedido || pedido.status !== 'pendente') {
    return Response.json(
      { erro: 'Token inválido ou já utilizado.' },
      { status: 400 }
    )
  }

  const expira = new Date(pedido.expira_em).getTime()
  if (Number.isNaN(expira) || expira < Date.now()) {
    await admin
      .from('pedidos_exclusao_conta')
      .update({ status: 'expirado' })
      .eq('id', pedido.id)
    return Response.json({ erro: 'Token expirado.' }, { status: 400 })
  }

  // Executa soft-delete em cascata via RPC (SECURITY DEFINER)
  const { data: resumo, error: rpcErr } = await admin.rpc('soft_delete_user_data', {
    p_user_id: userId,
  })
  if (rpcErr) {
    console.error('[api/conta/excluir] RPC soft_delete falhou', rpcErr.message)
    return Response.json({ erro: 'Falha ao excluir dados' }, { status: 500 })
  }

  // Anonimiza email do auth.users — evita conflito UNIQUE se o user
  // voltar a criar conta com o mesmo email, e remove PII primário.
  // admin.auth.admin.updateUserById é idempotente.
  const emailAnonimo = `deleted_${userId}@agrobridge.invalid`
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    email: emailAnonimo,
    user_metadata: { excluido_em: new Date().toISOString() },
    ban_duration: '876000h', // ~100 anos — bloqueia login
  })
  if (authErr) {
    console.error('[api/conta/excluir] falha anonimizar auth.users', authErr.message)
    // Não aborta — soft-delete já aconteceu. Fica para reconciliação manual.
  }

  await admin
    .from('pedidos_exclusao_conta')
    .update({ status: 'confirmado', confirmado_em: new Date().toISOString() })
    .eq('id', pedido.id)

  void logAuditEvent({
    userId,
    eventType: 'conta_excluida',
    request,
    payload: {
      resumo: Array.isArray(resumo) ? resumo[0] : resumo,
      email_anonimizado: emailAnonimo,
    },
  })

  // Invalida sessão local — cliente precisa re-login para qualquer ação.
  await supabaseSignOut(request)

  return Response.json({
    ok: true,
    mensagem: 'Conta excluída. Você será desconectado.',
  })
}

async function supabaseSignOut(request: NextRequest): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[api/conta/excluir] falha signOut', err)
  }
  void request
}

function extrairIp(request: NextRequest): string | null {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip') ?? null
}
