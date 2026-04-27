// Matriz de garantias — calibrada pela hierarquia que o mercado
// efetivamente prefere em 2026 (cenário de Selic elevada + recuperações
// judiciais em alta).
//
// Régua 0–10 conforme o sinal que o comitê dá:
//   10/10 — preferidas hoje. Reduzem fricção a quase zero.
//   7/10  — viáveis com defesa boa.
//   5/10  — ainda passam, mas precisam de mais apoio (cadastro, seguro).
//   ≤3/10 — difícil. Não impossível, mas o caminho é estreito.
//
// Mapeamento score 0-10 → delta no engine (linear interpolado):
//   10:+30  9:+26  8:+22  7:+18  6:+13  5:+8  4:+3  3:-3  2:-8  1:-12  0:-15
//
// Tier guia a cor do chip na UI:
//   premium = verde accent (preferida do mercado em 2026)
//   forte   = verde médio
//   media   = âmbar
//   fraca   = vermelho suave

// Aval (puro / até 100k / amplo amparo / terceiro fraco) NÃO entra
// nesta lista — é tratado separadamente via campo `aval_tipo` em
// SimulatorInput pra interagir com a regra do arrendatário 100% e
// evitar dupla-contagem no score.
export type GarantiaId =
  | 'alienacao_fiduciaria_guarda_chuva'
  | 'alienacao_fiduciaria_rural'
  | 'investimento_garantia'
  | 'cessao_creditorios_aaa'
  | 'fianca_bancaria'
  | 'hipoteca_1grau'
  | 'cpr_f_registrada'
  | 'cessao_creditorios_media'
  | 'warrant'
  | 'penhor_safra_com_seguro'
  | 'alienacao_maquinas'
  | 'penhor_safra_sem_seguro'

export type GarantiaTier = 'premium' | 'forte' | 'media' | 'fraca'

export interface Garantia {
  id: GarantiaId
  nome: string
  delta: number
  tier: GarantiaTier
  /** Score 0-10 da régua de preferência do mercado. */
  score_mercado: number
  /** True se está no top do mercado em 2026 (10/10). UI destaca. */
  preferida_mercado_2026?: boolean
}

export const GARANTIAS: Garantia[] = [
  // ── 10/10 — preferidas mercado 2026 ──────────────────────────────
  {
    id: 'alienacao_fiduciaria_guarda_chuva',
    nome: 'Alienação fiduciária guarda-chuva (urbano + rural)',
    delta: 30,
    tier: 'premium',
    score_mercado: 10,
    preferida_mercado_2026: true,
  },
  {
    id: 'alienacao_fiduciaria_rural',
    nome: 'Alienação fiduciária simples (1 imóvel — rural ou urbano)',
    delta: 30,
    tier: 'premium',
    score_mercado: 10,
    preferida_mercado_2026: true,
  },
  {
    id: 'investimento_garantia',
    nome: 'Investimento dado em garantia (CDB / LCA / poupança vinculada)',
    delta: 30,
    tier: 'premium',
    score_mercado: 10,
    preferida_mercado_2026: true,
  },

  // ── 8/10 — fortes ────────────────────────────────────────────────
  {
    id: 'cessao_creditorios_aaa',
    nome: 'Cessão de direitos creditórios (integradora AAA)',
    delta: 22,
    tier: 'forte',
    score_mercado: 8,
  },
  {
    id: 'fianca_bancaria',
    nome: 'Fiança bancária',
    delta: 22,
    tier: 'forte',
    score_mercado: 8,
  },

  // ── 7/10 — boa ───────────────────────────────────────────────────
  {
    id: 'hipoteca_1grau',
    nome: 'Hipoteca rural 1º grau (matrícula limpa)',
    delta: 18,
    tier: 'forte',
    score_mercado: 7,
  },

  // ── 6/10 ─────────────────────────────────────────────────────────
  {
    id: 'cpr_f_registrada',
    nome: 'CPR-F registrada em cartório',
    delta: 13,
    tier: 'forte',
    score_mercado: 6,
  },
  {
    id: 'cessao_creditorios_media',
    nome: 'Cessão de direitos creditórios (integradora média)',
    delta: 13,
    tier: 'media',
    score_mercado: 6,
  },

  // ── 5/10 — média ─────────────────────────────────────────────────
  {
    id: 'warrant',
    nome: 'Warrant agropecuário (armazém certificado)',
    delta: 8,
    tier: 'media',
    score_mercado: 5,
  },
  {
    id: 'penhor_safra_com_seguro',
    nome: 'Penhor da safra + seguro',
    delta: 8,
    tier: 'media',
    score_mercado: 5,
  },

  // ── 4/10 — fraca ─────────────────────────────────────────────────
  {
    id: 'alienacao_maquinas',
    nome: 'Alienação de máquinas',
    delta: 3,
    tier: 'media',
    score_mercado: 4,
  },

  // ── 2/10 — muito fraca ───────────────────────────────────────────
  {
    id: 'penhor_safra_sem_seguro',
    nome: 'Penhor da safra (sem seguro)',
    delta: -8,
    tier: 'fraca',
    score_mercado: 2,
  },
]

export function getGarantia(id: GarantiaId): Garantia | undefined {
  return GARANTIAS.find((g) => g.id === id)
}

/**
 * Garantias "premium complementares" — quando 2+ aparecem juntas,
 * a regra combinatória aplica bônus extra (mercado prefere camadas).
 */
export const GARANTIAS_PREMIUM_COMPLEMENTARES: GarantiaId[] = [
  'alienacao_fiduciaria_guarda_chuva',
  'alienacao_fiduciaria_rural',
  'investimento_garantia',
  'cessao_creditorios_aaa',
  'fianca_bancaria',
  'hipoteca_1grau',
  'cpr_f_registrada',
]

/**
 * Garantias 10/10 — preferidas pelo mercado em 2026.
 * UI destaca. IA do chat/dossiê posiciona como caminho preferencial.
 */
export const GARANTIAS_PREFERIDAS_MERCADO: GarantiaId[] = GARANTIAS.filter(
  (g) => g.preferida_mercado_2026,
).map((g) => g.id)
