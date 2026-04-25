import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { PerfilEntrevista } from '@/types/entrevista'
import { SONNET_MODEL } from './sonnet'

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'viabilidade-system.md'),
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

export async function gerarParecerViabilidade(
  perfil: PerfilEntrevista
): Promise<string> {
  const userMessage = [
    '### PERFIL_JSON',
    '```json',
    JSON.stringify(perfil, null, 2),
    '```',
    '',
    'Redija o parecer seguindo exatamente a estrutura do system prompt. Sem preâmbulo, apenas o markdown do parecer.',
  ].join('\n')

  const response = await getClient().messages.create({
    model: SONNET_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const bloco = response.content[0]
  if (bloco.type !== 'text') throw new Error('Resposta inesperada do Sonnet')
  return bloco.text
}
