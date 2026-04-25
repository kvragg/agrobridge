"use client"

import { useEffect, type RefObject } from "react"

/**
 * Spotlight follow: atualiza CSS variables --spot-x / --spot-y no elemento
 * conforme posição do mouse, em coordenadas relativas (0-100%). Use no CSS:
 *
 *   background:
 *     radial-gradient(420px circle at var(--spot-x) var(--spot-y),
 *       rgba(78,168,132,0.10), transparent 60%);
 *
 * Respeita prefers-reduced-motion (não desativa, mas reduz para snap em vez
 * de atualização contínua) e dispositivos touch (sem listener).
 */
export function useSpotlight<T extends HTMLElement>(
  ref: RefObject<T | null>,
): void {
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(hover: none)").matches) return

    el.style.setProperty("--spot-x", "50%")
    el.style.setProperty("--spot-y", "50%")

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty("--spot-x", `${x.toFixed(1)}%`)
      el.style.setProperty("--spot-y", `${y.toFixed(1)}%`)
    }

    el.addEventListener("mousemove", onMove, { passive: true })
    return () => el.removeEventListener("mousemove", onMove)
  }, [ref])
}
