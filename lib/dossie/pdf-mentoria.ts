/**
 * PDF Ouro · Mesa de Crédito (Mentoria)
 *
 * Wrapper thin sobre `pdf-v06.ts` (template único Verde Agro Premium).
 * Ouro renderiza 6 páginas base + 3 exclusivas (gargalos ocultos,
 * parecer do fundador quando fornecido, roteiro de comitê). Preserva
 * interface legada pra não quebrar `/api/dossie` (rota reaproveitada
 * pelo tier Ouro).
 */

import type { PerfilEntrevista } from '@/types/entrevista'
import { montarLaudoPDF } from './pdf-v06'

export interface MentoriaInput {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  banco: string | null
  valor: number | null
  perfil: PerfilEntrevista
  laudoMd: string
  /**
   * Observações estratégicas do fundador adicionadas durante a mentoria.
   * Markdown opcional — quando presente, ativa a seção dedicada.
   */
  observacoesFundadorMd?: string
  /**
   * Número da vaga (1-6 do mês corrente). Se ausente, omite o selo.
   */
  numeroVaga?: number | null
}

export async function montarMentoriaPDF(input: MentoriaInput): Promise<Buffer> {
  return montarLaudoPDF({
    tier: 'mentoria',
    produtor: input.produtor,
    processoId: input.processoId,
    banco: input.banco,
    valor: input.valor,
    perfil: input.perfil,
    conteudoMd: input.laudoMd,
    observacoesFundadorMd: input.observacoesFundadorMd,
    numeroVaga: input.numeroVaga,
  })
}
