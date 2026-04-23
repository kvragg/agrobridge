"use client"

import type { ReactNode } from "react"
import { Container } from "@/components/landing/primitives"
import { Topbar, type TopbarTier } from "./Topbar"

/**
 * Layout B — shell autenticado. Topbar fixo + main com Container.
 * Aplica o tema dark premium via .landing-root (tokens CSS).
 */
export function DashboardShell({
  children,
  nome,
  email,
  tier,
  center,
  containerStyle,
}: {
  children: ReactNode
  nome?: string | null
  email?: string | null
  tier?: TopbarTier
  center?: ReactNode
  containerStyle?: React.CSSProperties
}) {
  return (
    <div
      className="landing-root"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Topbar nome={nome} email={email} tier={tier} center={center} />
      <main style={{ flex: 1, paddingTop: 40, paddingBottom: 80 }}>
        <Container style={containerStyle}>{children}</Container>
      </main>
    </div>
  )
}
