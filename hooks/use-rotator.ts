'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

export interface UseRotatorOptions {
  /** Tempo entre transições, em ms. */
  intervalMs: number
  /** Roda automaticamente? Default: true. */
  autoplay?: boolean
  /** Resolve `prefers-reduced-motion: reduce` desativando autoplay automaticamente. */
  respectReducedMotion?: boolean
}

export interface UseRotatorState {
  /** Índice corrente. */
  index: number
  /** Está pausado? (manual ou hover) */
  isPaused: boolean
  /** Progresso 0..1 do intervalo atual. */
  progress: number
  /** Avança 1. */
  next: () => void
  /** Volta 1. */
  prev: () => void
  /** Pausa explicitamente. */
  pause: () => void
  /** Retoma. */
  resume: () => void
  /** Alterna. */
  toggle: () => void
  /** Pausa enquanto o pointer está sobre algum elemento (gerenciado externamente). */
  setHoverPaused: (v: boolean) => void
}

/**
 * Rotator genérico — controla índice, autoplay com pausa por hover/manual,
 * e barra de progresso suave via requestAnimationFrame.
 *
 * Não conhece o conteúdo; usado por glossário hoje, depoimentos amanhã.
 */
export function useRotator(
  total: number,
  { intervalMs, autoplay = true, respectReducedMotion = true }: UseRotatorOptions,
): UseRotatorState {
  const [index, setIndex] = useState(0)
  const [manualPaused, setManualPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Inicializa em 0; setado no efeito de autoplay (não pode chamar
  // performance.now() durante render — quebra react-hooks/purity).
  const startedAtRef = useRef<number>(0)
  const accumulatedRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // Detecta prefers-reduced-motion via useSyncExternalStore — evita
  // setState dentro de useEffect (regra react-hooks/set-state-in-effect).
  const reducedMotion = useSyncExternalStore(
    (callback) => {
      if (!respectReducedMotion || typeof window === 'undefined') {
        return () => {}
      }
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => {
      if (!respectReducedMotion || typeof window === 'undefined') return false
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    () => false, // SSR fallback
  )

  const isPaused = manualPaused || hoverPaused
  const autoplayEffective = autoplay && !reducedMotion && !isPaused && total > 1

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(total, 1))
    accumulatedRef.current = 0
    startedAtRef.current = performance.now()
    setProgress(0)
  }, [total])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1))
    accumulatedRef.current = 0
    startedAtRef.current = performance.now()
    setProgress(0)
  }, [total])

  const pause = useCallback(() => setManualPaused(true), [])
  const resume = useCallback(() => setManualPaused(false), [])
  const toggle = useCallback(() => setManualPaused((p) => !p), [])

  // Loop de progresso via rAF
  useEffect(() => {
    if (!autoplayEffective) {
      // Quando pausa, congela acumulado pra retomar de onde parou
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }
    startedAtRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = accumulatedRef.current + (now - startedAtRef.current)
      const pct = Math.min(elapsed / intervalMs, 1)
      setProgress(pct)
      if (pct >= 1) {
        // Avança e zera
        accumulatedRef.current = 0
        startedAtRef.current = performance.now()
        setIndex((i) => (i + 1) % Math.max(total, 1))
        setProgress(0)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) {
        // Acumula tempo já decorrido pra retomar suave
        accumulatedRef.current += performance.now() - startedAtRef.current
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [autoplayEffective, intervalMs, total])

  // Removido reset por mudança de `total`: na prática `items.length` é
  // estável durante o ciclo de vida do componente. Se algum caller
  // futuro precisar de reset, expõe `setIndex` ou cria opção dedicada.

  return {
    index,
    isPaused,
    progress,
    next,
    prev,
    pause,
    resume,
    toggle,
    setHoverPaused,
  }
}
