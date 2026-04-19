import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { criarCobrancaPix } from '@/lib/pagarme'

export const runtime = 'nodejs'
export const maxDuration = 30

const PRECO_DOSSIE_CENTAVOS = Number(
  process.env.AGROBRIDGE_PRECO_DOSSIE_CENTAVOS ?? '29700'
) // R$ 297,00 padrão

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { processo_id?: string }
  const processoId = body.processo_id
  if (!processoId) {
    return Response.json({ erro: 'processo_id obrigatório' }, { status: 400 })
  }

  const { data: processo } = await supabase
    .from('processos')
    .select('id, perfil_json, status, user_id')
    .eq('id', processoId)
    .single()
  if (!processo || processo.user_id !== user.id) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const pagamentoExistente = perfilJson._pagamento as
    | { status?: string; qr_code?: string; qr_code_url?: string; charge_id?: string; order_id?: string; valor_centavos?: number; expires_at?: string | null }
    | undefined

  // Se já existe cobrança pendente, reusa (evita poluir Pagar.me)
  if (
    pagamentoExistente &&
    pagamentoExistente.status === 'pending' &&
    pagamentoExistente.qr_code
  ) {
    return Response.json({
      status: 'pending',
      qr_code: pagamentoExistente.qr_code,
      qr_code_url: pagamentoExistente.qr_code_url,
      expires_at: pagamentoExistente.expires_at ?? null,
      valor_centavos: pagamentoExistente.valor_centavos ?? PRECO_DOSSIE_CENTAVOS,
      reused: true,
    })
  }

  if (pagamentoExistente?.status === 'paid') {
    return Response.json({
      status: 'paid',
      valor_centavos: pagamentoExistente.valor_centavos ?? PRECO_DOSSIE_CENTAVOS,
    })
  }

  const perfilBloco = (perfilJson.perfil ?? {}) as {
    nome?: string
    cpf?: string
  }
  const nome = perfilBloco.nome || user.email?.split('@')[0] || 'Produtor'
  const cpf = perfilBloco.cpf
  const email = user.email
  if (!email) {
    return Response.json({ erro: 'Usuário sem email' }, { status: 422 })
  }

  try {
    const pix = await criarCobrancaPix({
      valorCentavos: PRECO_DOSSIE_CENTAVOS,
      cliente: { nome, email, cpf },
      processoId,
      descricao: 'Dossiê AgroBridge — crédito rural',
    })

    const registro = {
      order_id: pix.orderId,
      charge_id: pix.chargeId,
      status: 'pending',
      qr_code: pix.qrCode,
      qr_code_url: pix.qrCodeUrl,
      expires_at: pix.expiresAt,
      valor_centavos: pix.valorCentavos,
      criado_em: new Date().toISOString(),
    }

    await supabase
      .from('processos')
      .update({
        perfil_json: { ...perfilJson, _pagamento: registro },
      })
      .eq('id', processoId)

    return Response.json({
      status: 'pending',
      qr_code: pix.qrCode,
      qr_code_url: pix.qrCodeUrl,
      expires_at: pix.expiresAt,
      valor_centavos: pix.valorCentavos,
    })
  } catch (err) {
    console.error('[api/pagamento/criar]', err)
    const msg =
      err instanceof Error && /PAGARME_API_KEY/.test(err.message)
        ? 'Cobrança indisponível — chave Pagar.me não configurada.'
        : 'Falha ao criar cobrança. Tente novamente em instantes.'
    return Response.json({ erro: msg }, { status: 502 })
  }
}
