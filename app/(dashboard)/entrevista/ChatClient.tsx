"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { PlanoComercial } from "@/lib/plano"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
  Logo,
} from "@/components/landing/primitives"
import { Alert } from "@/components/shell/Alert"

interface Mensagem {
  role: "user" | "assistant"
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
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [perguntasUsadas, setPerguntasUsadas] = useState(props.perguntasUsadas)
  const [miniAnalise, setMiniAnalise] = useState<string | null>(
    props.miniAnalise,
  )
  const [gate, setGate] = useState(props.gateAtivo)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, streamingText])

  useEffect(() => {
    if (!enviando && !gate) inputRef.current?.focus()
  }, [enviando, gate])

  const enviar = useCallback(
    async (mensagemUser: string) => {
      setEnviando(true)
      setErro(null)
      setStreamingText("")
      setMensagens((m) => [...m, { role: "user", content: mensagemUser }])

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagem: mensagemUser }),
        })
        if (!res.ok) throw new Error(mensagemPorStatus(res.status))

        const ct = res.headers.get("content-type") ?? ""
        if (ct.includes("application/json")) {
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

        if (!res.body) throw new Error("Sem corpo de streaming na resposta.")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ""
        let erroStream: string | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
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

        setMensagens((m) => [...m, { role: "assistant", content: full }])
        setStreamingText("")

        if (props.isFree) {
          setPerguntasUsadas((p) => {
            const novo = p + 1
            if (novo >= props.limite) setGate(true)
            return novo
          })
        }
      } catch (e) {
        console.error("[chat] erro:", e)
        setErro(e instanceof Error ? e.message : "Erro inesperado.")
      } finally {
        setEnviando(false)
      }
    },
    [props.isFree, props.limite],
  )

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    const msg = texto.trim()
    if (!msg || enviando || gate) return
    setTexto("")
    await enviar(msg)
  }

  const primeiraMsg = mensagens.length === 0 && !streamingText
  const mostraContador = props.isFree && !gate

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: "calc(100dvh - 180px)",
      }}
    >
      <HeaderChat
        plano={props.plano}
        perguntasUsadas={perguntasUsadas}
        limite={props.limite}
        mostraContador={mostraContador}
      />

      <GlassCard
        glow="green"
        padding={0}
        hover={false}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 480 }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxHeight: "58vh",
          }}
        >
          {primeiraMsg && (
            <BoasVindas
              onSugestao={(s) => {
                setTexto(s)
                inputRef.current?.focus()
              }}
            />
          )}

          {mensagens.map((m, i) => (
            <Bubble key={i} mensagem={m} />
          ))}

          {streamingText && (
            <Bubble
              mensagem={{ role: "assistant", content: streamingText }}
              streaming
            />
          )}

          {enviando &&
            !streamingText &&
            mensagens.length > 0 &&
            mensagens[mensagens.length - 1].role === "user" && <TypingDots />}

          {gate && <PaywallCard miniAnalise={miniAnalise} />}

          {erro && <Alert variant="error">{erro}</Alert>}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleEnviar}
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 18px",
            background: "rgba(0,0,0,0.25)",
            borderTop: "1px solid var(--line)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              gate
                ? "Escolha um plano pra continuar"
                : "Digite sua resposta…"
            }
            disabled={enviando || gate}
            style={{
              flex: 1,
              height: 48,
              padding: "0 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              color: "var(--ink)",
              fontSize: 14.5,
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color .2s, box-shadow .2s",
              opacity: gate ? 0.5 : 1,
            }}
            onFocus={(e) => {
              if (gate) return
              e.currentTarget.style.borderColor = "var(--green)"
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(78,168,132,0.15)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--line-2)"
              e.currentTarget.style.boxShadow = "none"
            }}
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={!texto.trim() || enviando || gate}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: gate
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(180deg,#5cbd95,#2f7a5c)",
              color: gate ? "var(--muted)" : "#07120d",
              border: gate ? "1px solid var(--line-2)" : "1px solid transparent",
              cursor: gate || !texto.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: gate
                ? "none"
                : "0 10px 30px -8px rgba(78,168,132,0.5)",
              opacity: !texto.trim() || enviando ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {gate ? Icon.lock(16) : Icon.arrow(16)}
          </button>
        </form>
      </GlassCard>
    </div>
  )
}

