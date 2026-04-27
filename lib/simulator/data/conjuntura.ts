// Conjuntura econômica corrente — modificadores aplicados sobre os
// deltas das garantias. Editável por PR (fica em código por enquanto;
// v2 vai pra config Supabase).

import type { GarantiaId } from './garantias'

export interface ConjunturaEconomica {
  vigencia: string
  descricao_curta: string
  descricao_longa: string
  modificadores: Partial<Record<GarantiaId, number>>
  avisos: string[]
}

export const CONJUNTURA_ATUAL: ConjunturaEconomica = {
  vigencia: '2026-Q2',
  descricao_curta: 'Selic alta, margem apertada, onda de RJs',
  descricao_longa:
    'Cenário de Selic em patamar elevado, margem de aprovação apertada nos comitês e aumento expressivo de pedidos de recuperação judicial nas instituições. Comitês hoje preferem três tipos de garantia: alienação fiduciária guarda-chuva, alienação fiduciária simples (1 imóvel) e investimento dado em garantia (CDB/LCA/poupança vinculada). Garantias tradicionais como hipoteca, CPR-F e fiança ainda passam mas com defesa técnica mais robusta. Penhor simples e aval puro têm taxa de aprovação significativamente menor.',
  modificadores: {
    // Premia as 3 preferidas
    alienacao_fiduciaria_guarda_chuva: 2,
    alienacao_fiduciaria_rural: 2,
    investimento_garantia: 3,
    cessao_creditorios_aaa: 2,
    // Penaliza fracas (aval foi removido da lista de garantias e
    // tratado via aval_tipo separado — não cabe modificador aqui)
    penhor_safra_sem_seguro: -3,
    penhor_safra_com_seguro: -2,
    hipoteca_1grau: -2,
  },
  avisos: [
    'Cenário 2026: comitês priorizam 3 tipos de garantia — alienação fiduciária (guarda-chuva ou simples) e investimento dado em garantia (CDB/LCA). O resto passa mas com defesa técnica forte.',
    'Onda de recuperações judiciais deixou comitês mais conservadores com leverage patrimonial — produtor com mais de 70% do patrimônio comprometido em crédito entra em alerta.',
  ],
}
