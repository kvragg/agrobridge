// Tier de produto pago — define o que cada usuário pode acessar.
// Salvo em `processos.perfil_json._tier` pelo webhook do Cakto.
//
// Hierarquia (cumulativa):
//   diagnostico (R$29,99)  → Entrevista + Análise de Viabilidade (PDF curto)
//   dossie      (R$297,99) → Tudo acima + Checklist + Dossiê + Defesa
//   mentoria    (R$697,99) → Tudo acima + 30min consultoria + revisão dossiê

export type Tier = 'diagnostico' | 'dossie' | 'mentoria'

export const TIER_NIVEL: Record<Tier, number> = {
  diagnostico: 1,
  dossie: 2,
  mentoria: 3,
}

export const TIER_PRECO_CENTAVOS: Record<Tier, number> = {
  diagnostico: 2999,
  dossie: 29799,
  mentoria: 69799,
}

export const TIER_NOME: Record<Tier, string> = {
  diagnostico: 'Diagnóstico Rápido',
  dossie: 'Dossiê Bancário Completo',
  mentoria: 'Acesso à Mesa de Crédito',
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
