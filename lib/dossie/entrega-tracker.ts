import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// ============================================================
// Entrega tracker — escreve no state machine `dossie_entregas`
// ============================================================
// Fonte de visibilidade pra IA do chat ("cadê meu PDF?"). Nunca é
// fonte-de-verdade pra concorrência — quem decide se eu posso gerar
// é o lock atômico em `processos.dossie_gerando_desde` (RPC
// `iniciar_geracao_dossie`).
//
// Por isso todas as chamadas aqui são best-effort: se a RPC do
// state machine falhar (transição inválida, etc), logamos warning
// e seguimos. Nunca propagamos exception — não pode quebrar a
// geração do PDF por causa do tracker.
// ============================================================

type Tier = 'diagnostico' | 'dossie' | 'mentoria'

async function chamarRpc(
  supabase: SupabaseClient,
  processoId: string,
  novoStatus: 'em_fila' | 'gerando' | 'pronto' | 'erro',
  campos: {
    tierSnapshot?: Tier | null
    pdfUrl?: string | null
    pdfUrlExpiresAt?: string | null
    errorMessage?: string | null
  } = {},
  modulo: 'dossie' | 'viabilidade'
): Promise<void> {
  const { error } = await supabase.rpc('transicionar_dossie_entrega', {
    p_processo_id: processoId,
    p_novo_status: novoStatus,
    p_tier_snapshot: campos.tierSnapshot ?? null,
    p_pdf_url: campos.pdfUrl ?? null,
    p_pdf_url_expires_at: campos.pdfUrlExpiresAt ?? null,
    p_error_message: campos.errorMessage ?? null,
  })

  if (error) {
    logger.warn({
      msg: 'transicionar_dossie_entrega_falhou',
      modulo,
      extra: {
        novoStatus,
        codigo: error.code ?? null,
        detalhe: (error.message ?? '').slice(0, 200),
      },
    })
  }
}

export function marcarEntregaEnfileirada(
  supabase: SupabaseClient,
  processoId: string,
  tierSnapshot: Tier,
  modulo: 'dossie' | 'viabilidade'
): Promise<void> {
  return chamarRpc(supabase, processoId, 'em_fila', { tierSnapshot }, modulo)
}

export function marcarEntregaGerando(
  supabase: SupabaseClient,
  processoId: string,
  modulo: 'dossie' | 'viabilidade'
): Promise<void> {
  return chamarRpc(supabase, processoId, 'gerando', {}, modulo)
}

export function marcarEntregaPronta(
  supabase: SupabaseClient,
  processoId: string,
  pdfUrl: string,
  pdfUrlExpiresAt: string,
  modulo: 'dossie' | 'viabilidade'
): Promise<void> {
  return chamarRpc(
    supabase,
    processoId,
    'pronto',
    { pdfUrl, pdfUrlExpiresAt },
    modulo
  )
}

// errorMessage deve ser texto humano CURTO sem PII.
// Frases padrão sugeridas:
//   - "Falha ao gerar laudo (IA)"
//   - "Falha ao montar PDF"
//   - "Falha ao salvar arquivo"
//   - "Erro inesperado"
export function marcarEntregaErro(
  supabase: SupabaseClient,
  processoId: string,
  errorMessage: string,
  modulo: 'dossie' | 'viabilidade'
): Promise<void> {
  return chamarRpc(
    supabase,
    processoId,
    'erro',
    { errorMessage: errorMessage.slice(0, 240) },
    modulo
  )
}
