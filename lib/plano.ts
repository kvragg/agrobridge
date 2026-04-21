import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { isTier, type Tier, TIER_NIVEL } from '@/lib/tier'

// Nome comercial que aparece na UI (Free/Bronze/Prata/Ouro).
// Tier interno no DB: null/diagnostico/dossie/mentoria.
export type PlanoComercial = 'Free' | 'Bronze' | 'Prata' | 'Ouro'

export interface PlanoAtual {
  tier: Tier | null
  plano: PlanoComercial
  // Processo mais recente do user (fonte do _tier). null se nenhum.
  processoId: string | null
}

const TIER_PARA_PLANO: Record<Tier, PlanoComercial> = {
  diagnostico: 'Bronze',
  dossie: 'Prata',
  mentoria: 'Ouro',
}

export function tierParaPlano(tier: Tier | null): PlanoComercial {
  if (!tier) return 'Free'
  return TIER_PARA_PLANO[tier]
}

// Lê o tier mais alto que o user já pagou. Olha todos os processos ativos
// do user (ignora soft-deleted) e pega o _tier mais alto em perfil_json.
// Ignora processos sem pagamento_confirmado.
//
// Decisão: tier é do *user*, não do *processo*. Se o user pagou Prata
// em um processo e depois criou outro processo (Free), o badge continua
// mostrando Prata — ele já tem o acesso pago, o novo processo herda.
export async function getPlanoAtual(): Promise<PlanoAtual> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { tier: null, plano: 'Free', processoId: null }

  const { data: processos } = await supabase
    .from('processos')
    .select('id, perfil_json, pagamento_confirmado, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!processos || processos.length === 0) {
    return { tier: null, plano: 'Free', processoId: null }
  }

  let melhorTier: Tier | null = null
  let melhorProcessoId: string | null = processos[0]?.id ?? null

  for (const p of processos) {
    if (!p.pagamento_confirmado) continue
    const raw = (p.perfil_json as Record<string, unknown> | null)?._tier
    if (!isTier(raw)) continue
    if (!melhorTier || TIER_NIVEL[raw] > TIER_NIVEL[melhorTier]) {
      melhorTier = raw
      melhorProcessoId = p.id
    }
  }

  return {
    tier: melhorTier,
    plano: tierParaPlano(melhorTier),
    processoId: melhorProcessoId,
  }
}
