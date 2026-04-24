/**
 * PDF Prata · Dossiê Bancário Completo
 *
 * Wrapper thin sobre `pdf-v06.ts` (template único Verde Agro Premium).
 * Prata renderiza as 6 páginas base (capa + sumário + caracterização +
 * viabilidade + garantias + parecer). Preserva interface legada pra
 * não quebrar `/api/dossie`.
 */

import type { PerfilEntrevista } from '@/types/entrevista'
import { montarLaudoPDF } from './pdf-v06'

export interface DossieInput {
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
}

export async function montarDossiePDF(input: DossieInput): Promise<Buffer> {
  return montarLaudoPDF({
    tier: 'dossie',
    produtor: input.produtor,
    processoId: input.processoId,
    banco: input.banco,
    valor: input.valor,
    perfil: input.perfil,
    conteudoMd: input.laudoMd,
  })
}
