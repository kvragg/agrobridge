// Matriz de garantias v2 — deltas exatos definidos pelo Paulo no
// prompt do simulador. Tier guia a cor do chip na UI:
//   premium = verde accent
//   forte   = verde médio
//   media   = âmbar
//   fraca   = vermelho suave

export type GarantiaId =
  | 'alienacao_fiduciaria_guarda_chuva'
  | 'cessao_creditorios_aaa'
  | 'alienacao_fiduciaria_rural'
  | 'hipoteca_1grau'
  | 'fianca_bancaria'
  | 'cpr_f_registrada'
  | 'cessao_creditorios_media'
  | 'warrant'
  | 'alienacao_maquinas'
  | 'aval_amplo_patrimonio'
  | 'aval_ate_100k'
  | 'penhor_safra_com_seguro'
  | 'penhor_safra_sem_seguro'
  | 'aval_terceiro_fraco'
  | 'aval_puro_sem_respaldo'

export type GarantiaTier = 'premium' | 'forte' | 'media' | 'fraca'

export interface Garantia {
  id: GarantiaId
  nome: string
  delta: number
  tier: GarantiaTier
}

export const GARANTIAS: Garantia[] = [
  {
    id: 'alienacao_fiduciaria_guarda_chuva',
    nome: 'Alienação fiduciária guarda-chuva (imóveis urbanos + rurais)',
    delta: 28,
    tier: 'premium',
  },
  {
    id: 'cessao_creditorios_aaa',
    nome: 'Cessão de direitos creditórios (integradora AAA)',
    delta: 25,
    tier: 'premium',
  },
  {
    id: 'alienacao_fiduciaria_rural',
    nome: 'Alienação fiduciária imóvel rural',
    delta: 22,
    tier: 'forte',
  },
  {
    id: 'hipoteca_1grau',
    nome: 'Hipoteca rural 1º grau (matrícula limpa)',
    delta: 18,
    tier: 'forte',
  },
  {
    id: 'fianca_bancaria',
    nome: 'Fiança bancária',
    delta: 15,
    tier: 'forte',
  },
  {
    id: 'cpr_f_registrada',
    nome: 'CPR-F registrada em cartório',
    delta: 15,
    tier: 'forte',
  },
  {
    id: 'cessao_creditorios_media',
    nome: 'Cessão de direitos creditórios (integradora média)',
    delta: 12,
    tier: 'media',
  },
  {
    id: 'warrant',
    nome: 'Warrant agropecuário (armazém certificado)',
    delta: 10,
    tier: 'media',
  },
  {
    id: 'alienacao_maquinas',
    nome: 'Alienação de máquinas',
    delta: 6,
    tier: 'media',
  },
  {
    id: 'aval_amplo_patrimonio',
    nome: 'Aval com amplo amparo patrimonial',
    delta: 2,
    tier: 'fraca',
  },
  {
    id: 'aval_ate_100k',
    nome: 'Aval até R$ 100k com respaldo',
    delta: 4,
    tier: 'fraca',
  },
  {
    id: 'penhor_safra_com_seguro',
    nome: 'Penhor da safra + seguro',
    delta: 3,
    tier: 'fraca',
  },
  {
    id: 'penhor_safra_sem_seguro',
    nome: 'Penhor da safra (sem seguro)',
    delta: -5,
    tier: 'fraca',
  },
  {
    id: 'aval_terceiro_fraco',
    nome: 'Aval de terceiro sem patrimônio robusto',
    delta: -12,
    tier: 'fraca',
  },
  {
    id: 'aval_puro_sem_respaldo',
    nome: 'Aval puro sem respaldo',
    delta: -15,
    tier: 'fraca',
  },
]

export function getGarantia(id: GarantiaId): Garantia | undefined {
  return GARANTIAS.find((g) => g.id === id)
}

/**
 * Garantias "premium complementares" — quando 2+ aparecem juntas,
 * a regra combinatória dá +5 (ou +8 se uma delas for guarda-chuva).
 */
export const GARANTIAS_PREMIUM_COMPLEMENTARES: GarantiaId[] = [
  'alienacao_fiduciaria_guarda_chuva',
  'cessao_creditorios_aaa',
  'alienacao_fiduciaria_rural',
  'hipoteca_1grau',
  'fianca_bancaria',
  'cpr_f_registrada',
]
