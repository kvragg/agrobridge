"use client"

import { useRef, type ReactNode } from "react"
import { useMagnetic } from "@/hooks/use-magnetic"

type Props = {
  children: ReactNode
  strength?: number
  radius?: number
  /** Marca que o elemento é display:block (ocupa linha inteira). Default inline-flex. */
  block?: boolean
}

/**
 * Wrapper que aplica cursor magnético ao filho. Não muda o layout — usa
 * inline-flex (ou block) com transform via CSS variable. O hook respeita
 * reduced-motion + touch devices automaticamente.
 *
 * Uso:
 *   <MagneticHover><Button variant="accent" href="…">…</Button></MagneticHover>
 */
export function MagneticHover({
  children,
  strength = 10,
  radius = 90,
  block = false,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  useMagnetic(ref, { strength, radius })
  return (
    <span
      ref={ref}
      style={{
        display: block ? "block" : "inline-flex",
        willChange: "transform",
      }}
    >
      {children}
    </span>
  )
}
