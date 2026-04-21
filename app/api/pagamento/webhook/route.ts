import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarPagamentoConfirmado } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'
import { type Tier, TIER_PRECO_CENTAVOS } from '@/lib/tier'

export const runtime = 'nodejs'
export const maxDuration = 30

// ============================================================
// Webhook Cakto — confirmar_pagamento_v2 (provider + tier)
// ============================================================
// Cakto envia eventos como `purchase_approved` / `subscription_*`
// num payload JSON. A autenticação é feita por:
//   (a) HMAC-SHA256 do corpo cru no header `x-cakto-signature`, OU
//   (b) campo `secret` dentro do payload (planos básicos do Cakto).
// O webhook aceita ambos os modos — o secret é o mesmo
// (CAKTO_WEBHOOK_SECRET). O modo HMAC é preferido quando disponível.
//
// Mapeamento produto → tier via env vars:
//   CAKTO_PRODUTO_DIAGNOSTICO  → tier `diagnostico`
//   CAKTO_PRODUTO_DOSSIE       → tier `dossie`
//   CAKTO_PRODUTO_MENTORIA     → tier `mentoria`
//
// Idempotência atômica continua via RPC (provider='cakto', event_id).
// ============================================================

interface CaktoCustomer {
  email?: string
  name?: string
  document?: string
}

interface CaktoProduct {
  id?: string
  name?: string
  offer_id?: string
}

interface CaktoData {
  id?: string
  amount?: number
  status?: string
  paid_at?: string
  customer?: CaktoCustomer
  product?: CaktoProduct
  // Cakto permite metadata em alguns planos
  metadata?: Record<string, string>
  // Query param `?ref=...` propagado em alguns planos do Cakto
  ref?: string
}

interface CaktoPayload {
  event?: string
  secret?: string
  data?: CaktoData
}

const EVENTOS_APROVACAO = new Set([
  'purchase_approved',
  'subscription_created',
  'subscription_renewed',
])

