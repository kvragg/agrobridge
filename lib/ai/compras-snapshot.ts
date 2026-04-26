import 'server-only'

// Snapshot do histórico de compras do user pra IA do chat consumir
// como fonte oficial. Lead pergunta "comprei e agora?", "quero
// reembolso", "tenho Bronze ou Prata?", "ainda dá tempo de cancelar?"
// — IA responde com lastro factual incluindo a janela CDC de 7 dias.
//
// Pilar #3 (após Pilar #1 dossie_entregas e Pilar #2 checklist).
//
// Inclui cálculo da janela CDC (Código de Defesa do Consumidor, art. 49):
// 7 dias corridos a partir da data de pagamento pra direito de
// arrependimento em compra a distância. Crítico pra IA não enrolar.

import type { SupabaseClient } from '@supabase/supabase-js'

const JANELA_CDC_DIAS = 7

export interface CompraSnapshot {
  id: string
  tier: 'diagnostico' | 'dossie' | 'mentoria'
  status: 'pending' | 'paid' | 'refunded' | 'chargeback' | 'failed'
  amount_cents: number
  paid_at: string | null
  created_at: string
  /** Dias restantes na janela CDC (7 dias). Null se não pago ou já fora. */
  dias_restantes_cdc: number | null
  /** True se ainda está dentro da janela de arrependimento. */
  dentro_janela_cdc: boolean
}

interface CompraRow {
  id: string
  tier: string
  status: string
  amount_cents: number
  paid_at: string | null
  created_at: string
}

export async function snapshotComprasParaChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<CompraSnapshot[]> {
  const { data: compras } = await supabase
    .from('compras')
    .select('id, tier, status, amount_cents, paid_at, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const linhas = (compras ?? []) as CompraRow[]
  const agora = Date.now()

  return linhas.map((c) => {
    let diasRestantes: number | null = null
    let dentro = false
    if (c.status === 'paid' && c.paid_at) {
      const paidMs = Date.parse(c.paid_at)
      if (!Number.isNaN(paidMs)) {
        const diff = agora - paidMs
        const diasPassados = Math.floor(diff / (1000 * 60 * 60 * 24))
        const restantes = JANELA_CDC_DIAS - diasPassados
        if (restantes >= 0) {
          diasRestantes = restantes
          dentro = true
        }
      }
    }
    return {
      id: c.id,
      tier: c.tier as CompraSnapshot['tier'],
      status: c.status as CompraSnapshot['status'],
      amount_cents: c.amount_cents,
      paid_at: c.paid_at,
      created_at: c.created_at,
      dias_restantes_cdc: diasRestantes,
      dentro_janela_cdc: dentro,
    }
  })
}
