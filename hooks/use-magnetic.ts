"use client"

import { useEffect, useRef, type RefObject } from "react"

type Options = {
  /** Distância máxima de pull em pixels. Default 12. */
  strength?: number
  /** Raio de ativação em pixels (a partir do centro). Default 80. */
  radius?: number
  /** Easing exponencial — quão duro o pull é nas bordas. Default 1.4. */
  ease?: number
}

/**
 * Cursor magnético: o elemento é puxado em direção ao ponteiro quando o
 * mouse fica dentro do raio de ativação. Animação via rAF, sem libs.
 *
 * Respeita prefers-reduced-motion.
 *
 * Uso:
 *   const ref = useRef<HTMLAnchorElement>(null)
 *   useMagnetic(ref)
 *   return <a ref={ref}>…</a>
 */
export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { strength = 12, radius = 80, ease = 1.4 }: Options = {},
): void {
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return
    const el = ref.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(hover: none)").matches) return // skip touch

    const tick = () => {
      const dx = targetRef.current.x - currentRef.current.x
      const dy = targetRef.current.y - currentRef.current.y
      currentRef.current.x += dx * 0.18
      currentRef.current.y += dy * 0.18
      el.style.transform = `translate3d(${currentRef.current.x.toFixed(2)}px, ${currentRef.current.y.toFixed(2)}px, 0)`
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    const ensure = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const reach = radius + Math.max(rect.width, rect.height) / 2
      if (dist > reach) {
        targetRef.current = { x: 0, y: 0 }
      } else {
        const norm = Math.min(1, dist / reach)
        const pull = Math.pow(1 - norm, ease)
        targetRef.current = {
          x: (dx / Math.max(dist, 1)) * strength * pull,
          y: (dy / Math.max(dist, 1)) * strength * pull,
        }
      }
      ensure()
    }

    const onLeaveWindow = () => {
      targetRef.current = { x: 0, y: 0 }
      ensure()
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseleave", onLeaveWindow)
    document.addEventListener("mouseleave", onLeaveWindow)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeaveWindow)
      document.removeEventListener("mouseleave", onLeaveWindow)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      el.style.transform = ""
    }
  }, [ref, strength, radius, ease])
}
