import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarPagamentoConfirmado } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 30

// Pagar.me posts events to this endpoint. We only act on charge.paid
// (paga em dinheiro real via PIX). Outros eventos são registrados.
// Auth: Pagar.me envia Basic auth com o "endpoint secret" configurado no dashboard.
// Referência: https://docs.pagar.me/docs/webhooks

interface PagarmePayload {
  id?: string
  type?: string
  data?: {
    id?: string
    status?: string
    paid_at?: string
    order?: { id?: string; metadata?: Record<string, string> }
    metadata?: Record<string, string>
  }
}

function checarAuth(req: NextRequest): boolean {
  const expected = process.env.PAGARME_WEBHOOK_SECRET
  if (!expected) {
    // Em dev/stage sem secret definido, aceita tudo — mas loga.
    console.warn('[pagamento/webhook] PAGARME_WEBHOOK_SECRET não configurado')
    return true
  }
  const header = req.headers.get('authorization') ?? ''
  if (!header.toLowerCase().startsWith('basic ')) return false
  const token = header.slice(6).trim()
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [user, pass] = decoded.split(':')
    return user === expected || pass === expected
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!checarAuth(request)) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as PagarmePayload | null
  if (!payload?.type) {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  // Eventos úteis: charge.paid, charge.payment_failed, order.paid
  const ev = payload.type
  const charge = payload.data
  const processoId =
    charge?.metadata?.processo_id ?? charge?.order?.metadata?.processo_id

  if (!processoId) {
    console.warn('[pagamento/webhook] evento sem processo_id', ev)
    return Response.json({ ok: true, ignored: true })
  }

  const supabase = createAdminClient()
  const { data: processo } = await supabase
    .from('processos')
    .select('id, user_id, perfil_json')
    .eq('id', processoId)
    .single()

  if (!processo) {
    return Response.json({ ok: true, ignored: 'processo não encontrado' })
  }

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const pagamento = (perfilJson._pagamento ?? {}) as Record<string, unknown>

  if (ev === 'charge.paid' || ev === 'order.paid') {
    const atualizado = {
      ...pagamento,
      status: 'paid',
      pago_em: charge?.paid_at ?? new Date().toISOString(),
      evento: ev,
    }
    await supabase
      .from('processos')
      .update({ perfil_json: { ...perfilJson, _pagamento: atualizado } })
      .eq('id', processoId)

    // Buscar email do usuário para notificar
    const { data: userData } = await supabase.auth.admin.getUserById(processo.user_id)
    const email = userData.user?.email
    if (email) {
      const perfilBloco = (perfilJson.perfil ?? {}) as { nome?: string }
      const nome = perfilBloco.nome || email.split('@')[0]
      const valorCent = (pagamento.valor_centavos as number | undefined) ?? 29700
      try {
        await enviarPagamentoConfirmado({
          to: email,
          nome,
          valor: valorCent / 100,
          processoId,
        })
      } catch (err) {
        console.error('[pagamento/webhook] falha email', err)
      }
    }
    return Response.json({ ok: true, status: 'paid' })
  }

  if (ev === 'charge.payment_failed') {
    await supabase
      .from('processos')
      .update({
        perfil_json: {
          ...perfilJson,
          _pagamento: { ...pagamento, status: 'failed', evento: ev },
        },
      })
      .eq('id', processoId)
    return Response.json({ ok: true, status: 'failed' })
  }

  return Response.json({ ok: true, ignored: ev })
}
