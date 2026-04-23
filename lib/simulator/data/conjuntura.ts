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
    'Cenário de Selic em patamar elevado, margem de aprovação apertada nos comitês e aumento de pedidos de recuperação judicial. Garantias tradicionais (penhor simples, aval puro) estão com aprovação significativamente mais difícil.',
  modificadores: {
    penhor_safra_sem_seguro: -3, // piora ainda mais
    penhor_safra_com_seguro: -2,
    aval_puro_sem_respaldo: -3,
    aval_terceiro_fraco: -2,
    hipoteca_1grau: -2, // até hipoteca tá mais chata
    alienacao_fiduciaria_guarda_chuva: 2, // premia garantia forte
    cessao_creditorios_aaa: 2,
  },
  avisos: [
    'Cenário atual: Selic elevada e margem apertada. Comitês priorizam garantias com liquidez e guarda-chuva patrimonial.',
    'Penhor simples e aval puro têm taxa de aprovação significativamente menor que em 2022-2023.',
  ],
}
