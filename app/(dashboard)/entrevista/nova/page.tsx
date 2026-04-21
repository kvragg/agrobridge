'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

type EstadoEntrevista =
  | 'criando_processo'
  | 'iniciando'
  | 'em_andamento'
  | 'concluindo'
  | 'erro'

export default function NovaEntrevistaPage() {
  const router = useRouter()
  const [processoId, setProcessoId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoEntrevista>('criando_processo')
  const [erroMsg, setErroMsg] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Rola para o final sempre que mensagens mudam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, streamingText])

  // Focar input quando não estiver carregando
  useEffect(() => {
    if (estado === 'em_andamento') {
      inputRef.current?.focus()
    }
  }, [estado])

  // Cria o processo e inicia a entrevista
  useEffect(() => {
    async function iniciar() {
      try {
        // 1. Criar processo
        const res = await fetch('/api/processos', { method: 'POST' })
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Sessão expirada. Faça login novamente.')
          }
          throw new Error('Não foi possível iniciar o processo. Tente novamente.')
        }
        const { id } = await res.json()
        setProcessoId(id)
        setEstado('iniciando')

        // 2. Iniciar conversa com uma mensagem de gatilho
        await enviarMensagem(id, [], 'Olá, quero iniciar meu processo de crédito rural.')
      } catch (err) {
        console.error('[entrevista] erro ao iniciar:', err)
        setEstado('erro')
        setErroMsg(
          err instanceof Error
            ? err.message
            : 'Não foi possível iniciar a entrevista. Tente novamente.'
        )
      }
    }
    iniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enviarMensagem = useCallback(
    async (pid: string, historico: Mensagem[], novaMensagem: string) => {
      const novoHistorico: Mensagem[] = [
        ...historico,
        { role: 'user', content: novaMensagem },
      ]
      setMensagens(novoHistorico)
      setEstado('em_andamento')
      setStreamingText('')

      try {
        const res = await fetch('/api/entrevista', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            processo_id: pid,
            messages: novoHistorico,
          }),
        })

        if (!res.ok) {
          const texto = await res.text().catch(() => '')
          console.error('[entrevista] API retornou', res.status, texto)
          throw new Error(mensagemErroPorStatus(res.status))
        }
        if (!res.body) throw new Error('O servidor não retornou uma resposta de streaming.')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        let perfilExtraido = false
        let erroStream: string | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                fullText += data.text
                setStreamingText(fullText)
              }
              if (data.erro) {
                erroStream = data.erro
              }
              if (data.done) {
                if (data.perfil_extraido) perfilExtraido = true
              }
            } catch {
              // linha incompleta, ignorar
            }
          }
        }

        if (erroStream) {
          throw new Error(erroStream)
        }

        // Limpar o texto que estava aparecendo como "streaming" do JSON
        const displayText = fullText
          .replace(/```json[\s\S]*?```/g, '')
          .trim()

        setMensagens((prev) => [
          ...prev,
          { role: 'assistant', content: displayText || fullText },
        ])
        setStreamingText('')

        if (perfilExtraido) {
          setEstado('concluindo')
          // Gerar checklist e redirecionar
          await gerarChecklistERedirecionar(pid)
        } else {
          setEstado('em_andamento')
        }
      } catch (err) {
        console.error('[entrevista] falha ao enviar mensagem:', err)
        setEstado('erro')
        setErroMsg(
          err instanceof Error && err.message
            ? err.message
            : 'Erro de conexão. Verifique sua internet e tente novamente.'
        )
      }
    },
    []
  )

  async function gerarChecklistERedirecionar(pid: string) {
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processo_id: pid }),
      })
      if (!res.ok) {
        const texto = await res.text().catch(() => '')
        console.error('[checklist] API retornou', res.status, texto)
      }
    } catch (err) {
      // Mesmo com erro, redireciona — a página de checklist tentará gerar de novo
      console.error('[checklist] falha ao chamar API:', err)
    }
    router.push(`/checklist/${pid}`)
  }

  function mensagemErroPorStatus(status: number): string {
    if (status === 401) return 'Sua sessão expirou. Entre de novo para continuar.'
    if (status === 413) return 'A conversa ficou longa demais. Recomece a entrevista — leva uns 10 minutos.'
    if (status === 429) return 'Muitas mensagens em pouco tempo. Espere um minuto e tente de novo.'
    if (status >= 500) return 'O servidor de IA tropeçou. Tente de novo em alguns minutos.'
    return 'Não deu pra processar sua mensagem. Tente de novo.'
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    const msg = texto.trim()
    if (!msg || estado !== 'em_andamento' || !processoId) return
    setTexto('')
    await enviarMensagem(processoId, mensagens, msg)
  }

  // ── Telas de estado ─────────────────────────────────────────────

  if (estado === 'criando_processo' || estado === 'iniciando') {
    return (
      <div className="flex h-[calc(100dvh-7rem)] items-center justify-center md:h-[calc(100dvh-4rem)]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <Loader2 className="h-7 w-7 animate-spin text-[#166534]" />
          </div>
          <p className="font-semibold text-gray-700">Preparando sua entrevista...</p>
          <p className="mt-1 text-sm text-gray-400">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  if (estado === 'erro') {
    return (
      <div className="flex h-[calc(100dvh-7rem)] items-center justify-center md:h-[calc(100dvh-4rem)]">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <p className="font-semibold text-gray-800">{erroMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'concluindo') {
    return (
      <div className="flex h-[calc(100dvh-7rem)] items-center justify-center md:h-[calc(100dvh-4rem)]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-[#16a34a]" />
          </div>
          <p className="font-semibold text-gray-700">Pronto. A IA já entendeu seu caso.</p>
          <p className="mt-1 text-sm text-gray-400">
            Montando o checklist exato de documentos do seu perfil...
          </p>
          <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-[#166534]" />
        </div>
      </div>
    )
  }

  // ── Chat UI ──────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-7rem)] w-full flex-col md:h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
          <Bot className="h-5 w-5 text-[#166534]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-900">Entrevista de Crédito</h1>
          <p className="text-xs text-gray-400">
            Responda as perguntas para gerar seu checklist personalizado
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#16a34a]" />
          <span className="text-xs font-medium text-[#166534]">Em andamento</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white px-3 py-4 md:p-4">
        <div className="space-y-4">
          {mensagens.map((m, i) => (
            <MensagemBubble key={i} mensagem={m} />
          ))}

          {/* Streaming */}
          {streamingText && (
            <MensagemBubble
              mensagem={{ role: 'assistant', content: streamingText }}
              streaming
            />
          )}

          {/* Typing indicator */}
          {!streamingText && estado === 'em_andamento' && mensagens.length > 0 && mensagens[mensagens.length - 1].role === 'user' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleEnviar}
        className="sticky bottom-0 mt-3 flex gap-2 bg-[#f8fafc]/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-sm"
      >
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite sua resposta..."
          disabled={estado !== 'em_andamento'}
          className="min-h-[44px] flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 disabled:opacity-50 sm:text-sm"
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!texto.trim() || estado !== 'em_andamento'}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#166534] text-white transition-colors hover:bg-[#14532d] disabled:opacity-40 sm:h-12 sm:w-12"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function MensagemBubble({
  mensagem,
  streaming,
}: {
  mensagem: Mensagem
  streaming?: boolean
}) {
  const isAssistant = mensagem.role === 'assistant'

  return (
    <div className={`flex w-full gap-2 md:gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#14532d]">
          <Bot className="h-4 w-4 text-[#86efac]" />
        </div>
      )}
      <div
        className={`min-w-0 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm leading-relaxed md:max-w-[70%] md:p-4 ${
          isAssistant
            ? 'rounded-tl-sm bg-gray-100 text-gray-800'
            : 'rounded-tr-sm bg-[#166534] text-white'
        } ${streaming ? 'opacity-80' : ''}`}
      >
        {mensagem.content}
        {streaming && (
          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current opacity-70" />
        )}
      </div>
    </div>
  )
}