function HeaderChat({
  plano,
  perguntasUsadas,
  limite,
  mostraContador,
}: {
  plano: PlanoComercial
  perguntasUsadas: number
  limite: number
  mostraContador: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#07120d",
          boxShadow: "0 0 18px rgba(78,168,132,0.4)",
          flexShrink: 0,
        }}
      >
        <Logo size={20} color="#07120d" accent="#07120d" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.018em",
            color: "var(--ink)",
          }}
        >
          IA AgroBridge
        </h1>
        <p
          className="mono"
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Consultoria sênior em crédito rural · plano {plano}
        </p>
      </div>
      {mostraContador && (
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 999,
            background: "rgba(201,168,106,0.10)",
            border: "1px solid rgba(201,168,106,0.28)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--gold)",
              boxShadow: "0 0 8px var(--gold)",
            }}
          />
          {perguntasUsadas}/{limite} perguntas grátis
        </div>
      )}
    </div>
  )
}

function BoasVindas({ onSugestao }: { onSugestao: (s: string) => void }) {
  const sugestoes = [
    "Quero custeio pra plantar soja na minha fazenda",
    "Tenho 300 ha de pasto e quero investir em confinamento",
    "Preciso refinanciar um crédito que já tomei",
  ]
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 14,
        background: "rgba(78,168,132,0.05)",
        border: "1px dashed rgba(78,168,132,0.28)",
      }}
    >
      <Eyebrow>Comece como quiser</Eyebrow>
      <p
        style={{
          margin: "12px 0 14px",
          fontSize: 14.5,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        Me conta sua situação. A IA mapeia o perfil, sugere a linha e monta o
        checklist certo.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {sugestoes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSugestao(s)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              color: "var(--ink-2)",
              fontSize: 12.5,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(78,168,132,0.35)"
              e.currentTarget.style.color = "var(--ink)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--line-2)"
              e.currentTarget.style.color = "var(--ink-2)"
            }}
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
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background:
          "linear-gradient(180deg, rgba(78,168,132,0.10) 0%, rgba(201,168,106,0.06) 100%)",
        border: "1px solid rgba(78,168,132,0.28)",
        marginTop: 6,
      }}
    >
      <Eyebrow>Sua análise gratuita</Eyebrow>
      {miniAnalise ? (
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--ink-2)",
            margin: "14px 0 0",
          }}
        >
          {miniAnalise}
        </div>
      ) : (
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 14,
            color: "var(--muted)",
            lineHeight: 1.6,
          }}
        >
          A IA está preparando sua análise agora. Atualize a página em alguns
          segundos.
        </p>
      )}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button variant="accent" size="md" href="/planos">
          Ver planos e continuar {Icon.arrow(14)}
        </Button>
        <p
          style={{
            margin: 0,
            flex: 1,
            minWidth: 200,
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.55,
          }}
        >
          Pra IA redigir a defesa técnica, montar o roteiro de comitê e
          finalizar o dossiê, escolha um plano. Você mantém a conversa e tudo
          que já contamos.
        </p>
      </div>
    </div>
  )
}

function Bubble({
  mensagem,
  streaming,
}: {
  mensagem: Mensagem
  streaming?: boolean
}) {
  const isAssistant = mensagem.role === "assistant"
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: isAssistant ? "flex-start" : "flex-end",
      }}
    >
      {isAssistant && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={14} color="#07120d" accent="#07120d" />
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isAssistant ? "6px 14px 14px 14px" : "14px 6px 14px 14px",
          background: isAssistant
            ? "rgba(255,255,255,0.04)"
            : "rgba(78,168,132,0.14)",
          border:
            "1px solid " +
            (isAssistant ? "var(--line)" : "rgba(78,168,132,0.3)"),
          color: isAssistant ? "var(--ink)" : "#eaf7f0",
          fontSize: 14,
          lineHeight: 1.55,
          letterSpacing: "-0.003em",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          opacity: streaming ? 0.85 : 1,
        }}
      >
        {mensagem.content}
        {streaming && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 14,
              background: "currentColor",
              marginLeft: 4,
              opacity: 0.6,
              animation: "landing-blink 1s infinite",
            }}
          />
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo size={14} color="#07120d" accent="#07120d" />
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          padding: "10px 14px",
          borderRadius: "6px 14px 14px 14px",
          display: "flex",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--muted)",
              animation: `landing-blink 1.2s ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function mensagemPorStatus(status: number): string {
  if (status === 401) return "Sua sessão expirou. Faça login de novo."
  if (status === 413) return "Sua mensagem ficou longa demais."
  if (status === 429) return "Muitas mensagens em pouco tempo. Espere um minuto."
  if (status >= 500) return "A IA tropeçou. Tente em alguns segundos."
  return "Não deu pra processar. Tente de novo."
}
