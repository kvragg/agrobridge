// Tipos compartilhados do Simulador AgroBridge.

import type { CulturaId } from './data/culturas'
import type { GarantiaId } from './data/garantias'
import type { CadastroNivelId } from './data/cadastro-niveis'

export type Finalidade =
  | 'custeio'
  | 'investimento'
  | 'comercializacao'
  | 'industrializacao'

export type Porte = 'pequeno' | 'medio' | 'grande'

export type RelacaoTerra =
  | 'proprio'
  | 'misto_proprio_arrendado'
  | 'maioria_arrendado'
  | 'totalmente_arrendado'

export type AvalTipo =
  | 'nenhum'
  | 'puro_sem_respaldo'
  | 'ate_100k_com_respaldo'
  | 'amplo_amparo_patrimonial'

export type HistoricoScr =
  | 'limpo'
  | 'com_restricao_ativa'
  | 'restricao_encerrada'
  | 'primeira_operacao'

export type CarStatus =
  | 'regular_averbado'
  | 'inscrito_pendente'
  | 'nao_tem'

export type ReciprocidadeBancaria = 'forte' | 'media' | 'nenhuma'

/**
 * Alavancagem patrimonial — percentual do patrimônio real do produtor
 * já comprometido em crédito no mercado. Cenário 2026 (RJs em alta):
 * comitês olham com lupa quem passa de 70%.
 *
 *   ate_50      — comitê vê com bons olhos (folga patrimonial)
 *   de_51_a_70  — atende com ressalvas (defesa do fluxo de caixa)
 *   de_71_a_85  — zona de alerta (cenário econômico + RJs)
 *   acima_85    — alavancagem crítica (improvável sem reestruturação)
 *   nao_sei     — produtor não soube responder; IA aprofunda no chat
 */
export type DividaPatrimonioFaixa =
  | 'ate_50'
  | 'de_51_a_70'
  | 'de_71_a_85'
  | 'acima_85'
  | 'nao_sei'

export interface SimulatorInput {
  valor_pretendido: number
  cultura: CulturaId
  finalidade: Finalidade
  porte: Porte
  uf: string
  garantias: GarantiaId[]
  relacao_terra: RelacaoTerra
  aval_tipo?: AvalTipo
  cadastro_nivel: CadastroNivelId
  historico_scr: HistoricoScr
  endividamento_pct: number // 0–200, dívida total / receita anual
  /**
   * Dívida total / patrimônio real (alavancagem). Opcional: simulações
   * antigas não têm. Quando ausente ou 'nao_sei' o engine não aplica
   * delta nem entra no eixo Capacidade.
   */
  divida_patrimonio_faixa?: DividaPatrimonioFaixa
  car: CarStatus
  tem_seguro_agricola: boolean
  reciprocidade_bancaria: ReciprocidadeBancaria
  car_suspenso?: boolean
  cpf_cnpj_regular: boolean
  imovel_em_inventario: boolean
  arrendamento_com_anuencia?: boolean
  georref_ok?: boolean
  itr_em_dia: boolean
  tem_dap_caf?: boolean
  ir_em_dia: boolean
}

export type Faixa =
  | 'muito_baixa'
  | 'baixa'
  | 'media'
  | 'alta'
  | 'muito_alta'

export interface DeltaAplicado {
  fator: string
  delta: number
  motivo: string
}

export interface AvisoCtx {
  tipo: 'info' | 'alerta' | 'critico'
  texto: string
}

export interface RadarEixo {
  eixo: string
  valor: number // 0-100
}

export interface AcaoSubida {
  acao: string
  ganho_estimado: number
  prazo_dias: number
}

export interface SimulatorResult {
  score: number // 0-100
  faixa: Faixa
  teto_por_cadastro: number // 60 | 80 | 100
  radar: RadarEixo[] // 6 eixos
  deltas_aplicados: DeltaAplicado[]
  avisos: AvisoCtx[]
  linha_mcr_provavel: string | null
  plano_de_subida: AcaoSubida[]
  regras_duras_violadas: string[]
  teto_valor_estimado: number | null
}
