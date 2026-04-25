import 'server-only'

// Modelo único da AgroBridge (2026-04-22+) — Sonnet 4.6 em todas as rotas IA.
// Antes tínhamos haiku pra entrevista, sonnet pra checklist/dossiê.
// Paulo decidiu uniformizar pra qualidade máxima em tudo, com mitigação de
// custo via:
//   1. Anthropic Prompt Caching — system prompts grandes com cache_control
//      ephemeral (TTL 5 min) cortam ~80% do custo em rodadas repetidas.
//   2. Rate-limit por tier (lib/rate-limit.ts) — Free 10/h, Bronze 25/h,
//      Prata 50/h, Ouro 100/h.
//
// NÃO mexer sem Paulo confirmar. Toda chamada Anthropic no projeto
// passa por aqui.

export const MODEL = 'claude-sonnet-4-6' as const

/**
 * Marca de cache Anthropic pra aplicar no último bloco do system prompt.
 * O texto que vem antes vai ficar "cacheado" por 5 min — a request seguinte
 * só paga pelo delta de user message.
 *
 * Uso:
 *   system: [
 *     { type: 'text', text: PROMPT_BASE, cache_control: CACHE_EPHEMERAL }
 *   ]
 */
export const CACHE_EPHEMERAL = { type: 'ephemeral' } as const

/**
 * Retorno padronizado pros helpers de rate-limit quando querem saber
 * qual tier o usuário tem, pra aplicar o limite correto.
 */
export type TierParaRateLimit = 'free' | 'bronze' | 'prata' | 'ouro'

export const LIMITES_MENSAGENS_POR_HORA: Record<TierParaRateLimit, number> = {
  free: 10,
  bronze: 25,
  prata: 50,
  ouro: 100,
}
