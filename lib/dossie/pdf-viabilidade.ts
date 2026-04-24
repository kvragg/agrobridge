/**
 * PDF Bronze · Diagnóstico Rápido
 *
 * Wrapper thin sobre `pdf-v06.ts` (template único Verde Agro Premium).
 * Bronze renderiza apenas capa + sumário executivo + parecer conclusivo
 * (3 páginas). Preserva interface legada pra não quebrar o endpoint
 * `/api/viabilidade`.
 */

import type { PerfilEntrevista } from '@/types/entrevista'
import { montarLaudoPDF } from './pdf-v06'

export interface ViabilidadeInput {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  perfil: PerfilEntrevista
  parecerMd: string
}

export async function montarViabilidadePDF(
  input: ViabilidadeInput,
): Promise<Buffer> {
  return montarLaudoPDF({
    tier: 'diagnostico',
    produtor: input.produtor,
    processoId: input.processoId,
    banco: null,
    valor: (input.perfil as unknown as Record<string, unknown>).credito
      ? ((input.perfil as unknown as { credito?: { valor_pretendido?: number } }).credito
          ?.valor_pretendido ?? null)
      : input.perfil.necessidade_credito?.valor ?? null,
    perfil: input.perfil,
    conteudoMd: input.parecerMd,
  })
}
