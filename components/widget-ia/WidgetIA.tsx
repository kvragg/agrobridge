"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import {
  Button,
  Icon,
  Logo,
} from "@/components/landing/primitives"
import { useWidgetIA } from "./WidgetIAProvider"

export type WidgetIATier = "free" | "Bronze" | "Prata" | "Ouro"

type Mensagem = { role: "user" | "assistant"; content: string }

// sessionStorage: persiste a thread enquanto a aba está aberta. Sobrevive a
// minimizar/maximizar e a navegação entre rotas. Limpa ao fechar a aba (intencional).
const THREAD_KEY = "widget_ia_thread_v1"
const UNREAD_KEY = "widget_ia_unread_v1"

function readThread(): Mensagem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(THREAD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Mensagem[]
    return Array.isArray(parsed) ? parsed.slice(-100) : []
  } catch {
    return []
  }
}

function writeThread(msgs: Mensagem[]): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(THREAD_KEY, JSON.stringify(msgs.slice(-100)))
  } catch {
    /* ignore quota */
  }
}

function readUnread(): number {
  if (typeof window === "undefined") return 0
  try {
    return Number(sessionStorage.getItem(UNREAD_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}

function writeUnread(n: number): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(UNREAD_KEY, String(n))
  } catch {
    /* ignore */
  }
}

interface WidgetIAProps {
  /** Tier comercial do usuário — controla gating e rate-limit. */
  tier: WidgetIATier
  /** Nome curto pra saudação contextual. */
  nomeCurto?: string
  /** true pra esconder o widget (ex: rotas onde já existe chat da tela). */
  hidden?: boolean
}

const PANEL_WIDTH = 420
const PANEL_HEIGHT = 640

/**
 * Chat flutuante da IA AgroBridge. FAB no canto inferior direito
 * (oposto ao menu esquerdo). Desktop: panel 420x640. Mobile: fullscreen.
 *
 * Fluxo:
 *   - FAB visível em todas as telas autenticadas que montarem este
 *     componente, exceto as que passarem `hidden`.
 *   - Free: clique no FAB abre modal de upgrade ("Disponível a partir
 *     do plano Bronze").
 *   - Bronze+: clique abre o chat. Mensagens via `/api/chat` (mesmo
 *     endpoint da tela dedicada /entrevista — histórico sincronizado).
 *   - Upload via anexo 📎 (Fase A-2 — vai vir no próximo commit).
 */
export function WidgetIA({ tier, nomeCurto, hidden = false }: WidgetIAProps) {
  const widget = useWidgetIA()
  const [showUpgrade, setShowUpgrade] = useState(false)
  // Lazy init lê sessionStorage só no client (no SSR retorna 0). Reset
  // on-open via callback explícito, NÃO em useEffect — React 19 strict
  // proíbe setState em effect (cascading renders).
  const [unread, setUnread] = useState<number>(() => readUnread())

  if (hidden) return null

  const isFree = tier === "free"

  function zerarUnread() {
    setUnread(0)
    writeUnread(0)
  }

  function handleFabClick() {
    if (isFree) {
      setShowUpgrade(true)
      return
    }
    if (widget.state === "open") {
      widget.close()
    } else {
      zerarUnread()
      widget.open()
    }
  }

  // Estado MINIMIZED: pílula horizontal compacta no canto inf-direito,
  // mostrando logo + texto + contador de não-lidas (se houver). Clique
  // restaura o painel sem perder a thread (sessionStorage).
  if (widget.state === "minimized" && !isFree) {
    return (
      <>
        <button
          type="button"
          aria-label={
            unread > 0
              ? `Restaurar chat IA — ${unread} mensagem${unread === 1 ? "" : "s"} não lida${unread === 1 ? "" : "s"}`
              : "Restaurar chat IA"
          }
          onClick={() => {
            zerarUnread()
            widget.open()
          }}
          className="widget-ia-pill"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 70,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px 10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(78,168,132,0.32)",
            background:
              "linear-gradient(180deg, rgba(22,26,30,0.96) 0%, rgba(12,15,18,0.98) 100%)",
            color: "var(--ink)",
            cursor: "pointer",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05) inset," +
              "0 10px 30px -8px rgba(0,0,0,0.7)," +
              "0 0 0 3px rgba(78,168,132,0.12)",
            backdropFilter: "blur(12px)",
            transition: "transform .2s, box-shadow .2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none"
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Logo size={14} color="#07120d" accent="#07120d" />
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              color: "var(--ink)",
            }}
          >
            IA AgroBridge
          </span>
          {unread > 0 && (
            <span
              aria-label={`${unread} não lidas`}
              style={{
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 999,
                background: "var(--gold)",
                color: "#1a140a",
                fontSize: 11,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 2,
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </>
    )
  }

  return (
    <>
      {/* FAB fixo bottom-right (estado closed) */}
      <button
        type="button"
        aria-label={widget.state === "open" ? "Fechar chat IA" : "Abrir chat IA"}
        onClick={handleFabClick}
        className="widget-ia-fab"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 70,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.15)",
          background: isFree
            ? "linear-gradient(180deg, rgba(50,55,60,0.92), rgba(30,34,38,0.95))"
            : "linear-gradient(180deg,#5cbd95 0%,#2f7a5c 100%)",
          color: isFree ? "var(--muted)" : "#07120d",
          cursor: "pointer",
          display: widget.state === "open" ? "none" : "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isFree
            ? "0 10px 30px -8px rgba(0,0,0,0.6)"
            : "0 0 0 1px rgba(255,255,255,0.15) inset," +
              "0 10px 30px -8px rgba(78,168,132,0.55)," +
              "0 0 0 3px rgba(78,168,132,0.12)",
          transition: "transform .2s, box-shadow .2s",
        }}
      >
        {isFree ? Icon.lock(22) : <Logo size={24} color="#07120d" accent="#07120d" />}
        {(widget.pulsing || unread > 0) && !isFree && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "var(--gold)",
              color: "#1a140a",
              fontSize: 10,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #07120d",
            }}
          >
            {unread > 0 ? (unread > 9 ? "9+" : unread) : "•"}
          </span>
        )}
        {widget.pulsing && unread === 0 && !isFree && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: "2px solid rgba(78,168,132,0.7)",
              animation: "widget-ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </button>

      {/* Panel aberto */}
      {widget.state === "open" && !isFree && (
        <ChatPanel tier={tier} nomeCurto={nomeCurto} />
      )}

      {/* Modal upgrade (Free) */}
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} />
      )}

      <style>{`
        @keyframes widget-ping {
          0%   { transform: scale(1);   opacity: 0.8; }
          80%  { transform: scale(1.6); opacity: 0;   }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </>
  )
}

// ─── Panel aberto ─────────────────────────────────────────────────

function ChatPanel({
  tier,
  nomeCurto,
}: {
  tier: WidgetIATier
  nomeCurto?: string
}) {
  const widget = useWidgetIA()
  // Hidrata mensagens do sessionStorage primeiro — sobrevive a
  // minimizar/restaurar e a navegação entre rotas (mesma aba).
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => readThread())
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [historicoCarregado, setHistoricoCarregado] = useState(
    () => readThread().length > 0,
  )
  const [enviandoAnexo, setEnviandoAnexo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Consome notificação proativa ao abrir o panel — guarda localmente
  // pra renderizar no header da thread (acima da saudação) e marca
  // como consumida no provider.
  const [notif, setNotif] = useState<typeof widget.notificacaoPendente>(null)
  useEffect(() => {
    if (widget.notificacaoPendente) {
      setNotif(widget.notificacaoPendente)
      widget.consumirNotificacao()
    }
    // só roda no mount; notificação de novas simulações precisa de
    // novo open do panel pra aparecer (UX intencional)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carrega histórico ao abrir — apenas se sessionStorage estava vazio.
  // Quando user já tem thread em memória (sessionStorage), confiamos nela
  // pra evitar piscar / sobrescrever streaming em curso.
  useEffect(() => {
    if (historicoCarregado) return
    ;(async () => {
      try {
        const res = await fetch("/api/widget-ia/historico", {
          cache: "no-store",
        })
        if (res.ok) {
          const data = (await res.json()) as { mensagens: Mensagem[] }
          const msgs = data.mensagens ?? []
          setMensagens(msgs)
          writeThread(msgs)
        }
      } catch {
        /* silencioso — começa vazio */
      } finally {
        setHistoricoCarregado(true)
      }
    })()
  }, [historicoCarregado])

  // Persiste em sessionStorage sempre que mensagens mudam
  useEffect(() => {
    if (mensagens.length > 0) writeThread(mensagens)
  }, [mensagens])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, streamingText])

  useEffect(() => {
    if (!enviando) inputRef.current?.focus()
  }, [enviando])

  async function enviar(mensagemUser: string) {
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

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        setErro(
          data?.erro ??
            `Você atingiu o limite de mensagens nesta hora no plano ${tier}. Aguarde ou faça upgrade.`,
        )
        return
      }

      if (!res.ok) {
        throw new Error(`status ${res.status}`)
      }

      const ct = res.headers.get("content-type") ?? ""
      if (ct.includes("application/json")) {
        const data = await res.json()
        if (data.trigger_paywall) {
          setErro(
            "Sua análise gratuita está pronta. Pra continuar, veja os planos.",
          )
          return
        }
      }

      if (!res.body) throw new Error("Sem corpo de streaming.")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

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
            if (data.erro) throw new Error(data.erro)
          } catch {
            /* ignore parse */
          }
        }
      }

      setMensagens((m) => [...m, { role: "assistant", content: full }])
      setStreamingText("")
    } catch (e) {
      console.error("[widget-ia] erro:", e)
      setErro(e instanceof Error ? e.message : "Erro inesperado.")
    } finally {
      setEnviando(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = texto.trim()
    if (!msg || enviando) return
    setTexto("")
    await enviar(msg)
  }

  async function handleAnexo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || enviandoAnexo) return
    e.target.value = "" // permite re-anexar o mesmo arquivo

    const MAX_MB = 100
    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`Arquivo maior que ${MAX_MB}MB.`)
      return
    }

    setEnviandoAnexo(true)
    setErro(null)

    // Indicador visual no chat
    setMensagens((m) => [
      ...m,
      {
        role: "user",
        content: `📎 Enviando: ${file.name} (${Math.round(file.size / 1024)} KB)…`,
      },
    ])

    try {
      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/widget-ia/upload", {
        method: "POST",
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        mensagem_ia?: string
        erro?: string
        codigo?: string
      }

      if (!res.ok) {
        const msgErro = data.erro ?? "Falha ao enviar o anexo."
        setMensagens((m) => [
          ...m,
          {
            role: "assistant",
            content: `⚠️ ${msgErro}`,
          },
        ])
        setErro(null)
        return
      }

      if (data.mensagem_ia) {
        setMensagens((m) => [
          ...m,
          { role: "assistant", content: data.mensagem_ia! },
        ])
      }
    } catch (err) {
      console.error("[widget-ia] upload falhou:", err)
      setMensagens((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ Não consegui receber o arquivo. Tente de novo ou use a tela de Checklist.",
        },
      ])
    } finally {
      setEnviandoAnexo(false)
    }
  }

  const saudacao = mensagens.length === 0 && !streamingText
  const painelStyles = painelBaseStyles()

  return (
    <>
      {/* Backdrop só no mobile — clique minimiza (preserva thread) em vez de fechar */}
      <div className="widget-ia-backdrop" onClick={widget.minimize} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Chat com a IA AgroBridge"
        className="widget-ia-panel"
        style={painelStyles}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Logo size={18} color="#07120d" accent="#07120d" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              IA AgroBridge
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--green)",
                  boxShadow: "0 0 8px var(--green)",
                }}
              />
              online · plano {tier}
            </div>
          </div>
          <Link
            href="/entrevista"
            aria-label="Abrir em tela cheia"
            style={{
              color: "var(--muted)",
              padding: 6,
              borderRadius: 6,
              display: "inline-flex",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted)")
            }
          >
            {Icon.arrow(14)}
          </Link>
          <button
            type="button"
            aria-label="Minimizar"
            title="Minimizar (mantém a conversa)"
            onClick={widget.minimize}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              display: "inline-flex",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted)")
            }
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Fechar"
            title="Fechar (limpa a aba ao recarregar)"
            onClick={widget.close}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted)")
            }
          >
            {Icon.x(14)}
          </button>
        </div>

        {/* Thread */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 18px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Notificação proativa — simulação salva. Aparece SEMPRE
              que o panel abre com notificação pendente, mesmo se já
              tem histórico. */}
          {notif && notif.tipo === "simulacao_salva" && (
            <NotifSimulacao notif={notif} nomeCurto={nomeCurto} />
          )}

          {saudacao && historicoCarregado && !notif && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "rgba(78,168,132,0.08)",
                border: "1px solid rgba(78,168,132,0.25)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--green)",
                  marginBottom: 8,
                }}
              >
                IA AgroBridge · online
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--ink)",
                }}
              >
                {nomeCurto ? `Oi, ${nomeCurto}. ` : "Oi. "}Estou aqui pra te
                ajudar com a documentação do seu crédito rural. Pode me contar
                onde você tá no processo?
              </div>
            </div>
          )}

          {mensagens.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
          {streamingText && (
            <Bubble msg={{ role: "assistant", content: streamingText }} streaming />
          )}

          {enviando &&
            !streamingText &&
            mensagens.length > 0 &&
            mensagens[mensagens.length - 1].role === "user" && <TypingDots />}

          {erro && (
            <div
              style={{
                fontSize: 13,
                color: "var(--danger)",
                background: "rgba(212,113,88,0.08)",
                border: "1px solid rgba(212,113,88,0.28)",
                padding: "10px 12px",
                borderRadius: 10,
                lineHeight: 1.5,
              }}
            >
              {erro}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--line)",
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleAnexo}
            style={{ display: "none" }}
          />
          <button
            type="button"
            aria-label="Anexar documento"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoAnexo}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              color: "var(--muted)",
              cursor: enviandoAnexo ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: enviandoAnexo ? 0.5 : 1,
              flexShrink: 0,
              transition: "color .2s, background .2s",
            }}
            onMouseEnter={(e) => {
              if (enviandoAnexo) return
              e.currentTarget.style.color = "var(--green)"
              e.currentTarget.style.background = "rgba(78,168,132,0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted)"
              e.currentTarget.style.background = "rgba(255,255,255,0.04)"
            }}
          >
            {enviandoAnexo ? Icon.spinner(16) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13 6.5 8 11.5a2.5 2.5 0 1 1-3.5-3.5L9.5 3a1.5 1.5 0 0 1 2.2 2.1L7 10"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunte à IA sobre seu caso…"
            disabled={enviando}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void handleSubmit(e)
              }
            }}
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--line-2)",
              borderRadius: 10,
              color: "var(--ink)",
              fontSize: 14,
              lineHeight: 1.5,
              resize: "none",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!texto.trim() || enviando}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
              color: "#07120d",
              border: "1px solid transparent",
              cursor: enviando || !texto.trim() ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: !texto.trim() || enviando ? 0.5 : 1,
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.15) inset," +
                "0 8px 20px -8px rgba(78,168,132,0.55)",
              flexShrink: 0,
            }}
          >
            {Icon.arrow(16)}
          </button>
        </form>

        <style>{`
          .widget-ia-backdrop {
            position: fixed; inset: 0; z-index: 65;
            background: rgba(0,0,0,0.35);
            backdrop-filter: blur(2px);
          }
          @media (min-width: 760px) {
            .widget-ia-backdrop { display: none; }
          }
        `}</style>
      </div>
    </>
  )
}

function painelBaseStyles(): CSSProperties {
  // Desktop: flutuante bottom-right
  // Mobile (<760px): fullscreen via media query inline no <style> do panel
  const baseShadow =
    "0 1px 0 rgba(255,255,255,0.04) inset," +
    "0 -1px 0 rgba(0,0,0,0.3) inset," +
    "0 30px 60px -20px rgba(0,0,0,0.8)"
  return {
    position: "fixed",
    right: 24,
    bottom: 24,
    zIndex: 70,
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(180deg, rgba(22,26,30,0.96) 0%, rgba(12,15,18,0.98) 100%)",
    border: "1px solid var(--line-2)",
    borderRadius: 18,
    backdropFilter: "blur(18px) saturate(140%)",
    boxShadow: baseShadow,
    overflow: "hidden",
  }
}

function Bubble({
  msg,
  streaming,
}: {
  msg: Mensagem
  streaming?: boolean
}) {
  const isAi = msg.role === "assistant"
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: isAi ? "flex-start" : "flex-end",
      }}
    >
      {isAi && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={12} color="#07120d" accent="#07120d" />
        </div>
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: "9px 12px",
          borderRadius: isAi ? "6px 12px 12px 12px" : "12px 6px 12px 12px",
          background: isAi
            ? "rgba(255,255,255,0.04)"
            : "rgba(78,168,132,0.14)",
          color: isAi ? "var(--ink)" : "#eaf7f0",
          border: isAi
            ? "1px solid var(--line)"
            : "1px solid rgba(78,168,132,0.3)",
          fontSize: 13.5,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          opacity: streaming ? 0.85 : 1,
        }}
      >
        {msg.content}
        {streaming && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 12,
              marginLeft: 4,
              background: "currentColor",
              animation: "landing-blink 1s infinite",
              opacity: 0.6,
            }}
          />
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo size={12} color="#07120d" accent="#07120d" />
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          padding: "9px 12px",
          borderRadius: "6px 12px 12px 12px",
          display: "flex",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
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

function NotifSimulacao({
  notif,
  nomeCurto,
}: {
  notif: NonNullable<ReturnType<typeof useWidgetIA>["notificacaoPendente"]>
  nomeCurto?: string
}) {
  if (notif.tipo !== "simulacao_salva") return null
  const cor =
    notif.faixa === "alta"
      ? "var(--green)"
      : notif.faixa === "media"
      ? "var(--gold)"
      : "var(--danger)"

  const linha1 = `${nomeCurto ? `${nomeCurto}, vi ` : "Vi "}sua simulação${notif.cultura ? ` de ${notif.cultura}` : ""} agora.`
  const linha2 =
    notif.faixa === "alta"
      ? `Score ${notif.score}/100 — leitura forte. Quer que eu mostre como blindar pra chegar em 90+?`
      : notif.faixa === "media"
      ? `Score ${notif.score}/100 — tá no caminho. Quer ver quais 2 ações sobem mais rápido?`
      : `Score ${notif.score}/100 — vamos destravar. Posso te apontar onde tá o gargalo agora?`

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${
          notif.faixa === "alta"
            ? "rgba(78,168,132,0.14)"
            : notif.faixa === "media"
            ? "rgba(201,168,106,0.14)"
            : "rgba(212,113,88,0.14)"
        } 0%, rgba(255,255,255,0.04) 100%)`,
        border: `1px solid ${cor}`,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: cor,
          marginBottom: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cor,
            boxShadow: `0 0 8px ${cor}`,
          }}
        />
        Simulação salva · IA notou
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--ink)",
          marginBottom: 6,
        }}
      >
        {linha1}
      </div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "var(--ink-2)",
        }}
      >
        {linha2}
      </div>
    </div>
  )
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 80,
        }}
      />
      <div
        role="dialog"
        aria-label="Upgrade necessário"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 85,
          width: "min(440px, 92vw)",
          padding: 32,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(22,26,30,0.98) 0%, rgba(12,15,18,0.99) 100%)",
          border: "1px solid var(--line-gold)",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.8)," +
            "0 0 60px -20px rgba(201,168,106,0.35)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(201,168,106,0.12)",
            border: "1px solid rgba(201,168,106,0.35)",
            color: "var(--gold)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          {Icon.lock(22)}
        </div>
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          IA flutuante disponível a partir do Bronze.
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          A partir do <strong style={{ color: "var(--gold)" }}>Diagnóstico
          Rápido (R$ 79,99)</strong> você libera a IA AgroBridge em todas as
          telas — consulta, anexo de documentos e guia por cada doc.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="accent" size="md" href="/planos">
            Ver planos {Icon.arrow(14)}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </>
  )
}
