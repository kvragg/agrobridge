// Catálogo de culturas para o Simulador AgroBridge.
// teto_custeio_por_ha: faixa típica praticada nos comitês 2025-26
// (R$/ha). delta_score_base: 0 a +5, baseado em maturidade de
// linha MCR + previsibilidade de aprovação.
// linha_mcr_provavel: nome da linha mais comum (não vincula).

export type CulturaId =
  | 'soja'
  | 'milho_1a_safra'
  | 'milho_safrinha'
  | 'algodao'
  | 'cafe_arabica'
  | 'cafe_conilon'
  | 'cana'
  | 'feijao'
  | 'trigo'
  | 'arroz_irrigado'
  | 'pecuaria_corte'
  | 'pecuaria_leite'
  | 'suinocultura_integracao'
  | 'suinocultura_independente'
  | 'avicultura_corte'
  | 'avicultura_postura'
  | 'piscicultura_tanque_rede'
  | 'alevinos'
  | 'fruticultura_citros'
  | 'fruticultura_uva'
  | 'fruticultura_banana'
  | 'hortifruti'
  | 'florestal_eucalipto'

export interface Cultura {
  id: CulturaId
  nome: string
  teto_custeio_por_ha: { min: number; max: number }
  linha_mcr_provavel: string
  observacao: string
  delta_score_base: number
  /** Ícone do lucide-react (string nome do componente). */
  icone: string
}

