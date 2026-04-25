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
import { BotaoConcluirEntrevista } from "@/components/entrevista/BotaoConcluirEntrevista"
import { useRouter } from "next/navigation"
import { deveAutoConcluir } from "@/lib/entrevista/detectar-fim"

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
  const router = useRouter()
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
  const [carregandoAnalise, setCarregandoAnalise] = useState(false)
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)
  const [autoConcluindo, setAutoConcluindo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Busca a mini-análise sob demanda. Garante que nunca fica exibido
  // o fallback genérico "atualize a página": UX trabalha só com
  // loading (com estágios reais) ou erro (com retry claro).
  const buscarMiniAnalise = useCallback(async () => {
    setErroAnalise(null)
    setCarregandoAnalise(true)
    try {
      const res = await fetch("/api/chat/mini-analise", { cache: "no-store" })
      const data = (await res.json().catch(() => ({}))) as {
        pronta?: boolean
        texto?: string | null
        motivo?: string
        detalhe?: string
      }
      if (!res.ok || !data.pronta || !data.texto) {
        throw new Error(
          data.detalhe ||
            "A IA está com alta demanda agora. Tenta de novo em alguns segundos.",
        )
      }
      setMiniAnalise(data.texto)
    } catch (e) {
      setErroAnalise(
        e instanceof Error
          ? e.message
          : "Não consegui montar sua análise agora. Tenta de novo.",
      )
    } finally {
      setCarregandoAnalise(false)
    }
  }, [])

  // Dispara automaticamente quando o gate vira ativo e ainda não temos
  // o texto. Não dispara se já houver erro (evita loop — user faz retry
  // manual via botão).
  useEffect(() => {
    if (!gate) return
    if (miniAnalise) return
    if (carregandoAnalise) return
    if (erroAnalise) return
    void buscarMiniAnalise()
  }, [gate, miniAnalise, carregandoAnalise, erroAnalise, buscarMiniAnalise])

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

        // Auto-concluir entrevista por intent — se user pediu "concluir/
        // checklist/rever tudo" OU IA respondeu com "podemos concluir/perfil
        // completo", dispara /api/entrevista/concluir e redireciona. Sem
        // precisar clicar no botão. Backend protege via leadTemPerfilMinimo.
        // Não roda em gate freemium (lá tem CTA de planos próprio).
        if (!props.isFree && deveAutoConcluir(mensagemUser, full)) {
          setAutoConcluindo(true)
          try {
            const res = await fetch("/api/entrevista/concluir", {
              method: "POST",
            })
            const data = (await res.json().catch(() => ({}))) as {
              ok?: boolean
              redirect_para?: string
              erro?: string
            }
            if (res.ok && data.redirect_para) {
              router.push(data.redirect_para)
              router.refresh()
              return
            }
            // 422 perfil insuficiente ou outro erro: cancela auto e mostra
            // mensagem amigável (botão manual continua disponível pra retry).
            setAutoConcluindo(false)
            if (data?.erro) setErro(data.erro)
          } catch {
            setAutoConcluindo(false)
            setErro(
              "Não consegui concluir agora. Tente clicar no botão dourado acima.",
            )
          }
        }
      } catch (e) {
        console.error("[chat] erro:", e)
        setErro(e instanceof Error ? e.message : "Erro inesperado.")
      } finally {
        setEnviando(false)
      }
    },
    [props.isFree, props.limite, router],
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

      {/* Overlay visível quando auto-conclusão dispara — bloqueia
          interação enquanto monta processo + redireciona pro checklist. */}
      {autoConcluindo && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(7,8,9,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: 32,
          }}
        >
          <div style={{ color: "var(--gold)" }}>{Icon.spinner(40)}</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
              textAlign: "center",
            }}
          >
            Concluindo entrevista — montando seu checklist…
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              maxWidth: 360,
              lineHeight: 1.55,
              textAlign: "center",
            }}
          >
            Salvando seu perfil completo e gerando a lista personalizada de
            documentos. Isso leva uns segundos.
          </div>
        </div>
      )}

      {/* Botão "Concluir entrevista" — visível desde a 2ª mensagem
          (1 user + 1 assistant). Threshold baixo intencional: melhor
          mostrar cedo demais que esconder. Backend valida perfil
          mínimo via /api/entrevista/concluir → 422 amigável se falta.
          Não aparece em gate freemium (lá já tem CTA de planos). */}
      {mensagens.length >= 2 && !gate && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            padding: "10px 14px",
            background: "rgba(201,168,106,0.06)",
            border: "1px solid rgba(201,168,106,0.22)",
            borderRadius: 12,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              maxWidth: 360,
              lineHeight: 1.5,
              textAlign: "right",
            }}
          >
            Já tem o suficiente? Concluo a entrevista e te mostro o checklist personalizado.
          </span>
          <BotaoConcluirEntrevista variante="default" />
        </div>
      )}

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

          {gate && (
            <PaywallCard
              miniAnalise={miniAnalise}
              carregando={carregandoAnalise}
              erro={erroAnalise}
              onRetry={buscarMiniAnalise}
            />
          )}

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

