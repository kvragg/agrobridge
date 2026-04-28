// Validação Zod do payload de SimulatorInput pras rotas que recebem
// input do client (/api/simulador/salvar). Defense-in-depth contra
// payloads malformados que produziriam NaN no jsonb do output ou
// quebrariam o radar.
//
// Os enums são derivados das listas oficiais em data/* via map(.id) —
// uma única fonte de verdade. Adicionar nova cultura/garantia/nível
// não requer mexer aqui.

import { z } from 'zod'
import { CULTURAS, type CulturaId } from './data/culturas'
import { GARANTIAS, type GarantiaId } from './data/garantias'
import { CADASTRO_NIVEIS, type CadastroNivelId } from './data/cadastro-niveis'

const CULTURA_IDS = CULTURAS.map((c) => c.id) as [CulturaId, ...CulturaId[]]
const GARANTIA_IDS = GARANTIAS.map((g) => g.id) as [GarantiaId, ...GarantiaId[]]
const CADASTRO_IDS = CADASTRO_NIVEIS.map((c) => c.id) as [
  CadastroNivelId,
  ...CadastroNivelId[],
]

// Slider client vai 50_000 a 10_000_000. Aceitamos um range mais largo
// pra retrocompat de simulações antigas + dados batch importados.
const VALOR_MAX = 1_000_000_000
const RENDA_MAX = 1_000_000_000

export const simulatorInputSchema = z.object({
  valor_pretendido: z.number().finite().min(0).max(VALOR_MAX),
  cultura: z.enum(CULTURA_IDS),
  finalidade: z.enum(['custeio', 'investimento', 'comercializacao', 'industrializacao']),
  porte: z.enum(['pequeno', 'medio', 'grande']),
  uf: z.string().length(2).regex(/^[A-Z]{2}$/),
  garantias: z.array(z.enum(GARANTIA_IDS)).max(20),
  relacao_terra: z.enum([
    'proprio',
    'misto_proprio_arrendado',
    'maioria_arrendado',
    'totalmente_arrendado',
  ]),
  aval_tipo: z
    .enum(['nenhum', 'puro_sem_respaldo', 'ate_100k_com_respaldo', 'amplo_amparo_patrimonial'])
    .optional(),
  cadastro_nivel: z.enum(CADASTRO_IDS),
  historico_scr: z.enum([
    'limpo',
    'com_restricao_ativa',
    'restricao_encerrada',
    'primeira_operacao',
  ]),
  divida_outros_bancos: z.enum(['nenhuma', 'em_dia', 'com_atraso']).optional(),
  renda_bruta_anual: z.number().finite().min(0).max(RENDA_MAX).optional(),
  endividamento_pct: z.number().finite().min(0).max(200),
  divida_patrimonio_faixa: z
    .enum(['ate_50', 'de_51_a_70', 'de_71_a_85', 'acima_85', 'nao_sei'])
    .optional(),
  car: z.enum(['regular_averbado', 'inscrito_pendente', 'nao_tem']),
  tem_seguro_agricola: z.boolean(),
  reciprocidade_bancaria: z.enum(['forte', 'media', 'nenhuma']),
  car_suspenso: z.boolean().optional(),
  cpf_cnpj_regular: z.boolean(),
  imovel_em_inventario: z.boolean(),
  arrendamento_com_anuencia: z.boolean().optional(),
  georref_ok: z.boolean().optional(),
  itr_em_dia: z.boolean(),
  tem_dap_caf: z.boolean().optional(),
  ir_em_dia: z.boolean(),
})
