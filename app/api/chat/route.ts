// Entrevista unica com memoria persistente + gate freemium (Onda 2).
//
// Fluxo por turno:
//   1. Valida sessao.
//   2. Rate-limit por user.
//   3. Carrega perfis_lead (auto-criado no signup) + ultimas 30 mensagens.
//   4. Monta system prompt com contexto do lead + streama resposta Haiku.
//   5. Em paralelo (depois do stream): extrai fatos novos via Haiku nao-stream
//      e faz merge em perfis_lead.
//   6. Persiste turno (user + assistant) em mensagens.
//   7. Incrementa perguntas_respondidas_gratis (apenas tier=free).
//   8. Se tier=free e contador == 5: gera/retorna mini-analise + trigger_paywall.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarStreamChat, detalharErroAnthropic, type MensagemChat } from '@/lib/anthropic/chat'
import { extrairFatosDaTroca } from '@/lib/ai/extract-facts'
import { gerarMiniAnalise } from '@/lib/anthropic/mini-analise'
import { rateLimitIARemoto } from '@/lib/rate-limit-upstash'
import { logAuditEvent } from '@/lib/audit'
import { getPlanoAtual } from '@/lib/plano'
import type { PerfilLead } from '@/types/perfil-lead'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_MENSAGEM_CHARS = 10_000
const HISTORICO_MAX = 30
const FREEMIUM_LIMITE = 5

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Nao autorizado', { status: 401 })

  const body = (await request.json().catch(() => null)) as { mensagem?: string } | null
  const mensagemRaw = body?.mensagem
  if (typeof mensagemRaw !== 'string' || !mensagemRaw.trim()) {
    return new Response('Mensagem invalida', { status: 400 })
  }
  const mensagemUser = mensagemRaw.trim().slice(0, MAX_MENSAGEM_CHARS)

  const admin = createAdminClient()

  // Carrega perfil + historico em paralelo
  const [{ data: perfilRaw }, { data: historicoRaw }, plano] = await Promise.all([
    admin.from('perfis_lead').select('*').eq('user_id', user.id).maybeSingle(),
    admin
      .from('mensagens')
      .select('role, content')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(HISTORICO_MAX),
    getPlanoAtual(),
  ])

  // Rate-limit por tier (Free 10/h · Bronze 25/h · Prata 50/h · Ouro 100/h)
  const limite = await rateLimitIARemoto({ userId: user.id, plano: plano.plano, canal: 'chat' })
  if (!limite.ok) {
    return Response.json(
      {
        erro: `Limite de ${limite.limite} mensagens por hora atingido no plano ${plano.plano}. Aguarde ou faça upgrade.`,
        retry_after_seconds: limite.retryAfterSeconds,
        tier: limite.tier,
        limite_hora: limite.limite,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limite.retryAfterSeconds) },
      },
    )
  }

  const perfil = (perfilRaw ?? null) as PerfilLead | null
  // Sanitiza pro shape exato da Anthropic API. messages.create() rejeita
  // qualquer campo extra (created_at, id, user_id) com 400 invalid_request_error
  // — defense-in-depth contra futuros selects vazarem colunas.
  const historico: MensagemChat[] = (historicoRaw ?? [])
    .reverse()
    .map((m) => ({ role: m.role as MensagemChat['role'], content: m.content }))

  // Gate freemium: tier=free + limite ja atingido -> retorna paywall direto sem consumir IA.
  const isFree = plano.tier === null
  if (isFree && perfil && perfil.perguntas_respondidas_gratis >= FREEMIUM_LIMITE) {
    const mini = await garantirMiniAnalise(user.id, perfil).catch((err) => {
      console.error('[chat] falha ao gerar mini-analise:', err)
      return perfil.mini_analise_texto ?? null
    })
    return Response.json({
      trigger_paywall: true,
      mini_analise: mini,
      motivo: 'limite_freemium_atingido',
    })
  }

  // Monta historico completo (adicionando a nova mensagem do user)
  const historicoCompleto: MensagemChat[] = [...historico, { role: 'user', content: mensagemUser }]

  const encoder = new TextEncoder()
  let respostaCompleta = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const iaStream = criarStreamChat({ perfil, historico: historicoCompleto })
        for await (const chunk of iaStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            respostaCompleta += chunk.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            )
          }
        }
      } catch (err) {
        const d = detalharErroAnthropic(err)
        console.error('[api/chat] erro no stream:', d, err)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ erro: `Falha na IA: ${d.mensagemCurta}` })}\n\n`)
        )
        controller.close()
        return
      }

      // Persistencia + extracao fire-and-forget (nao-bloqueante pro SSE)
      persistirTurnoEFatos({
        userId: user.id,
        perfilAtual: perfil,
        mensagemUser,
        respostaIA: respostaCompleta,
        isFree,
      }).catch((err) => console.error('[api/chat] persistencia falhou:', err))

      // Se isFree e esta no turno 5 (ou logo apos), preemptivamente dispara mini
      // pra proxima request. Melhor UX: quando o lead mandar a 6a, ja tem cache.
      if (isFree && perfil && perfil.perguntas_respondidas_gratis + 1 >= FREEMIUM_LIMITE) {
        ;(async () => {
          try {
            const { data: perfilAtualizado } = await admin
              .from('perfis_lead')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
            if (perfilAtualizado) {
              await garantirMiniAnalise(user.id, perfilAtualizado as PerfilLead)
            }
          } catch (err) {
            console.error('[api/chat] pre-gerar mini-analise falhou:', err)
          }
        })()
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

async function persistirTurnoEFatos(params: {
  userId: string
  perfilAtual: PerfilLead | null
  mensagemUser: string
  respostaIA: string
  isFree: boolean
}) {
  const admin = createAdminClient()
  const { userId, perfilAtual, mensagemUser, respostaIA, isFree } = params

  await admin.from('mensagens').insert([
    { user_id: userId, role: 'user', content: mensagemUser },
    { user_id: userId, role: 'assistant', content: respostaIA },
  ])

  // Extrai fatos em paralelo com incremento do contador
  const [fatos] = await Promise.all([
    extrairFatosDaTroca({ mensagemUser, respostaIA }),
  ])

  const atualizacoes: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fatos.campos_diretos)) {
    if (v !== null && v !== undefined) atualizacoes[k] = v
  }

  if (Object.keys(fatos.memoria_ia_adicionar).length > 0) {
    const memAnterior = (perfilAtual?.memoria_ia ?? {}) as Record<string, unknown>
    atualizacoes.memoria_ia = { ...memAnterior, ...fatos.memoria_ia_adicionar }
  }

  if (isFree) {
    const atual = perfilAtual?.perguntas_respondidas_gratis ?? 0
    atualizacoes.perguntas_respondidas_gratis = atual + 1
  }

  if (Object.keys(atualizacoes).length > 0) {
    const { error } = await admin
      .from('perfis_lead')
      .update(atualizacoes)
      .eq('user_id', userId)
    if (error) {
      console.error('[api/chat] update perfis_lead falhou:', error)
    } else if (Object.keys(fatos.campos_diretos).length > 0 || Object.keys(fatos.memoria_ia_adicionar).length > 0) {
      logAuditEvent({
        userId,
        eventType: 'perfil_lead_atualizado',
        payload: {
          campos_alterados: Object.keys(fatos.campos_diretos),
          memoria_ia_keys: Object.keys(fatos.memoria_ia_adicionar),
        },
      })
    }
  }

  logAuditEvent({
    userId,
    eventType: 'chat_mensagem',
    payload: { tamanho_user: mensagemUser.length, tamanho_ia: respostaIA.length },
  })
}

// Garante mini-analise em cache (perfis_lead.mini_analise_texto). Se ja
// existe, retorna o cache. Idempotente por turno.
async function garantirMiniAnalise(userId: string, perfil: PerfilLead): Promise<string | null> {
  if (perfil.mini_analise_texto) return perfil.mini_analise_texto

  const admin = createAdminClient()
  const texto = await gerarMiniAnalise(perfil)
  await admin
    .from('perfis_lead')
    .update({ mini_analise_texto: texto, mini_analise_gerada_em: new Date().toISOString() })
    .eq('user_id', userId)

  await logAuditEvent({
    userId,
    eventType: 'mini_analise_gerada',
    payload: { caracteres: texto.length },
  })
  await logAuditEvent({
    userId,
    eventType: 'gate_freemium_ativado',
    payload: { limite: FREEMIUM_LIMITE },
  })

  return texto
}
