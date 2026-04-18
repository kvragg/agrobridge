// Server-only — nunca importar de client components (expõe ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

// Carregado uma vez no startup do servidor
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'entrevista-system.md'),
  'utf-8'
)

export const HAIKU_MODEL = 'claude-haiku-4-5' as const

// Cliente reutilizável — instanciado uma vez por worker
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export interface MensagemChat {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Cria um stream de texto com o Haiku para a entrevista.
 * Retorna o stream do SDK Anthropic para ser consumido via SSE.
 */
export function criarStreamEntrevista(historico: MensagemChat[]) {
  return getClient().messages.stream({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: historico,
  })
}
