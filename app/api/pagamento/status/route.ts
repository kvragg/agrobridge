import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 15

// GET /api/pagamento/status?processo_id=...
// Retorna snapshot do `_pagamento` em perfil_json para polling do frontend.
// Convergência para 'paid' é responsabilidade exclusiva do webhook do
// provider (Cakto). Não há fallback de polling ao provider aqui.
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

  return Response.json(pagamento)
}
