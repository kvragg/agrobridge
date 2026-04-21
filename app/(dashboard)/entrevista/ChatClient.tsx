'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Bot, Send, AlertCircle, Sparkles, Lock } from 'lucide-react'
import type { PlanoComercial } from '@/lib/plano'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  plano: PlanoComercial
  isFree: boolean
  perguntasUsadas: number
  limite: number
  historicoInicial: Mensagem[]
  miniAnalise: string | null
  gateAtivo: boolean
}

export function ChatClient(props: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(props.historicoInicial)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [perguntasUsadas, setPerguntasUsadas] = useState(props.perguntasUsadas)
  const [miniAnalise, setMiniAnalise] = useState<string | null>(props.miniAnalise)
  const [gate, setGate] = useState(props.gateAtivo)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, streamingText])

  useEffect(() => {
    if (!enviando && !gate) inputRef.current?.focus()
  }, [enviando, gate])

  const enviar = useCallback(async (mensagemUser: string) => {
    setEnviando(true)
    setErro(null)
    setStreamingText('')
    setMensagens((m) => [...m, { role: 'user', content: mensagemUser }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: mensagemUser }),
      })
      if (!res.ok) throw new Error(mensagemPorStatus(res.status))

      // Caso paywall imediato (free com limite ja atingido): resposta JSON
      const ct = res.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        const data = (await res.json()) as {
          trigger_paywall?: boolean
          mini_analise?: string | null
        }
        if (data.trigger_paywall) {
          if (data.mini_analise) setMiniAnalise(data.mini_analise)
          setGate(true)
          setEnviando(false)
          return
        }
      }

      if (!res.body) throw new Error('Sem corpo de streaming na resposta.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let erroStream: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              full += data.text
              setStreamingText(full)
            }
            if (data.erro) erroStream = data.erro
          } catch {
            /* ignore */
          }
        }
      }

      if (erroStream) throw new Error(erroStream)

      setMensagens((m) => [...m, { role: 'assistant', content: full }])
      setStreamingText('')

      if (props.isFree) {
        setPerguntasUsadas((p) => {
          const novo = p + 1
          if (novo >= props.limite) setGate(true)
          return novo
        })
      }
    } catch (e) {
      console.error('[chat] erro:', e)
      setErro(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally {
      setEnviando(false)
    }
  }, [props.isFree, props.limite])

  // Se gate esta ativo e ainda nao temos mini-analise carregada, busca-a
  // mandando mensagem vazia? Nao — o endpoint gera no stream. Aqui confiamos
  // que o componente server carregou miniAnalise na primeira render ou
  // que o proximo envio dispara o json de paywall.
  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    const msg = texto.trim()
    if (!msg || enviando || gate) return
    setTexto('')
    await enviar(msg)
  }

  const primeiraMsg = mensagens.length === 0 && !streamingText
  const mostraContador = props.isFree && !gate

  return (
    <div className="flex h-[calc(100dvh-7rem)] w-full flex-col md:h-[calc(100dvh-4rem)]">
      <HeaderChat
        plano={props.plano}
        perguntasUsadas={perguntasUsadas}
        limite={props.limite}
        mostraContador={mostraContador}
      />

      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white px-3 py-4 md:p-4">
        <div className="space-y-4">
          {primeiraMsg && <BoasVindas onSugestao={(s) => { setTexto(s); inputRef.current?.focus() }} />}

          {mensagens.map((m, i) => (
            <Bubble key={i} mensagem={m} />
          ))}

          {streamingText && <Bubble mensagem={{ role: 'assistant', content: streamingText }} streaming />}

          {enviando && !streamingText && mensagens.length > 0 && mensagens[mensagens.length - 1].role === 'user' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {gate && <PaywallCard miniAnalise={miniAnalise} />}

          {erro && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{erro}</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleEnviar}
        className="sticky bottom-0 mt-3 flex gap-2 bg-[#f8fafc]/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-sm"
      >
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={gate ? 'Escolha um plano para continuar' : 'Digite sua resposta...'}
          disabled={enviando || gate}
          className="min-h-[44px] flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70 sm:text-sm"
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!texto.trim() || enviando || gate}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#166534] text-white transition-colors hover:bg-[#14532d] disabled:opacity-40 sm:h-12 sm:w-12"
        >
          {gate ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}

function HeaderChat({ plano, perguntasUsadas, limite, mostraContador }: {
  plano: PlanoComercial
  perguntasUsadas: number
  limite: number
  mostraContador: boolean
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
        <Bot className="h-5 w-5 text-[#166534]" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-gray-900">IA AgroBridge</h1>
        <p className="text-xs text-gray-400">Consultora especializada em crédito rural — plano atual: {plano}</p>
      </div>
      {mostraContador && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Sparkles className="h-3 w-3" />
          {perguntasUsadas}/{limite} perguntas grátis
        </div>
      )}
    </div>
  )
}

function BoasVindas({ onSugestao }: { onSugestao: (s: string) => void }) {
  const sugestoes = [
    'Quero custeio pra plantar soja na minha fazenda',
    'Tenho 300 ha de pasto e quero investir em confinamento',
    'Preciso refinanciar um crédito que já tomei',
  ]
  return (
    <div className="rounded-2xl border border-dashed border-[#166534]/30 bg-green-50/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Bot className="h-5 w-5 text-[#166534]" />
        <p className="font-bold text-gray-800">Comece como quiser</p>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Me conta sua situação. Eu mapeio o perfil, sugiro a linha e monto o checklist certo.
      </p>
      <div className="flex flex-wrap gap-2">
        {sugestoes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSugestao(s)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-[#166534] hover:text-[#166534]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function PaywallCard({ miniAnalise }: { miniAnalise: string | null }) {
  return (
    <div className="rounded-2xl border border-[#166534]/20 bg-gradient-to-br from-green-50 to-white p-5 md:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#166534]" />
        <h2 className="text-base font-bold text-gray-900">Sua análise gratuita</h2>
      </div>

      {miniAnalise ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {miniAnalise}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Estou preparando sua análise agora. Atualize a página em alguns segundos.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/planos"
          className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Ver planos e continuar
        </Link>
        <p className="flex-1 text-xs text-gray-500">
          Pra eu redigir a defesa técnica, montar o roteiro de comitê e finalizar o dossiê,
          escolha um plano. Você mantém a conversa e tudo que já contamos.
        </p>
      </div>
    </div>
  )
}

function Bubble({ mensagem, streaming }: { mensagem: Mensagem; streaming?: boolean }) {
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
          isAssistant ? 'rounded-tl-sm bg-gray-100 text-gray-800' : 'rounded-tr-sm bg-[#166534] text-white'
        } ${streaming ? 'opacity-80' : ''}`}
      >
        {mensagem.content}
        {streaming && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current opacity-70" />}
      </div>
    </div>
  )
}

function mensagemPorStatus(status: number): string {
  if (status === 401) return 'Sua sessão expirou. Faça login de novo.'
  if (status === 413) return 'Sua mensagem ficou longa demais.'
  if (status === 429) return 'Muitas mensagens em pouco tempo. Espere um minuto.'
  if (status >= 500) return 'A IA tropeçou. Tente em alguns segundos.'
  return 'Não deu pra processar. Tente de novo.'
}
