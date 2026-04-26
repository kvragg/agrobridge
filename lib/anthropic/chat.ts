import 'server-only'

// Server-only — cliente Anthropic + stream do chat único com memória.
//
// IA v2.1 (Onda 3): system prompt em blocos com cache_control, montado
// em `lib/ai/system-prompt.ts`. O bloco base (~1800 tokens) fica
// cacheado por 5min (ephemeral) → cache hit na 2ª+ mensagem do mesmo
// lead na mesma sessão.
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { PerfilLead } from '@/types/perfil-lead'
import {
  buildSystemBlocks,
  type EntregaSnapshot,
  type ChecklistSnapshotPrompt,
} from '@/lib/ai/system-prompt'
import { MODEL } from './model'

// Alias retrocompatível — todo código que importa HAIKU_MODEL recebe
// Sonnet 4.6 agora (uniformização 2026-04-22).
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

// Re-export para compatibilidade com callers existentes (ex: testes).
// Fonte canônica agora é `lib/ai/system-prompt.ts`.
export { montarContextoLead } from '@/lib/ai/system-prompt'

export function criarStreamChat(params: {
  perfil: PerfilLead | null
  historico: MensagemChat[]
  entregas?: EntregaSnapshot[]
  checklist?: ChecklistSnapshotPrompt | null
}) {
  return getClient().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemBlocks(
      params.perfil,
      params.entregas ?? [],
      params.checklist ?? null,
    ),
    messages: params.historico,
  })
}

// Traducao padrao de erros do SDK -> mensagem curta para o front.
export function detalharErroAnthropic(err: unknown): {
  status?: number
  mensagemCurta: string
} {
  if (err && typeof err === 'object') {
    const e = err as {
      status?: number
      message?: string
      error?: { type?: string; message?: string }
    }
    const status = e.status
    const msg = e.error?.message ?? e.message ?? String(err)
    let curta = msg
    if (status === 401) curta = 'chave da API invalida ou ausente.'
    else if (status === 404) curta = `modelo nao encontrado (${MODEL}).`
    else if (status === 400 && /credit balance/i.test(msg))
      curta = 'saldo Anthropic esgotado. Contate o administrador.'
    else if (status === 429) curta = 'limite de requisicoes atingido. Aguarde.'
    else if (status === 529 || status === 503) curta = 'IA sobrecarregada. Tente em alguns segundos.'
    else if (status && status >= 500) curta = `erro no provedor (${status}).`
    return { status, mensagemCurta: curta.slice(0, 200) }
  }
  return { mensagemCurta: String(err).slice(0, 200) }
}
