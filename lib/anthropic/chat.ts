// Server-only — cliente Anthropic + system prompt do chat unico com memoria.
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { PerfilLead } from '@/types/perfil-lead'

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001' as const

const SYSTEM_BASE = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'chat-system.md'),
  'utf-8'
)

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY nao configurada no ambiente do servidor.')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export interface MensagemChat {
  role: 'user' | 'assistant'
  content: string
}

// Monta a parte dinamica do system prompt com o que a IA ja sabe do lead.
// Esse "contexto" e concatenado ao prompt-base carregado do arquivo.
export function montarContextoLead(perfil: PerfilLead | null): string {
  if (!perfil) {
    return '\n\n## Contexto do lead\n\nAinda nao conhecemos este lead. Faca abertura limpa pedindo nome + regiao + atividade.'
  }

  const linhas: string[] = ['\n\n## Contexto do lead']
  linhas.push(`- Nome: ${perfil.nome ?? 'ainda nao informado'}`)

  const local: string[] = []
  if (perfil.fazenda_nome) local.push(perfil.fazenda_nome)
  if (perfil.fazenda_area_ha) local.push(`${perfil.fazenda_area_ha} ha`)
  if (perfil.municipio || perfil.estado_uf) {
    local.push(`em ${perfil.municipio ?? ''}${perfil.municipio && perfil.estado_uf ? '/' : ''}${perfil.estado_uf ?? ''}`)
  }
  linhas.push(`- Fazenda: ${local.length ? local.join(' - ') : 'ainda nao informada'}`)
  linhas.push(`- Cultura principal: ${perfil.cultura_principal ?? 'ainda nao informada'}`)

  const obj: string[] = []
  if (perfil.finalidade_credito) obj.push(perfil.finalidade_credito)
  if (perfil.valor_pretendido) obj.push(`R$ ${Number(perfil.valor_pretendido).toLocaleString('pt-BR')}`)
  if (perfil.banco_alvo) obj.push(`no ${perfil.banco_alvo}`)
  linhas.push(`- Objetivo atual: ${obj.length ? obj.join(' de ') : 'ainda nao informado'}`)

  linhas.push(`- Historico de credito: ${perfil.historico_credito ?? 'ainda nao informado'}`)

  const mem = perfil.memoria_ia ?? {}
  if (Object.keys(mem).length > 0) {
    linhas.push('- Fatos adicionais conhecidos:')
    for (const [k, v] of Object.entries(mem)) {
      linhas.push(`  - ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    }
  }

  linhas.push(
    '\nSe e o primeiro turno da sessao e voce ja conhece o nome ou a fazenda, cumprimente com contexto. Nao pergunte de novo o que ja esta acima.'
  )

  return linhas.join('\n')
}

export function criarStreamChat(params: {
  perfil: PerfilLead | null
  historico: MensagemChat[]
}) {
  const system = SYSTEM_BASE + montarContextoLead(params.perfil)

  return getClient().messages.stream({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system,
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
    else if (status === 404) curta = `modelo nao encontrado (${HAIKU_MODEL}).`
    else if (status === 400 && /credit balance/i.test(msg))
      curta = 'saldo Anthropic esgotado. Contate o administrador.'
    else if (status === 429) curta = 'limite de requisicoes atingido. Aguarde.'
    else if (status === 529 || status === 503) curta = 'IA sobrecarregada. Tente em alguns segundos.'
    else if (status && status >= 500) curta = `erro no provedor (${status}).`
    return { status, mensagemCurta: curta.slice(0, 200) }
  }
  return { mensagemCurta: String(err).slice(0, 200) }
}
