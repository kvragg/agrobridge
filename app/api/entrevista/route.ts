import { createClient } from '@/lib/supabase/server'
import { criarStreamEntrevista } from '@/lib/anthropic/haiku'
import type { MensagemChat } from '@/lib/anthropic/haiku'
import { NextRequest } from 'next/server'

// JSON de saída da entrevista: detectar quando o Haiku encerra e retornar o perfil
const JSON_FENCE_START = '```json'
const JSON_FENCE_END = '```'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Não autorizado', { status: 401 })
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

  // Verificar que o processo pertence ao usuário (RLS também garante, mas defence-in-depth)
  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', processo_id)
    .single()

  if (!processo) {
    return new Response('Processo não encontrado', { status: 404 })
  }

  // Streaming SSE
  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
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

      // Detectar se a resposta contém o JSON de encerramento
      const jsonStart = fullText.indexOf(JSON_FENCE_START)
      const jsonEnd = fullText.lastIndexOf(JSON_FENCE_END)

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = fullText
          .slice(jsonStart + JSON_FENCE_START.length, jsonEnd)
          .trim()

        try {
          const perfil = JSON.parse(jsonStr)

          // Salvar perfil_json no processo
          await supabase
            .from('processos')
            .update({
              perfil_json: perfil,
              status: 'checklist',
              banco: perfil?.necessidade_credito?.banco_preferido || null,
              valor: perfil?.necessidade_credito?.valor || null,
            })
            .eq('id', processo_id)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, perfil_extraido: true })}\n\n`
            )
          )
        } catch {
          // JSON malformado — não bloqueia o stream
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
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
