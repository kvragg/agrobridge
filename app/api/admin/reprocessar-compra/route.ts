import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarPagamentoConfirmado } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'
import type { Tier } from '@/lib/tier'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST /api/admin/reprocessar-compra
// Sintetiza um evento Cakto + chama RPC `confirmar_pagamento_v2`.
// Usado quando:
//   - Webhook não chegou (outage Cakto, URL errada)
//   - Admin quer liberar tier manual (ex.: afiliado, cortesia)
//   - Reprocessar compra órfã após cadastro do user
//
// Idempotente via UNIQUE (provider, provider_transaction_id) em compras.
// Se o TX id já existe → RPC retorna event_replay, endpoint retorna 200 no-op.

interface Body {
  email?: string
  tier?: string
  amount_cents?: number
  transaction_id?: string
  product_id?: string
}

const TIERS_VALIDOS: readonly Tier[] = ['diagnostico', 'dossie', 'mentoria']

export async function POST(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Body
  const email = body.email?.trim().toLowerCase()
  const tier = body.tier as Tier | undefined
  const amountCents = body.amount_cents
  const transactionId =
    body.transaction_id?.trim() || `manual_${Date.now()}`
  const productId = body.product_id?.trim() || null

  if (!email || !tier || !TIERS_VALIDOS.includes(tier)) {
    return NextResponse.json(
      { erro: 'email + tier (diagnostico|dossie|mentoria) obrigatórios' },
      { status: 400 }
    )
  }
  if (
    typeof amountCents !== 'number' ||
    !Number.isFinite(amountCents) ||
    amountCents < 0
  ) {
    return NextResponse.json(
      { erro: 'amount_cents deve ser inteiro >= 0' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const userId = await findUserIdByEmail(email)
  if (!userId) {
    return NextResponse.json(
      {
        erro:
          'Email não cadastrado no Supabase. Peça ao user para criar conta em /cadastro e tente de novo.',
      },
      { status: 404 }
    )
  }

  // Resolve processo_id (último aberto) ou cria placeholder
  const { data: procRow } = await supabase
    .from('processos')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let processoId: string
  if (procRow?.id) {
    processoId = procRow.id
  } else {
    const { data: novoProc, error: novoErr } = await supabase
      .from('processos')
      .insert({ user_id: userId, status: 'entrevista', fase: 'pagamento' })
      .select('id')
      .single()
    if (novoErr || !novoProc) {
      return NextResponse.json(
        {
          erro: 'Falha ao criar processo para o user',
          detalhe: novoErr?.message,
        },
        { status: 500 }
      )
    }
    processoId = novoProc.id
  }

  const eventId = transactionId
  const payload = {
    event: 'purchase_approved',
    source: 'admin_reprocessar',
    reprocessado_por: admin.email,
    data: {
      id: transactionId,
      amount: amountCents,
      status: 'paid',
      paid_at: new Date().toISOString(),
      customer: { email },
      product: { id: productId ?? `manual_${tier}` },
    },
  }

  const { data: rpcData, error } = await supabase.rpc(
    'confirmar_pagamento_v2',
    {
      p_processo_id: processoId,
      p_event_id: eventId,
      p_evento: 'purchase_approved',
      p_provider: 'cakto',
      p_tier: tier,
      p_raw: payload as unknown as Record<string, unknown>,
      p_amount_cents: amountCents,
      p_product_id: productId ?? `manual_${tier}`,
    }
  )

  if (error) {
    console.error('[admin/reprocessar] RPC falhou', error)
    void logAuditEvent({
      userId: admin.id,
      eventType: 'pagamento_confirmado',
      targetId: processoId,
      request,
      payload: {
        source: 'admin_reprocessar',
        para_email: email,
        tier,
        amount_cents: amountCents,
        motivo_rpc: 'rpc_error',
        erro: error.message,
        erro_code: error.code ?? null,
        erro_details: error.details ?? null,
        erro_hint: error.hint ?? null,
      },
    })
    return NextResponse.json(
      {
        erro: 'RPC falhou',
        detalhe: error.message,
        code: error.code ?? null,
        hint: error.hint ?? null,
      },
      { status: 500 }
    )
  }

  const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
    | {
        first_time: boolean
        motivo: string
        email: string | null
        tier: string | null
        user_id: string | null
      }
    | null
    | undefined

  void logAuditEvent({
    userId: admin.id,
    eventType: 'pagamento_confirmado',
    targetId: processoId,
    request,
    payload: {
      source: 'admin_reprocessar',
      para_email: email,
      tier,
      amount_cents: amountCents,
      motivo_rpc: row?.motivo ?? 'desconhecido',
    },
  })

  // Envia email de confirmação apenas na primeira vez (evita spam)
  if (row?.first_time && row.email) {
    try {
      await enviarPagamentoConfirmado({
        to: row.email,
        nome: row.email.split('@')[0],
        valor: amountCents / 100,
        processoId,
      })
    } catch (err) {
      console.error('[admin/reprocessar] falha email', err)
    }
  }

  return NextResponse.json({
    ok: true,
    motivo: row?.motivo ?? 'ok',
    first_time: row?.first_time ?? false,
    user_id: userId,
    processo_id: processoId,
    tier: row?.tier ?? tier,
  })
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const url =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users` +
    `?email=${encodeURIComponent(email)}`
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    },
  })
  if (!res.ok) return null
  const json = (await res.json()) as
    | { id?: string; email?: string }
    | { users?: Array<{ id: string; email?: string }> }
  if ('id' in json && typeof json.id === 'string') return json.id
  if ('users' in json && Array.isArray(json.users)) {
    const exact = json.users.find(
      (u) => (u.email ?? '').toLowerCase() === email
    )
    return exact?.id ?? null
  }
  return null
}
