import 'server-only'

// Snapshot do registro `dossie_entregas` pra IA do chat consumir como
// fonte oficial. Pilar #1 (a base do trio).
//
// Lead pergunta status do PDF ("cadê meu PDF?") → IA responde com
// lastro factual usando os textos calibrados em
// `montarContextoEntregas` em `lib/ai/system-prompt.ts`.
//
// Mantido em arquivo dedicado pra simetria com Pilar #2 (checklist)
// e Pilar #3 (compras). Antes era query direta inline em /api/chat.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EntregaSnapshot } from '@/lib/ai/system-prompt'

export async function snapshotEntregasParaChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<EntregaSnapshot[]> {
  const { data } = await supabase
    .from('dossie_entregas')
    .select(
      'status, tier_snapshot, enqueued_at, generating_at, ready_at, errored_at, attempt_count, error_message',
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  return (data ?? []) as EntregaSnapshot[]
}