function PaywallCard({
  miniAnalise,
  carregando,
  erro,
  onRetry,
}: {
  miniAnalise: string | null
  carregando: boolean
  erro: string | null
  onRetry: () => void
}) {
  const mostrarCTAPlanos = Boolean(miniAnalise) && !carregando && !erro
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(78,168,132,0.12) 0%, rgba(201,168,106,0.08) 100%)",
        border: "1px solid rgba(201,168,106,0.35)",
        boxShadow:
          "0 20px 60px -20px rgba(78,168,132,0.25), 0 0 0 1px rgba(201,168,106,0.12) inset",
        marginTop: 6,
      }}
    >
      <Eyebrow color="var(--gold)" dot="var(--gold)">
        Sua análise estratégica
      </Eyebrow>

      {miniAnalise ? (
        <AnaliseRenderizada texto={miniAnalise} />
      ) : erro ? (
        <AnaliseErro mensagem={erro} onRetry={onRetry} />
      ) : (
        <AnaliseLoading />
      )}

      {mostrarCTAPlanos && (
        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.08)",
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
              minWidth: 220,
              fontSize: 12.5,
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            Pra eu redigir a defesa técnica, montar o roteiro de comitê e
            cuidar dos pontos sensíveis do seu caso, escolha um plano. Você
            mantém a conversa e tudo que já contamos.
          </p>
        </div>
      )}
    </div>
  )
}

function AnaliseRenderizada({ texto }: { texto: string }) {
  // Renderiza **bold** e preserva parágrafos. Suficiente pra mini-análise —
  // não importa lib pesada.
  const partes = texto.split(/\n\n+/)
  return (
    <div
      style={{
        marginTop: 14,
        fontSize: 14.5,
        lineHeight: 1.7,
        color: "var(--ink)",
        letterSpacing: "-0.003em",
      }}
    >
      {partes.map((p, i) => (
        <p
          key={i}
          style={{
            margin: i === 0 ? "0 0 14px" : "14px 0",
            whiteSpace: "pre-wrap",
          }}
          dangerouslySetInnerHTML={{ __html: formatarBold(p) }}
        />
      ))}
    </div>
  )
}

function formatarBold(texto: string): string {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
  return escapado.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong style="color:var(--ink);font-weight:500">$1</strong>',
  )
}

function AnaliseLoading() {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(78,168,132,0.12)",
          border: "1px solid rgba(78,168,132,0.3)",
          color: "var(--green)",
          fontSize: 11.5,
          fontFamily: "var(--font-mono, ui-monospace)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--green)",
            boxShadow: "0 0 8px var(--green)",
            animation: "landing-blink 1s infinite",
          }}
        />
        IA montando sua análise
      </div>
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 10,
        }}
      >
        {[88, 72, 84, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 10,
              width: `${w}%`,
              borderRadius: 6,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(78,168,132,0.18) 50%, rgba(255,255,255,0.04) 100%)",
              backgroundSize: "200% 100%",
              animation: "skeleton-shimmer 1.8s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          marginTop: 16,
          fontSize: 12.5,
          color: "var(--muted)",
          lineHeight: 1.55,
        }}
      >
        Estou cruzando seu perfil com a tabela MCR 2026, o comportamento
        típico do credor e os pontos que mais sobem sua probabilidade. Levo
        até uns 20 segundos.
      </p>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

function AnaliseErro({
  mensagem,
  onRetry,
}: {
  mensagem: string
  onRetry: () => void
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: "rgba(212,113,88,0.08)",
          border: "1px solid rgba(212,113,88,0.3)",
          color: "var(--ink)",
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        {mensagem}
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="accent" size="sm" onClick={onRetry}>
          Tentar de novo {Icon.arrow(12)}
        </Button>
        <Button variant="ghost" size="sm" href="/planos">
          Ver planos mesmo assim
        </Button>
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