export const CULTURAS: Cultura[] = [
  {
    id: 'soja',
    nome: 'Soja',
    teto_custeio_por_ha: { min: 2800, max: 4500 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Linha mais madura do MCR. Comitê tem histórico longo.',
    delta_score_base: 5,
    icone: 'Sprout',
  },
  {
    id: 'milho_1a_safra',
    nome: 'Milho 1ª safra',
    teto_custeio_por_ha: { min: 2500, max: 4200 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Boa previsibilidade. Ciclo bem definido.',
    delta_score_base: 4,
    icone: 'Wheat',
  },
  {
    id: 'milho_safrinha',
    nome: 'Milho safrinha',
    teto_custeio_por_ha: { min: 1800, max: 3200 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Risco climático maior. Comitê pondera janela.',
    delta_score_base: 3,
    icone: 'Wheat',
  },
  {
    id: 'algodao',
    nome: 'Algodão',
    teto_custeio_por_ha: { min: 7000, max: 12000 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Custo alto, mas margem boa. Exige projeto técnico denso.',
    delta_score_base: 4,
    icone: 'Flower',
  },
  {
    id: 'cafe_arabica',
    nome: 'Café arábica',
    teto_custeio_por_ha: { min: 12000, max: 22000 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1 / Pronamp',
    observacao: 'Linha tradicional. Reciprocidade bancária pesa.',
    delta_score_base: 3,
    icone: 'Coffee',
  },
  {
    id: 'cafe_conilon',
    nome: 'Café conilon',
    teto_custeio_por_ha: { min: 8000, max: 14000 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Mais resiliente que o arábica. Preço mais volátil.',
    delta_score_base: 3,
    icone: 'Coffee',
  },
  {
    id: 'cana',
    nome: 'Cana-de-açúcar',
    teto_custeio_por_ha: { min: 4500, max: 8000 },
    linha_mcr_provavel: 'Custeio Agrícola / Investimento (renovação)',
    observacao: 'Geralmente integrada (cooperativa/usina). Comitê valida contrato.',
    delta_score_base: 4,
    icone: 'Sprout',
  },
  {
    id: 'feijao',
    nome: 'Feijão',
    teto_custeio_por_ha: { min: 2200, max: 3800 },
    linha_mcr_provavel: 'Custeio Agrícola / Pronaf',
    observacao: 'Cultura pequena/média. Pronaf comum.',
    delta_score_base: 2,
    icone: 'Sprout',
  },
  {
    id: 'trigo',
    nome: 'Trigo',
    teto_custeio_por_ha: { min: 2000, max: 3500 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Sul do Brasil. Subsídio + preço regulado.',
    delta_score_base: 3,
    icone: 'Wheat',
  },
  {
    id: 'arroz_irrigado',
    nome: 'Arroz irrigado',
    teto_custeio_por_ha: { min: 6000, max: 10000 },
    linha_mcr_provavel: 'Custeio Agrícola — MCR 3-2-1',
    observacao: 'Alto custo, alta produtividade. RS predomina.',
    delta_score_base: 3,
    icone: 'Wheat',
  },
  {
    id: 'pecuaria_corte',
    nome: 'Pecuária de corte',
    teto_custeio_por_ha: { min: 1500, max: 3500 },
    linha_mcr_provavel: 'Custeio Pecuário / Investimento',
    observacao: 'Garantia natural (semovente). Saldo de gado obrigatório.',
    delta_score_base: 4,
    icone: 'Beef',
  },
  {
    id: 'pecuaria_leite',
    nome: 'Pecuária de leite',
    teto_custeio_por_ha: { min: 2500, max: 5000 },
    linha_mcr_provavel: 'Custeio Pecuário / Pronamp',
    observacao: 'Receita mensal — bom pra fluxo de caixa.',
    delta_score_base: 3,
    icone: 'Beef',
  },
  {
    id: 'suinocultura_integracao',
    nome: 'Suinocultura — integração',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Investimento (Inovagro / ABC+)',
    observacao: 'Cessão de creditórios da integradora pesa muito (+22 a +25 garantia).',
    delta_score_base: 4,
    icone: 'Beef',
  },
  {
    id: 'suinocultura_independente',
    nome: 'Suinocultura independente',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Custeio / Investimento',
    observacao: 'Risco maior — exposição direta a preço de comoditie.',
    delta_score_base: 1,
    icone: 'Beef',
  },
  {
    id: 'avicultura_corte',
    nome: 'Avicultura de corte',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Investimento (galpões) / Custeio',
    observacao: 'Quase sempre integrado. Comitê valida contrato com integradora AAA.',
    delta_score_base: 4,
    icone: 'Egg',
  },
  {
    id: 'avicultura_postura',
    nome: 'Avicultura de postura',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Custeio / Investimento',
    observacao: 'Receita mensal estável quando há contrato.',
    delta_score_base: 3,
    icone: 'Egg',
  },
  {
    id: 'piscicultura_tanque_rede',
    nome: 'Piscicultura — tanque rede',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Custeio Pecuário / Investimento',
    observacao: 'Linha menos madura. Comitê pede laudo técnico forte.',
    delta_score_base: 1,
    icone: 'Fish',
  },
  {
    id: 'alevinos',
    nome: 'Alevinos',
    teto_custeio_por_ha: { min: 0, max: 0 },
    linha_mcr_provavel: 'Investimento',
    observacao: 'Nicho. Difícil enquadramento padrão.',
    delta_score_base: 0,
    icone: 'Fish',
  },
  {
    id: 'fruticultura_citros',
    nome: 'Fruticultura — citros',
    teto_custeio_por_ha: { min: 8000, max: 18000 },
    linha_mcr_provavel: 'Custeio Agrícola / Pronamp',
    observacao: 'Ciclo longo. Comitê pede projeto agronômico.',
    delta_score_base: 2,
    icone: 'Citrus',
  },
  {
    id: 'fruticultura_uva',
    nome: 'Fruticultura — uva',
    teto_custeio_por_ha: { min: 15000, max: 30000 },
    linha_mcr_provavel: 'Investimento / Custeio',
    observacao: 'Alto custo. Garantia real geralmente exigida.',
    delta_score_base: 2,
    icone: 'Grape',
  },
  {
    id: 'fruticultura_banana',
    nome: 'Fruticultura — banana',
    teto_custeio_por_ha: { min: 6000, max: 12000 },
    linha_mcr_provavel: 'Custeio Agrícola',
    observacao: 'Cultura permanente. Receita ao longo do ano.',
    delta_score_base: 2,
    icone: 'Banana',
  },
  {
    id: 'hortifruti',
    nome: 'Hortifruti',
    teto_custeio_por_ha: { min: 12000, max: 25000 },
    linha_mcr_provavel: 'Custeio / Pronaf',
    observacao: 'Margem alta, risco operacional alto. Mercado spot.',
    delta_score_base: 1,
    icone: 'Carrot',
  },
  {
    id: 'florestal_eucalipto',
    nome: 'Florestal — eucalipto',
    teto_custeio_por_ha: { min: 4000, max: 8000 },
    linha_mcr_provavel: 'Investimento (ABC+ Florestal)',
    observacao: 'Ciclo longo (7 anos). Linha verde é diferencial.',
    delta_score_base: 3,
    icone: 'Trees',
  },
]

export function getCultura(id: CulturaId): Cultura | undefined {
  return CULTURAS.find((c) => c.id === id)
}
