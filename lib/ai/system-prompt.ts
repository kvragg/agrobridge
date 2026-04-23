// Server-only — Constrói o system prompt da IA AgroBridge (entrevista única).
//
// IA v2.1 (Onda 3): mesmo prompt-base do Onda 2 (carregado de
// `prompts/chat-system.md`) + contexto dinâmico do lead, mas agora
// dividido em dois blocos separados para aproveitar prompt caching da
// Anthropic API.
//
// Layout dos blocos de system:
//   [0] texto-base estável (idêntico entre todas as sessões) ...............
//       -> marcado com cache_control: { type: 'ephemeral' }
//       -> TTL ~5min no cache de prompts da Anthropic
//   [1] contexto dinâmico deste lead (perfil_json, memória IA) ............
//       -> NÃO cacheado (muda a cada turno)
//
// Regra: cache_control precisa ficar no último bloco que você quer que
// faça parte do prefixo cacheado. Como [0] é o último bloco que NÃO
// muda, é nele que vai a marca.
//
// Quando o lead manda a N-ésima mensagem da mesma sessão, o prefixo
// grande (SYSTEM_BASE ~1800 tokens) vira cache hit → 90% mais barato e
// ~2x mais rápido na 1ª latência.

import 'server-only'
import fs from 'fs'
import path from 'path'
import type { PerfilLead } from '@/types/perfil-lead'

// Bloco de system aceito pelo SDK da Anthropic. `cache_control` é
// opcional; quando presente, a API guarda o prefixo resultante por
// ~5min (ephemeral) ou até reset.
export interface SystemBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

let _systemBaseCache: string | null = null

function carregarSystemBase(): string {
  if (_systemBaseCache) return _systemBaseCache
  _systemBaseCache = fs.readFileSync(
    path.join(process.cwd(), 'prompts', 'chat-system.md'),
    'utf-8'
  )
  return _systemBaseCache
}

// Monta o texto do segundo bloco (contexto dinâmico deste lead).
// Mantido aqui — e não em chat.ts — pra deixar claro que ESSE pedaço
// NÃO deve ir para o cache.
const FREEMIUM_LIMITE = 5

export function montarContextoLead(perfil: PerfilLead | null): string {
  if (!perfil) {
    return [
      '## Contexto do lead',
      '',
      'Lead NOVO — ainda não sabemos nada. Estamos no TURNO 1 do Free (5 turnos no total).',
      'Faça a abertura do Turno 1 conforme o system prompt: autoridade empática, pergunta ampla agrupando nome + região + atividade + área + objetivo + motivação por trás.',
    ].join('\n')
  }

  const linhas: string[] = ['## Contexto do lead']
  linhas.push(`- Nome: ${perfil.nome ?? 'ainda não informado'}`)

  const local: string[] = []
  if (perfil.fazenda_nome) local.push(perfil.fazenda_nome)
  if (perfil.fazenda_area_ha) local.push(`${perfil.fazenda_area_ha} ha`)
  if (perfil.municipio || perfil.estado_uf) {
    local.push(
      `em ${perfil.municipio ?? ''}${perfil.municipio && perfil.estado_uf ? '/' : ''}${perfil.estado_uf ?? ''}`
    )
  }
  linhas.push(`- Fazenda: ${local.length ? local.join(' - ') : 'ainda não informada'}`)
  linhas.push(`- Cultura principal: ${perfil.cultura_principal ?? 'ainda não informada'}`)

  const obj: string[] = []
  if (perfil.finalidade_credito) obj.push(perfil.finalidade_credito)
  if (perfil.valor_pretendido) obj.push(`R$ ${Number(perfil.valor_pretendido).toLocaleString('pt-BR')}`)
  if (perfil.banco_alvo) obj.push(`no ${perfil.banco_alvo}`)
  linhas.push(`- Objetivo atual: ${obj.length ? obj.join(' de ') : 'ainda não informado'}`)

  linhas.push(`- Histórico de crédito: ${perfil.historico_credito ?? 'ainda não informado'}`)

  const mem = perfil.memoria_ia ?? {}
  if (Object.keys(mem).length > 0) {
    linhas.push('- Fatos adicionais conhecidos:')
    for (const [k, v] of Object.entries(mem)) {
      linhas.push(`  - ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    }
  }

  // Posição do lead na sequência de 5 turnos do Free. Ajuda a IA a
  // saber se tá no começo, no meio ou no fechamento — e a aplicar o
  // gancho estratégico certo no turno 5.
  const turnosUsados = perfil.perguntas_respondidas_gratis
  const proximoTurno = Math.min(turnosUsados + 1, FREEMIUM_LIMITE)
  linhas.push('')
  linhas.push('## Posição na sequência Free')
  linhas.push(`- Turnos já usados: ${turnosUsados}/${FREEMIUM_LIMITE}`)
  linhas.push(`- Próximo turno a executar: T${proximoTurno}/${FREEMIUM_LIMITE}`)
  if (proximoTurno === 1) {
    linhas.push('- Estratégia: abertura ampla com autoridade empática.')
  } else if (proximoTurno === 2) {
    linhas.push('- Estratégia: operação + histórico bancário (sem julgamento, permissão explícita).')
  } else if (proximoTurno === 3) {
    linhas.push('- Estratégia: saúde financeira (endividamento, garantias, reciprocidade). Gatilho de escassez.')
  } else if (proximoTurno === 4) {
    linhas.push('- Estratégia: documentos + ambiental + tópicos sensíveis (PEP, processos, embargos, mídia). Devolva mini-diagnóstico parcial.')
  } else if (proximoTurno === 5) {
    linhas.push('- Estratégia: ÚLTIMO TURNO — colete valor exato/prazo/projetista e FECHE com o gancho de entrega da análise completa. NÃO mencione nomes de planos (a mini-análise faz).')
  } else {
    linhas.push('- Lead já passou dos 5 turnos do Free (ou é pagante). Continue em modo consultor completo, sem gatilhos de fechamento.')
  }

  linhas.push(
    '\nSe já conhece o nome/fazenda e é o primeiro turno da sessão de hoje, cumprimente com contexto curto. Não repita pergunta que já está acima.'
  )

  return linhas.join('\n')
}

// Retorna os blocos de system prontos pro SDK. O bloco [0] é grande e
// estável (alvo do cache); o bloco [1] é curto e varia por lead.
export function buildSystemBlocks(perfil: PerfilLead | null): SystemBlock[] {
  return [
    {
      type: 'text',
      text: carregarSystemBase(),
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: montarContextoLead(perfil),
    },
  ]
}
