import 'server-only'

// Server-only — nunca importar de client components (expõe ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { PerfilEntrevista } from '@/types/entrevista'
import { MODEL, CACHE_EPHEMERAL } from './model'

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'checklist-system.md'),
  'utf-8',
)

// Alias retrocompatível pra código legado.
export const SONNET_MODEL = MODEL

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada no ambiente do servidor.')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

/**
 * Gera o checklist completo a partir do JSON de perfil.
 * System prompt cacheado ephemeral.
 */
export async function gerarChecklist(perfil: PerfilEntrevista): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Gere o checklist personalizado para este perfil:\n\n${JSON.stringify(perfil, null, 2)}`,
      },
    ],
  })

  const bloco = response.content[0]
  if (bloco.type !== 'text') {
    throw new Error('Resposta inesperada do modelo')
  }
  return bloco.text
}
