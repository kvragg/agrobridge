// Server-only — Pagar.me v5 (Core API)
// Docs: https://docs.pagar.me/reference/visao-geral-da-api

const API_BASE = 'https://api.pagar.me/core/v5'

function auth(): string {
  const key = process.env.PAGARME_API_KEY
  if (!key) throw new Error('PAGARME_API_KEY não configurada no servidor.')
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

export interface PixCharge {
  orderId: string
  chargeId: string
  status: string
  qrCode: string
  qrCodeUrl: string
  expiresAt: string | null
  valorCentavos: number
}

export interface CriarPixInput {
  valorCentavos: number
  cliente: {
    nome: string
    email: string
    cpf?: string
  }
  processoId: string
  descricao: string
}

export async function criarCobrancaPix(input: CriarPixInput): Promise<PixCharge> {
  const postbackUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'
  }/api/pagamento/webhook`

  const body = {
    code: `agrobridge-${input.processoId}`,
    customer: {
      name: input.cliente.nome,
      email: input.cliente.email,
      type: 'individual',
      ...(input.cliente.cpf
        ? {
            document: input.cliente.cpf.replace(/\D/g, ''),
            document_type: 'cpf',
          }
        : {}),
    },
    items: [
      {
        amount: input.valorCentavos,
        description: input.descricao,
        quantity: 1,
        code: 'dossie-agrobridge',
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: 60 * 60, // 1h
          additional_information: [
            { name: 'Processo', value: input.processoId },
          ],
        },
      },
    ],
    metadata: {
      processo_id: input.processoId,
    },
    closed: true,
    notification_urls: [postbackUrl],
  }

  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Pagar.me criar pix falhou: ${res.status} ${txt}`)
  }

  const data = (await res.json()) as {
    id: string
    charges: Array<{
      id: string
      status: string
      last_transaction: {
        qr_code: string
        qr_code_url: string
        expires_at?: string
      }
    }>
  }

  const charge = data.charges?.[0]
  if (!charge) throw new Error('Pagar.me não retornou cobrança PIX')

  return {
    orderId: data.id,
    chargeId: charge.id,
    status: charge.status,
    qrCode: charge.last_transaction.qr_code,
    qrCodeUrl: charge.last_transaction.qr_code_url,
    expiresAt: charge.last_transaction.expires_at ?? null,
    valorCentavos: input.valorCentavos,
  }
}

export interface StatusCharge {
  id: string
  status: string
  paidAt: string | null
}

export async function consultarCharge(chargeId: string): Promise<StatusCharge> {
  const res = await fetch(`${API_BASE}/charges/${chargeId}`, {
    headers: { Authorization: auth() },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Pagar.me consulta falhou: ${res.status} ${txt}`)
  }
  const data = (await res.json()) as {
    id: string
    status: string
    paid_at?: string
  }
  return {
    id: data.id,
    status: data.status,
    paidAt: data.paid_at ?? null,
  }
}
