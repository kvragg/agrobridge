"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type WidgetState = "closed" | "minimized" | "open"

/** Notificação proativa que a IA mostra ao abrir o widget. */
export interface NotificacaoProativa {
  tipo: "simulacao_salva"
  score: number
  faixa: "baixa" | "media" | "alta"
  cultura?: string
  timestamp: number
}

interface WidgetIAContextValue {
  state: WidgetState
  open: () => void
  close: () => void
  minimize: () => void
  toggle: () => void
  /** Marca que o usuário interagiu (controla "abrir uma vez por dia"). */
  markInteracted: () => void
  /** Usado pela integração com simulação salva na Fase C. */
  pulse: () => void
  pulsing: boolean
  /** Notificação proativa pendente (some quando widget abre e exibe). */
  notificacaoPendente: NotificacaoProativa | null
  /** Disparado por outras telas (ex: SimuladorClient após salvar). */
  notificarSimulacaoSalva: (params: { score: number; cultura?: string }) => void
  /** Consome a notificação (chamado pelo WidgetIA depois de exibir). */
  consumirNotificacao: () => void
}

const Ctx = createContext<WidgetIAContextValue | null>(null)

const LS_KEY = "ia_widget_last_opened"
const PULSE_MS = 2500

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Provider global do widget IA. Deve ser montado no DashboardShell (único
 * lugar logado). Controla:
 *   - state (open | minimized | closed)
 *   - auto-open no primeiro login do dia
 *   - pulse de atenção (quando algo relevante acontece)
 */
export function WidgetIAProvider({
  children,
  userId,
  autoOpenDiario = true,
}: {
  children: ReactNode
  userId: string | null
  autoOpenDiario?: boolean
}) {
  const [state, setState] = useState<WidgetState>("closed")
  const [pulsing, setPulsing] = useState(false)
  const [notificacaoPendente, setNotificacaoPendente] =
    useState<NotificacaoProativa | null>(null)

  // Auto-open no primeiro login do dia (per-user via localStorage)
  useEffect(() => {
    if (!autoOpenDiario || !userId) return
    if (typeof window === "undefined") return

    try {
      const raw = localStorage.getItem(`${LS_KEY}:${userId}`)
      const last = raw ? new Date(raw) : null
      const agora = new Date()

      if (!last || !sameDay(last, agora)) {
        // Primeira visita do dia — abre com um delay curto pra não
        // bloquear hydratação
        const t = setTimeout(() => setState("open"), 600)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage indisponível — silencioso
    }
  }, [userId, autoOpenDiario])

  const open = useCallback(() => {
    setState("open")
    setPulsing(false)
    if (userId && typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LS_KEY}:${userId}`, new Date().toISOString())
      } catch {
        /* ignore */
      }
    }
  }, [userId])

  const close = useCallback(() => setState("closed"), [])
  const minimize = useCallback(() => setState("minimized"), [])

  const toggle = useCallback(() => {
    setState((s) => (s === "open" ? "closed" : "open"))
    if (userId && typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LS_KEY}:${userId}`, new Date().toISOString())
      } catch {
        /* ignore */
      }
    }
  }, [userId])

  const markInteracted = useCallback(() => {
    if (userId && typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LS_KEY}:${userId}`, new Date().toISOString())
      } catch {
        /* ignore */
      }
    }
  }, [userId])

  const pulse = useCallback(() => {
    setPulsing(true)
    const t = setTimeout(() => setPulsing(false), PULSE_MS)
    return () => clearTimeout(t)
  }, [])

  const notificarSimulacaoSalva = useCallback(
    ({ score, cultura }: { score: number; cultura?: string }) => {
      const faixa: NotificacaoProativa["faixa"] =
        score >= 70 ? "alta" : score >= 50 ? "media" : "baixa"
      setNotificacaoPendente({
        tipo: "simulacao_salva",
        score,
        faixa,
        cultura,
        timestamp: Date.now(),
      })
      // Pulse no FAB pra atrair atenção (sem abrir automático — user
      // mantém controle).
      setPulsing(true)
      setTimeout(() => setPulsing(false), PULSE_MS * 2)
    },
    [],
  )

  const consumirNotificacao = useCallback(() => {
    setNotificacaoPendente(null)
  }, [])

  const value = useMemo<WidgetIAContextValue>(
    () => ({
      state,
      open,
      close,
      minimize,
      toggle,
      markInteracted,
      pulse,
      pulsing,
      notificacaoPendente,
      notificarSimulacaoSalva,
      consumirNotificacao,
    }),
    [
      state,
      open,
      close,
      minimize,
      toggle,
      markInteracted,
      pulse,
      pulsing,
      notificacaoPendente,
      notificarSimulacaoSalva,
      consumirNotificacao,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWidgetIA(): WidgetIAContextValue {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error("useWidgetIA precisa estar dentro de WidgetIAProvider")
  }
  return v
}
