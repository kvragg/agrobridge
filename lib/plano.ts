import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isTier, type Tier, TIER_NIVEL } from '@/lib/tier'

// Nome comercial que aparece na UI (Free/Bronze/Prata/Ouro).
// Tier interno no DB: null/diagnostico/dossie/mentoria.
export type PlanoComercial = 'Free' | 'Bronze' | 'Prata' | 'Ouro'

export interface PlanoAtual {
  tier: Tier | null
  plano: PlanoComercial
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

// Fonte-da-verdade do tier é `compras` (status='paid'). Processos podem
// ser soft-deletados (limpeza UAT, LGPD, etc) e isso não pode tirar o
// acesso pago do user. Compras são imutáveis — o tier vem daí.
//
// processoId retornado é o processo mais recente pagamento_confirmado do
// user (se houver) pra compatibilidade com callers antigos que querem
// linkar a uma entrega — mas o tier NÃO depende dele.
export async function getPlanoAtual(): Promise<PlanoAtual> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { tier: null, plano: 'Free', processoId: null }

  const admin = createAdminClient()

  const [{ data: compras }, { data: processos }] = await Promise.all([
    admin
      .from('compras')
      .select('tier, status, paid_at')
      .eq('user_id', user.id)
      .eq('status', 'paid'),
    admin
      .from('processos')
      .select('id, pagamento_confirmado, created_at')
      .eq('user_id', user.id)
      .eq('pagamento_confirmado', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  let melhorTier: Tier | null = null
  for (const c of compras ?? []) {
    const t = c.tier as unknown
    if (!isTier(t)) continue
    if (!melhorTier || TIER_NIVEL[t] > TIER_NIVEL[melhorTier]) melhorTier = t
  }

  return {
    tier: melhorTier,
    plano: tierParaPlano(melhorTier),
    processoId: processos?.[0]?.id ?? null,
  }
}
