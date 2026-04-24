import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarPagamentoConfirmado } from '@/lib/email/resend'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao, logger } from '@/lib/logger'
import { type Tier, TIER_PRECO_CENTAVOS } from '@/lib/tier'
import { tierParaPlano } from '@/lib/plano'

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
    capturarErroProducao(
      new Error('CAKTO_WEBHOOK_SECRET ausente — request negado'),
      { modulo: 'pagamento/webhook' }
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
    logger.info({
      msg: 'evento ignorado',
      modulo: 'pagamento/webhook',
      eventId,
      extra: { evento: ev },
    })
    return Response.json({ ok: true, ignored: ev })
  }

  // Resolve processo_id em chain — Cakto pode entregar de 4 formas:
  //   (i)  metadata.processo_id  (Cakto Pro / planos com metadata)
  //   (ii) data.ref              (Cakto propaga `?ref=<id>` da URL do checkout)
  //   (iii) lookup pelo email     (último processo aberto do user)
  //   (iv) auto-cria processo    (user existe mas nunca abriu processo —
  //                               caso típico: paga antes de começar a entrevista)
  const supabase = createAdminClient()
  const processoId = await resolveProcessoId(supabase, data)

  if (!processoId) {
    // Registra em compras como "orfao" para o admin reprocessar manualmente
    // (user não existe no Supabase ou email ausente).
    await registrarCompraOrfa(supabase, data, ev, eventId, payload)
    logger.warn({
      msg: 'compra orfa — user nao encontrado',
      modulo: 'pagamento/webhook',
      eventId,
      extra: { evento: ev, email: data.customer?.email },
    })
    return Response.json({ ok: true, ignored: 'sem_user_lookup' })
  }

  // Determina o tier a partir do produto Cakto
  const tier = mapProdutoParaTier(data.product?.id ?? data.product?.offer_id)
  if (!tier) {
    capturarErroProducao(
      new Error('produto Cakto não mapeado para tier'),
      {
        modulo: 'pagamento/webhook',
        extra: {
          productId: data.product?.id ?? null,
          offerId: data.product?.offer_id ?? null,
        },
      }
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
      p_amount_cents: valorCentavos,
      p_product_id: data.product?.id ?? data.product?.offer_id ?? null,
    }
  )

  if (error) {
    capturarErroProducao(error, {
      modulo: 'pagamento/webhook',
      extra: { rpc: 'confirmar_pagamento_v2', processoId, eventId },
    })
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
      const planoLabel = tierParaPlano(tier)
      await enviarPagamentoConfirmado({
        to: row.email,
        nome,
        valor: valorCentavos / 100,
        processoId,
        tierNome: planoLabel === 'Free' ? undefined : planoLabel,
      })
    } catch (err) {
      capturarErroProducao(err, {
        modulo: 'pagamento/webhook',
        userId: row.user_id,
        extra: { etapa: 'email_confirmacao' },
      })
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
    logger.warn({
      msg: 'email sem user no Supabase',
      modulo: 'pagamento/webhook',
      extra: { email },
    })
    return null
  }

  // (iii) — tenta pegar um processo aberto existente
  const { data: procRow, error: procErr } = await supabase
    .from('processos')
    .select('id')
    .eq('user_id', userId)
    .eq('pagamento_confirmado', false)
    .is('deleted_at', null)
    .neq('status', 'concluido')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (procErr) {
    capturarErroProducao(procErr, {
      modulo: 'pagamento/webhook',
      userId,
      extra: { etapa: 'lookup_processo_por_email' },
    })
    return null
  }
  if (procRow?.id) return procRow.id

  // (iv) — user existe mas nunca criou processo: cria um placeholder
  // para que o RPC v2 tenha onde gravar o tier + pagamento_confirmado.
  const { data: novoProc, error: novoErr } = await supabase
    .from('processos')
    .insert({
      user_id: userId,
      status: 'entrevista',
      fase: 'pagamento',
    })
    .select('id')
    .single()

  if (novoErr || !novoProc) {
    capturarErroProducao(
      novoErr ?? new Error('insert processo retornou null'),
      {
        modulo: 'pagamento/webhook',
        userId,
        extra: { etapa: 'auto_criar_processo_orfao' },
      }
    )
    return null
  }
  logger.info({
    msg: 'processo auto-criado para pagamento orfao',
    modulo: 'pagamento/webhook',
    userId,
    extra: { processoId: novoProc.id, email },
  })
  return novoProc.id
}

// Grava uma compra "orfã" (sem user identificado) na tabela `compras` via
// RPC admin para o painel admin reprocessar manualmente. Se email ausente
// ou user não encontrado, nada a fazer — grava em log estruturado.
async function registrarCompraOrfa(
  _supabase: ReturnType<typeof createAdminClient>,
  data: CaktoData,
  evento: string,
  eventId: string,
  payload: CaktoPayload
): Promise<void> {
  try {
    await _supabase.from('webhook_events').insert({
      provider: 'cakto',
      event_id: `orfa_${eventId}`,
      payload: {
        ...(payload as unknown as Record<string, unknown>),
        _orfa: true,
        _evento: evento,
        _email: data.customer?.email ?? null,
      },
    })
  } catch (err) {
    capturarErroProducao(err, {
      modulo: 'pagamento/webhook',
      extra: { etapa: 'gravar_orfa_webhook_events', eventId },
    })
  }
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
