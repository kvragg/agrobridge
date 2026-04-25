import 'server-only'

// Server-only — nunca importar de client components (expõe ANTHROPIC_API_KEY).
// Nome "haiku" é legado — o modelo agora é Sonnet 4.6 pra toda a entrevista.
// Mantido como arquivo de compatibilidade até refactor completo (2026-Q3).
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { MODEL, CACHE_EPHEMERAL } from './model'

// System prompt carregado 1x no startup
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'entrevista-system.md'),
  'utf-8',
)

// Alias retrocompatível — código legado importa HAIKU_MODEL.
// Aponta pro Sonnet 4.6 agora (uniformização 2026-04-22).
export const HAIKU_MODEL = MODEL

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

export interface MensagemChat {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Stream de texto com Sonnet 4.6 para a entrevista.
 * System prompt é cacheado ephemeral — cortam ~80% do custo em rodadas
 * repetidas do mesmo usuário dentro da janela de 5 min do cache.
 */
export function criarStreamEntrevista(historico: MensagemChat[]) {
  return getClient().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: historico,
  })
}
