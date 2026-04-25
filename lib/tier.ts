// Tier de produto pago — define o que cada usuário pode acessar.
// Salvo em `processos.perfil_json._tier` pelo webhook do Cakto.
//
// Hierarquia (cumulativa) — preços vigentes a partir de 2026-04-24:
//   diagnostico (R$ 79,99)    → Entrevista + Diagnóstico de Viabilidade
//   dossie      (R$ 397,00)   → Tudo acima + Checklist + Dossiê + Defesa
//   mentoria    (R$ 1.497,00) → Tudo acima + Assessoria 1:1 com o fundador
//
// IMPORTANTE: o preço cobrado é o configurado no Cakto (CAKTO_PRODUTO_*).
// Esta tabela é fallback/referência interna — atualizar produtos no
// painel Cakto quando alterar valores aqui.

export type Tier = 'diagnostico' | 'dossie' | 'mentoria'

export const TIER_NIVEL: Record<Tier, number> = {
  diagnostico: 1,
  dossie: 2,
  mentoria: 3,
}

export const TIER_PRECO_CENTAVOS: Record<Tier, number> = {
  diagnostico: 7999,
  dossie: 39700,
  mentoria: 149700,
}

export const TIER_NOME: Record<Tier, string> = {
  diagnostico: 'Diagnóstico Rápido',
  dossie: 'Dossiê Bancário Completo',
  mentoria: 'Assessoria Premium 1:1',
}

export function isTier(value: unknown): value is Tier {
  return value === 'diagnostico' || value === 'dossie' || value === 'mentoria'
}

// Lê o tier de um perfil_json. Retorna null se não houver pagamento confirmado
// ou se o valor estiver corrompido.
export function lerTier(perfilJson: unknown): Tier | null {
  if (!perfilJson || typeof perfilJson !== 'object') return null
  const t = (perfilJson as Record<string, unknown>)._tier
  return isTier(t) ? t : null
}

// Verifica se o tier do usuário libera o recurso pedido.
// Ex.: temAcesso('diagnostico', 'dossie') → false (precisa upgrade)
//      temAcesso('mentoria',   'dossie') → true
export function temAcesso(tierUsuario: Tier | null, recursoMinimo: Tier): boolean {
  if (!tierUsuario) return false
  return TIER_NIVEL[tierUsuario] >= TIER_NIVEL[recursoMinimo]
}
