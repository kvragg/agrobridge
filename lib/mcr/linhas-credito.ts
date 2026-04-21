// Base de conhecimento MCR — linhas de credito rural 2026.
//
// FONTE: conhecimento interno do fundador (14 anos em banco privado).
// VALORES MARCADOS COMO APROXIMADOS sao placeholders razoaveis do mercado
// aberto — Paulo revisa e substitui com dados exatos numa iteracao MCR
// especifica. NUNCA exibir valores ao lead sem a ressalva "sujeito a
// analise / confirme na instituicao".

export type FinalidadeCredito =
  | 'custeio'
  | 'investimento'
  | 'comercializacao'
  | 'industrializacao'

export interface LinhaCredito {
  id: string
  nome: string
  publico_alvo: string
  teto_estimado_2026_brl: number | null
  taxa_estimada_aa: { min: number; max: number } | null
  finalidades_aceitas: readonly FinalidadeCredito[]
  notas_mcr: string
  aprox: boolean // true = placeholder de mercado; revisar com Paulo
}

// TODO: Paulo confirmar — taxas e tetos reais 2026 (plano safra vigente).
// Estes valores sao aproximacoes do mercado aberto, precisam revisao.
export const LINHAS_CREDITO: readonly LinhaCredito[] = [
  {
    id: 'pronaf_custeio',
    nome: 'Pronaf Custeio',
    publico_alvo:
      'Agricultor familiar com DAP/CAF ativa (renda bruta anual ate R$ 500 mil).',
    teto_estimado_2026_brl: 250_000,
    taxa_estimada_aa: { min: 3, max: 6 },
    finalidades_aceitas: ['custeio'],
    notas_mcr:
      'Exige DAP/CAF vigente. Pronaf Mais Alimentos (investimento) tem regra distinta.',
    aprox: true,
  },
  {
    id: 'pronaf_investimento',
    nome: 'Pronaf Mais Alimentos (Investimento)',
    publico_alvo:
      'Agricultor familiar com DAP/CAF ativa para aquisicao de maquinas, bens de producao.',
    teto_estimado_2026_brl: 500_000,
    taxa_estimada_aa: { min: 4, max: 7 },
    finalidades_aceitas: ['investimento'],
    notas_mcr:
      'Prazo mais longo (ate 10 anos). Projeto tecnico obrigatorio para valores mais altos.',
    aprox: true,
  },
  {
    id: 'pronamp_custeio',
    nome: 'Pronamp Custeio',
    publico_alvo:
      'Medio produtor (receita bruta anual ate R$ 3 milhoes). Ponte entre Pronaf e comercial.',
    teto_estimado_2026_brl: 2_000_000,
    taxa_estimada_aa: { min: 6, max: 9 },
    finalidades_aceitas: ['custeio'],
    notas_mcr: 'Requer declaracao de aptidao ao Pronamp emitida pela instituicao.',
    aprox: true,
  },
  {
    id: 'pronamp_investimento',
    nome: 'Pronamp Investimento',
    publico_alvo: 'Medio produtor (receita bruta anual ate R$ 3 milhoes).',
    teto_estimado_2026_brl: 1_500_000,
    taxa_estimada_aa: { min: 7, max: 10 },
    finalidades_aceitas: ['investimento'],
    notas_mcr: 'Prazo tipico 8-10 anos. Analise de projeto tecnico obrigatoria.',
    aprox: true,
  },
  {
    id: 'custeio_rural_comercial',
    nome: 'Custeio Rural (recursos livres)',
    publico_alvo:
      'Grande produtor acima do teto Pronamp. Taxas sem equalizacao do Tesouro.',
    teto_estimado_2026_brl: null,
    taxa_estimada_aa: { min: 10, max: 16 },
    finalidades_aceitas: ['custeio'],
    notas_mcr:
      'Taxa de mercado. Demanda garantia real robusta (hipoteca, CPR, penhor agricola).',
    aprox: true,
  },
  {
    id: 'investimento_fco_fne_fno',
    nome: 'FCO / FNE / FNO Rural',
    publico_alvo:
      'Produtores em areas de atuacao dos fundos constitucionais (Centro-Oeste / Nordeste / Norte).',
    teto_estimado_2026_brl: 20_000_000,
    taxa_estimada_aa: { min: 7, max: 12 },
    finalidades_aceitas: ['investimento', 'industrializacao'],
    notas_mcr:
      'Projeto tecnico obrigatorio. Analise de viabilidade economica rigorosa. Prazo ate 12 anos.',
    aprox: true,
  },
  {
    id: 'bndes_inovagro',
    nome: 'BNDES Inovagro',
    publico_alvo: 'Inovacao tecnologica na propriedade (irrigacao, agricultura de precisao).',
    teto_estimado_2026_brl: 2_000_000,
    taxa_estimada_aa: { min: 8, max: 12 },
    finalidades_aceitas: ['investimento'],
    notas_mcr:
      'Exige projeto tecnico com descricao detalhada da inovacao. Analise via banco repassador.',
    aprox: true,
  },
  {
    id: 'comercializacao_epr_pca',
    nome: 'Empresta Pre-fixado de Recebiveis / PCA',
    publico_alvo: 'Produtores com estoque fisico (soja/milho/algodao) ou contratos CPR.',
    teto_estimado_2026_brl: null,
    taxa_estimada_aa: { min: 8, max: 14 },
    finalidades_aceitas: ['comercializacao'],
    notas_mcr: 'Demanda CPR, warrantage ou similar. Prazo curto (ate 12 meses).',
    aprox: true,
  },
] as const

export function acharLinhaPorId(id: string): LinhaCredito | undefined {
  return LINHAS_CREDITO.find((l) => l.id === id)
}

// Heuristica simples para sugerir linhas a partir do perfil do lead.
// A IA usa isso como shortlist e justifica a escolha final.
export function sugerirLinhasPorPerfil(params: {
  valor_pretendido: number | null
  finalidade: FinalidadeCredito | null
  renda_bruta_anual_estimada?: number | null
  estado_uf?: string | null
}): readonly LinhaCredito[] {
  const { valor_pretendido, finalidade, renda_bruta_anual_estimada, estado_uf } = params
  return LINHAS_CREDITO.filter((l) => {
    if (finalidade && !l.finalidades_aceitas.includes(finalidade)) return false
    if (valor_pretendido && l.teto_estimado_2026_brl && valor_pretendido > l.teto_estimado_2026_brl) return false
    if (renda_bruta_anual_estimada) {
      if (l.id.startsWith('pronaf') && renda_bruta_anual_estimada > 500_000) return false
      if (l.id.startsWith('pronamp') && renda_bruta_anual_estimada > 3_000_000) return false
    }
    if (l.id === 'investimento_fco_fne_fno' && estado_uf) {
      const uf = estado_uf.toUpperCase()
      const FCO = ['DF', 'GO', 'MT', 'MS']
      const FNE = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE']
      const FNO = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO']
      if (![...FCO, ...FNE, ...FNO].includes(uf)) return false
    }
    return true
  }).slice(0, 3)
}
