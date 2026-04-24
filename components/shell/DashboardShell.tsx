"use client"

import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Container } from "@/components/landing/primitives"
import { Topbar, type TopbarTier } from "./Topbar"
import { AppSidebar } from "./AppSidebar"
import { WidgetIAProvider } from "@/components/widget-ia/WidgetIAProvider"
import { WidgetIA, type WidgetIATier } from "@/components/widget-ia/WidgetIA"

/**
 * Layout B — shell autenticado. Sidebar fixa à esquerda no desktop,
 * drawer no mobile. Topbar no topo com avatar/menu. Widget IA
 * flutuante no canto inferior direito (oposto ao menu), visível em
 * todas as rotas exceto /entrevista (onde já existe chat da tela) e
 * /checklist/[id] (onde o foco é upload de docs).
 */

// Rotas onde o widget fica escondido (chat ou upload da tela domina)
const ROTAS_SEM_WIDGET: ReadonlyArray<string> = [
  "/entrevista",
  "/entrevista/nova",
]
function rotaSemWidget(pathname: string): boolean {
  if (ROTAS_SEM_WIDGET.includes(pathname)) return true
  // /entrevista/[id] e /checklist/[id] ficam sem widget (4b)
  if (pathname.startsWith("/entrevista/")) return true
  if (pathname.startsWith("/checklist/")) return true
  return false
}

function tierToWidget(tier?: TopbarTier): WidgetIATier {
  if (tier === "Bronze") return "Bronze"
  if (tier === "Prata") return "Prata"
  if (tier === "Ouro") return "Ouro"
  return "free"
}

export function DashboardShell({
  children,
  nome,
  email,
  tier,
  center,
  containerStyle,
  userId,
  isAdmin,
}: {
  children: ReactNode
  nome?: string | null
  email?: string | null
  tier?: TopbarTier
  center?: ReactNode
  containerStyle?: React.CSSProperties
  /** ID do usuário pra localStorage do widget (auto-open diário). */
  userId?: string | null
  /** Se true, mostra item "Admin" na sidebar. Computado no server
   * layout via isEmailAdmin(user.email). Nunca fie no client-only. */
  isAdmin?: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname() ?? "/"
  const widgetEscondido = rotaSemWidget(pathname)

  return (
    <div
      className="landing-root dashboard-shell"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <AppSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAdmin={Boolean(isAdmin)}
      />

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

      <WidgetIAProvider
        userId={userId ?? null}
        autoOpenDiario={!widgetEscondido}
      >
        <WidgetIA
          tier={tierToWidget(tier)}
          nomeCurto={nome ?? undefined}
          hidden={widgetEscondido}
        />
      </WidgetIAProvider>

      <style>{`
        @media (max-width: 960px) {
          .dashboard-shell__main { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
