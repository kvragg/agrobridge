import 'server-only'

// Loader unificado dos 3 snapshots oficiais pra IA do chat.
//
// Cada snapshot resolve uma classe de pergunta do lead:
//   #1 entregas → "cadê meu PDF?"
//   #2 checklist → "o que falta?"
//   #3 compras → "comprei e agora?" / "reembolso?"
//
// Todos carregados em paralelo + try/catch unificado: falha de um não
// bloqueia os outros nem o chat. Logger registra, snapshot virou
// fallback (entregas/compras = [], checklist = null).
//
// Uso em /api/chat substituindo o Promise.all manual antes do refactor.

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  EntregaSnapshot,
  ChecklistSnapshotPrompt,
  CompraSnapshotPrompt,
} from '@/lib/ai/system-prompt'
import { snapshotEntregasParaChat } from '@/lib/ai/entregas-snapshot'
import { snapshotChecklistParaChat } from '@/lib/ai/checklist-snapshot'
import { snapshotComprasParaChat } from '@/lib/ai/compras-snapshot'
import { capturarErroProducao } from '@/lib/logger'

export interface SnapshotsParaChat {
  entregas: EntregaSnapshot[]
  checklist: ChecklistSnapshotPrompt | null
  compras: CompraSnapshotPrompt[]
}

export async function carregarSnapshotsParaChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<SnapshotsParaChat> {
  const safe = async <T>(
    etapa: string,
    fallback: T,
    fn: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await fn()
    } catch (err) {
      capturarErroProducao(err, { modulo: 'chat', userId, extra: { etapa } })
      return fallback
    }
  }

  const [entregas, checklist, compras] = await Promise.all([
    safe('entregas_snapshot', [] as EntregaSnapshot[], () =>
      snapshotEntregasParaChat(supabase, userId),
    ),
    safe(
      'checklist_snapshot',
      null as ChecklistSnapshotPrompt | null,
      () => snapshotChecklistParaChat(supabase, userId),
    ),
    safe('compras_snapshot', [] as CompraSnapshotPrompt[], () =>
      snapshotComprasParaChat(supabase, userId),
    ),
  ])

  return { entregas, checklist, compras }
}
