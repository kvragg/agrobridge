import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { PerfilEntrevista } from '@/types/entrevista'

// Carregado uma vez no startup do servidor
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'checklist-system.md'),
  'utf-8'
)

export const SONNET_MODEL = 'claude-sonnet-4-6' as const

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

/**
 * Gera o checklist completo a partir do JSON de perfil da entrevista.
 * Retorna o texto markdown com o checklist priorizado.
 */
export async function gerarChecklist(perfil: PerfilEntrevista): Promise<string> {
  const response = await getClient().messages.create({
    model: SONNET_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Gere o checklist personalizado para este perfil:\n\n${JSON.stringify(perfil, null, 2)}`,
      },
    ],
  })

  const bloco = response.content[0]
  if (bloco.type !== 'text') {
    throw new Error('Resposta inesperada do Sonnet')
  }
  return bloco.text
}
