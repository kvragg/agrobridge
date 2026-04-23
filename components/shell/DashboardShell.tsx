"use client"

import { useState, type ReactNode } from "react"
import { Container } from "@/components/landing/primitives"
import { Topbar, type TopbarTier } from "./Topbar"
import { AppSidebar } from "./AppSidebar"

/**
 * Layout B — shell autenticado. Sidebar fixa à esquerda no desktop,
 * drawer no mobile. Topbar no topo com avatar/menu.
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
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      className="landing-root dashboard-shell"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className="dashboard-shell__main"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingLeft: 248,
        }}
      >
        <Topbar
          nome={nome}
          email={email}
          tier={tier}
          center={center}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main style={{ flex: 1, paddingTop: 40, paddingBottom: 80 }}>
          <Container style={containerStyle}>{children}</Container>
        </main>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .dashboard-shell__main { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
