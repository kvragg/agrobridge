import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consultarCharge } from '@/lib/pagarme'

export const runtime = 'nodejs'
export const maxDuration = 15

// GET /api/pagamento/status?processo_id=...
// Retorna snapshot do pagamento para polling do frontend.
// Se charge está pending no Pagar.me e há chargeId, revalida ao vivo
// (webhook pode falhar — polling garante convergência).
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const processoId = request.nextUrl.searchParams.get('processo_id')
  if (!processoId) {
    return Response.json({ erro: 'processo_id obrigatório' }, { status: 400 })
  }

  const { data: processo } = await supabase
    .from('processos')
    .select('id, user_id, perfil_json')
    .eq('id', processoId)
    .single()
  if (!processo || processo.user_id !== user.id) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const pagamento = (perfilJson._pagamento ?? null) as
    | {
        status?: string
        qr_code?: string
        qr_code_url?: string
        charge_id?: string
        expires_at?: string | null
        valor_centavos?: number
        pago_em?: string
      }
    | null

  if (!pagamento) {
    return Response.json({ status: 'none' })
  }

  // Se ainda pending + tem charge_id + Pagar.me configurado, consulta ao vivo
  if (
    pagamento.status === 'pending' &&
    pagamento.charge_id &&
    process.env.PAGARME_API_KEY
  ) {
    try {
      const atual = await consultarCharge(pagamento.charge_id)
      if (atual.status === 'paid') {
        const novo = {
          ...pagamento,
          status: 'paid',
          pago_em: atual.paidAt ?? new Date().toISOString(),
        }
        await supabase
          .from('processos')
          .update({ perfil_json: { ...perfilJson, _pagamento: novo } })
          .eq('id', processoId)
        return Response.json(novo)
      }
    } catch (err) {
      console.error('[pagamento/status] consulta Pagar.me falhou', err)
    }
  }

  return Response.json(pagamento)
}
