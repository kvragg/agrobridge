"use client"

import type { ReactNode } from "react"
import { Icon } from "@/components/landing/primitives"

type AlertVariant = "success" | "error" | "info" | "gold"

const VARIANT_STYLES: Record<
  AlertVariant,
  { bg: string; border: string; color: string; icon: ReactNode }
> = {
  success: {
    bg: "rgba(78,168,132,0.08)",
    border: "rgba(78,168,132,0.25)",
    color: "var(--green)",
    icon: Icon.check(16),
  },
  error: {
    bg: "rgba(212,113,88,0.08)",
    border: "rgba(212,113,88,0.30)",
    color: "var(--danger)",
    icon: Icon.x(16),
  },
  info: {
    bg: "rgba(255,255,255,0.04)",
    border: "var(--line-2)",
    color: "var(--ink)",
    icon: Icon.dot(10),
  },
  gold: {
    bg: "rgba(201,168,106,0.08)",
    border: "rgba(201,168,106,0.25)",
    color: "var(--gold)",
    icon: Icon.lock(16),
  },
}

/**
 * Alert banner padronizado dark premium. Uso em forms (login erro/sucesso,
 * cadastro pós-submit, /conta/dados LGPD, etc).
 */
export function Alert({
  children,
  variant = "info",
}: {
  children: ReactNode
  variant?: AlertVariant
}) {
  const s = VARIANT_STYLES[variant]
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        color: "var(--ink)",
        fontSize: 14,
        lineHeight: 1.5,
        margin: "12px 0",
      }}
    >
      <span
        style={{
          color: s.color,
          flexShrink: 0,
          marginTop: 1,
          display: "inline-flex",
        }}
      >
        {s.icon}
      </span>
      <div>{children}</div>
    </div>
  )
}