function checarAuth(req: NextRequest, rawBody: string, payload: CaktoPayload): boolean {
  const secret = process.env.CAKTO_WEBHOOK_SECRET
  if (!secret) {
    console.error(
      '[pagamento/webhook] CAKTO_WEBHOOK_SECRET ausente — request negado'
    )
    return false
  }

  // Modo (a) — HMAC no header (Cakto Pro)
  const sigHeader =
    req.headers.get('x-cakto-signature') ?? req.headers.get('x-signature') ?? ''
  if (sigHeader) {
    const hex = sigHeader.replace(/^sha256=/, '').trim()
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')
    const a = Buffer.from(hex)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    try {
      return crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  // Modo (b) — secret no payload (Cakto básico)
  if (payload.secret && typeof payload.secret === 'string') {
    const a = Buffer.from(payload.secret)
    const b = Buffer.from(secret)
    if (a.length !== b.length) return false
    try {
      return crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  return false
}

function mapProdutoParaTier(productId: string | undefined): Tier | null {
  if (!productId) return null
  const map: Record<string, Tier> = {
    [process.env.CAKTO_PRODUTO_DIAGNOSTICO ?? '']: 'diagnostico',
    [process.env.CAKTO_PRODUTO_DOSSIE ?? '']: 'dossie',
    [process.env.CAKTO_PRODUTO_MENTORIA ?? '']: 'mentoria',
  }
  delete map['']
  return map[productId] ?? null
}

interface ConfirmarPagamentoV2Row {
  first_time: boolean
  motivo: string
  fase_antes: string | null
  fase_depois: string | null
  user_id: string | null
  email: string | null
  tier: string | null
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  let payload: CaktoPayload | null = null
  try {
    payload = JSON.parse(rawBody) as CaktoPayload
  } catch {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }
  if (!payload?.event || !payload?.data?.id) {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  if (!checarAuth(request, rawBody, payload)) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const ev = payload.event
  const data = payload.data!
  const eventId = data.id! // Cakto usa o id da transação como identificador único

  if (!EVENTOS_APROVACAO.has(ev)) {
    console.info('[pagamento/webhook] evento ignorado', ev, eventId)
    return Response.json({ ok: true, ignored: ev })
  }

  // Resolve processo_id em chain — Cakto pode entregar de 3 formas:
  //   (i)  metadata.processo_id  (Cakto Pro / planos com metadata)
  //   (ii) data.ref              (Cakto propaga `?ref=<id>` da URL do checkout)
  //   (iii) lookup pelo email do customer (último processo aberto do user)
  const supabase = createAdminClient()
  const processoId = await resolveProcessoId(supabase, data)

  if (!processoId) {
    console.warn(
      '[pagamento/webhook] evento sem processo_id (metadata/ref/email)',
      ev,
      eventId,
      { email: data.customer?.email }
    )
    return Response.json({ ok: true, ignored: 'sem_processo_id' })
  }

  // Determina o tier a partir do produto Cakto
  const tier = mapProdutoParaTier(data.product?.id ?? data.product?.offer_id)
  if (!tier) {
    console.error(
      '[pagamento/webhook] produto Cakto não mapeado para tier',
      data.product
    )
    return Response.json(
      { erro: 'Produto não reconhecido — verifique CAKTO_PRODUTO_*' },
      { status: 400 }
    )
  }

  // Defesa: se um valor veio no payload e diverge muito do tier (ex.: cupom
  // gigante ou valor zero), loga mas confirma — quem decide o tier é o
  // produto, não o valor.
  const valorCentavos = data.amount ?? TIER_PRECO_CENTAVOS[tier]

  const { data: rpcData, error } = await supabase.rpc(
    'confirmar_pagamento_v2',
    {
      p_processo_id: processoId,
      p_event_id: eventId,
      p_evento: ev,
      p_provider: 'cakto',
      p_tier: tier,
      p_raw: payload as unknown as Record<string, unknown>,
    }
  )

  if (error) {
    console.error('[pagamento/webhook] RPC confirmar_pagamento_v2 falhou', error)
    return Response.json({ erro: 'Falha ao processar' }, { status: 500 })
  }

  const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
    | ConfirmarPagamentoV2Row
    | null
    | undefined

  if (!row || !row.first_time) {
    return Response.json({
      ok: true,
      duplicate: true,
      motivo: row?.motivo ?? 'desconhecido',
      tier: row?.tier ?? null,
    })
  }

  // Email de confirmação — só na PRIMEIRA confirmação
  if (row.email) {
    const nome =
      data.customer?.name?.trim() ||
      row.email.split('@')[0]
    try {
      await enviarPagamentoConfirmado({
        to: row.email,
        nome,
        valor: valorCentavos / 100,
        processoId,
      })
    } catch (err) {
      console.error('[pagamento/webhook] falha email', err)
    }
  }

  void logAuditEvent({
    userId: row.user_id,
    eventType: 'pagamento_confirmado',
    targetId: processoId,
    request,
    payload: {
      provider: 'cakto',
      event_id: eventId,
      tier,
      valor_centavos: valorCentavos,
    },
  })

  return Response.json({
    ok: true,
    status: 'paid',
    fase: row.fase_depois,
    tier,
  })
}

// ----------------------------------------------------------------
// Resolve o processo_id do payload Cakto em chain de fallback:
//   (i)  data.metadata.processo_id  — quando Cakto Pro propaga metadata
//   (ii) data.ref                   — quando Cakto propaga `?ref=` da URL
//   (iii) lookup pelo customer.email — pega o último processo aberto do user
// Retorna null só se nenhuma estratégia funcionar.
// ----------------------------------------------------------------
async function resolveProcessoId(
  supabase: ReturnType<typeof createAdminClient>,
  data: CaktoData
): Promise<string | null> {
  const fromMetadata = data.metadata?.processo_id?.trim()
  if (fromMetadata) return fromMetadata

  const fromRef = data.ref?.trim()
  if (fromRef) return fromRef

  const email = data.customer?.email?.trim().toLowerCase()
  if (!email) return null

  const userId = await findUserIdByEmail(email)
  if (!userId) {
    console.warn('[pagamento/webhook] email sem user no Supabase', email)
    return null
  }

  const { data: procRow, error: procErr } = await supabase
    .from('processos')
    .select('id')
    .eq('user_id', userId)
    .eq('pagamento_confirmado', false)
    .neq('status', 'concluido')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (procErr) {
    console.error('[pagamento/webhook] falha lookup processo por email', procErr.message)
    return null
  }
  return procRow?.id ?? null
}

// supabase-js v2.103 não expõe getUserByEmail; chamamos a admin REST API
// do GoTrue diretamente. Aceita ambas as respostas conhecidas (objeto direto
// ou `{ users: [...] }`) para resiliência entre versões do GoTrue.
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
