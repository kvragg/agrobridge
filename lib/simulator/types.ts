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
  endividamento_pct: number // 0–200
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
