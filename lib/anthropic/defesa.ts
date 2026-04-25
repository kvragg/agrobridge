import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { PerfilEntrevista } from '@/types/entrevista'
import type { DocumentoStatus } from '@/lib/dossie/status'
import { SONNET_MODEL } from './sonnet'

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'dossie-system.md'),
  'utf-8'
)

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export interface GerarLaudoInput {
  perfil: PerfilEntrevista
  checklistMd: string
  documentos: DocumentoStatus[]
}

export async function gerarLaudo({
  perfil,
  checklistMd,
  documentos,
}: GerarLaudoInput): Promise<string> {
  const docJson = documentos.map((d) => ({
    categoria: d.categoria,
    nome_esperado: d.nome_esperado,
    enviado: d.enviado,
    validacao: d.validacao
      ? {
          status: d.validacao.status,
          resumo: d.validacao.resumo,
          pendencias: d.validacao.pendencias ?? [],
          observacao_banco: d.validacao.observacao_banco,
        }
      : null,
  }))

  const userMessage = [
    '### PERFIL_JSON',
    '```json',
    JSON.stringify(perfil, null, 2),
    '```',
    '',
    '### CHECKLIST_MD',
    '```markdown',
    checklistMd,
    '```',
    '',
    '### DOCUMENTACAO_APRESENTADA',
    '```json',
    JSON.stringify(docJson, null, 2),
    '```',
    '',
    'Redija o laudo completo seguindo exatamente a estrutura do system prompt. Não inclua preâmbulo nem explicação — apenas o laudo em markdown.',
  ].join('\n')

  const response = await getClient().messages.create({
    model: SONNET_MODEL,
    max_tokens: 6144,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const bloco = response.content[0]
  if (bloco.type !== 'text') throw new Error('Resposta inesperada do Sonnet')
  return bloco.text
}

