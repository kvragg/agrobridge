import { createClient } from '@/lib/supabase/server'
import { criarStreamEntrevista, HAIKU_MODEL } from '@/lib/anthropic/haiku'
import type { MensagemChat } from '@/lib/anthropic/haiku'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
import { capturarErroProducao } from '@/lib/logger'
import { NextRequest } from 'next/server'

function detalharErroAnthropic(err: unknown): {
  status?: number
  tipo?: string
  mensagemCurta: string
  mensagemCompleta: string
} {
  if (err && typeof err === 'object') {
    const e = err as {
      status?: number
      message?: string
      error?: { type?: string; message?: string }
      name?: string
    }
    const status = e.status
    const tipo = e.error?.type ?? e.name
    const msg = e.error?.message ?? e.message ?? String(err)
    let curta = msg
    if (status === 401) curta = 'chave da API inválida ou ausente.'
    else if (status === 404) curta = `modelo não encontrado (${HAIKU_MODEL}).`
    else if (status === 400 && /credit balance/i.test(msg))
      curta = 'saldo Anthropic esgotado. Contate o administrador.'
    else if (status === 429) curta = 'limite de requisições atingido. Aguarde.'
    else if (status === 529 || status === 503) curta = 'IA sobrecarregada. Tente em alguns segundos.'
    else if (status && status >= 500) curta = `erro no provedor (${status}).`
    return {
      status,
      tipo,
      mensagemCurta: curta.slice(0, 200),
      mensagemCompleta: `${status ?? '?'} ${tipo ?? ''} — ${msg}`,
    }
  }
  return { mensagemCurta: String(err).slice(0, 200), mensagemCompleta: String(err) }
}

// Vercel: streaming do Haiku pode levar 20–60s; default Hobby é 10s.
export const runtime = 'nodejs'
export const maxDuration = 60

// JSON de saída da entrevista: detectar quando o Haiku encerra e retornar o perfil
const JSON_FENCE_START = '```json'
const JSON_FENCE_END = '```'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Não autorizado', { status: 401 })
  }

  // Rate-limit IA por usuário — protege saldo Anthropic. 60 turnos/h cobre UX real.
  const limite = await rateLimitRemoto(`ia:entrevista:${user.id}`, 60, 60 * 60 * 1000)
  if (!limite.ok) {
    return new Response('Muitas mensagens. Aguarde alguns minutos.', {
      status: 429,
      headers: { 'Retry-After': String(limite.retryAfterSeconds) },
    })
  }

  const body = await request.json() as {
    processo_id: string
    messages: MensagemChat[]
  }

  const { processo_id, messages } = body

  if (!processo_id || !Array.isArray(messages)) {
    return new Response('Payload inválido', { status: 400 })
  }

  const MAX_MSGS = 50
  const MAX_CHARS_POR_MSG = 10_000
  if (messages.length > MAX_MSGS) {
    return new Response('Conversa excedeu o limite de mensagens.', { status: 413 })
  }
  for (const m of messages) {
    if (
      !m ||
      (m.role !== 'user' && m.role !== 'assistant') ||
      typeof m.content !== 'string' ||
      m.content.length > MAX_CHARS_POR_MSG
    ) {
      return new Response('Mensagem inválida.', { status: 400 })
    }
  }

  // Defense-in-depth (E2): RLS também garante, mas o check explícito de
  // user_id corta IDOR se uma policy for relaxada ou um caller usar admin.
  const { data: processo } = await supabase
    .from('processos')
    .select('id, user_id')
    .eq('id', processo_id)
    .single()

  if (!processo || processo.user_id !== user.id) {
    return new Response('Processo não encontrado', { status: 404 })
  }

  // Streaming SSE
  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const haikuStream = criarStreamEntrevista(messages)

        for await (const chunk of haikuStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
      } catch (err) {
        const detalhes = detalharErroAnthropic(err)
        capturarErroProducao(err, {
          modulo: 'entrevista',
          userId: user.id,
          extra: { etapa: 'stream_haiku', status: detalhes.status ?? 0 },
        })
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ erro: `Falha na IA: ${detalhes.mensagemCurta}` })}\n\n`
          )
        )
        controller.close()
        return
      }

      // Detectar se a resposta contém o JSON de encerramento
      const jsonStart = fullText.indexOf(JSON_FENCE_START)
      const jsonEnd = fullText.lastIndexOf(JSON_FENCE_END)

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = fullText
          .slice(jsonStart + JSON_FENCE_START.length, jsonEnd)
          .trim()

        try {
          const perfil = JSON.parse(jsonStr)

          // Salvar perfil_json no processo (filtra por user_id também:
          // defense-in-depth — evita escrever em processo alheio se RLS
          // for relaxada ou caller errar no client).
          await supabase
            .from('processos')
            .update({
              perfil_json: perfil,
              status: 'checklist',
              banco: perfil?.necessidade_credito?.banco_preferido || null,
              valor: perfil?.necessidade_credito?.valor || null,
            })
            .eq('id', processo_id)
            .eq('user_id', user.id)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, perfil_extraido: true })}\n\n`
            )
          )
        } catch (err) {
          capturarErroProducao(err, {
            modulo: 'entrevista',
            userId: user.id,
            extra: { etapa: 'parse_perfil_json', processoId: processo_id },
          })
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          )
        }
      } else {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        )
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Desabilita buffering em proxies (Vercel / Nginx) — essencial para SSE
      'X-Accel-Buffering': 'no',
    },
  })
}
