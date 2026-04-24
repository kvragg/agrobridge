"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Logo, Icon } from "@/components/landing/primitives"

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  /**
   * Prefixo que marca o item como ativo. Default: match exato do href.
   * Útil pra `/entrevista` casar com `/entrevista/[id]`.
   */
  activePrefix?: string
}

const MAIN_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Icon.layout(16),
    activePrefix: "/dashboard",
  },
  {
    href: "/entrevista",
    label: "Entrevista",
    icon: Icon.chat(16),
    activePrefix: "/entrevista",
  },
  {
    href: "/checklist",
    label: "Checklist",
    icon: Icon.clipboardCheck(16),
    activePrefix: "/checklist",
  },
  {
    href: "/simulador",
    label: "Simulador",
    icon: Icon.spark(16),
    activePrefix: "/simulador",
  },
  {
    href: "/simulador/comparar",
    label: "Comparar",
    icon: Icon.layout(16),
    activePrefix: "/simulador/comparar",
  },
  {
    href: "/simulador/historico",
    label: "Histórico",
    icon: Icon.doc(16),
    activePrefix: "/simulador/historico",
  },
  {
    href: "/planos",
    label: "Planos",
    icon: Icon.bank(16),
    activePrefix: "/planos",
  },
  {
    href: "/conta/dados",
    label: "Meus dados",
    icon: Icon.user(16),
    activePrefix: "/conta",
  },
]

type AppSidebarProps = {
  /** Se true, renderiza em modo drawer (mobile). */
  mobileOpen: boolean
  /** Fecha o drawer (mobile). */
  onClose: () => void
  /** Se true, renderiza o item "Admin" no final. Autoridade vem
   * validada no server (isEmailAdmin) — este flag é só visual. */
  isAdmin?: boolean
}

export function AppSidebar({ mobileOpen, onClose, isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Fecha drawer ao navegar em mobile
  useEffect(() => {
    if (mobileOpen) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // ESC fecha drawer
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen, onClose])

  // Bloqueia scroll do body quando drawer aberto (mobile)
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  function isActive(item: NavItem): boolean {
    const prefix = item.activePrefix ?? item.href
    if (pathname === item.href) return true
    // Match exato: outro item da lista tem prefix mais específico que
    // também bate? Se sim, este aqui não ganha. Evita "Simulador" e
    // "Comparar" ficarem ambos highlighted em /simulador/comparar.
    const haPrefixMaisEspecifico = MAIN_ITEMS.some(
      (other) =>
        other !== item &&
        (other.activePrefix ?? other.href).startsWith(prefix + "/") &&
        (pathname.startsWith((other.activePrefix ?? other.href) + "/") ||
          pathname === (other.activePrefix ?? other.href)),
    )
    if (haPrefixMaisEspecifico) return false
    return pathname.startsWith(prefix + "/") || pathname === prefix
  }

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navContent = (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px 16px 16px",
      }}
    >
      {/* Logo + wordmark — desktop only (no mobile, já aparece no topbar) */}
      <Link
        href="/dashboard"
        className="app-sidebar__brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 8px 24px",
          textDecoration: "none",
          color: "var(--ink)",
          borderBottom: "1px solid var(--line)",
          marginBottom: 18,
        }}
      >
        <Logo size={22} color="var(--ink)" accent="var(--gold)" />
        <span
          style={{
            fontWeight: 500,
            letterSpacing: "-0.025em",
            fontSize: 17,
          }}
        >
          AgroBridge
        </span>
      </Link>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, display: "grid", gap: 4 }}>
        {MAIN_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.href}>
              <SidebarLink href={item.href} icon={item.icon} active={active}>
                {item.label}
              </SidebarLink>
            </li>
          )
        })}
      </ul>

      <div style={{ height: 1, background: "var(--line)", margin: "16px 0 10px" }} />

      {isAdmin && (
        <Link
          href="/admin/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 13.5,
            color: "var(--gold)",
            textDecoration: "none",
            marginBottom: 4,
            border: "1px solid color-mix(in srgb, var(--gold) 35%, transparent)",
            background: "color-mix(in srgb, var(--gold) 6%, transparent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "color-mix(in srgb, var(--gold) 14%, transparent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "color-mix(in srgb, var(--gold) 6%, transparent)"
          }}
        >
          <span style={{ color: "var(--gold)", display: "inline-flex", flexShrink: 0 }}>
            {Icon.bank(16)}
          </span>
          Admin
        </Link>
      )}

      <Link
        href="/como-funciona"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 10,
          fontSize: 13.5,
          color: "var(--ink-2)",
          textDecoration: "none",
          marginBottom: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
          e.currentTarget.style.color = "var(--ink)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = "var(--ink-2)"
        }}
      >
        <span style={{ color: "var(--muted)", display: "inline-flex", flexShrink: 0 }}>
          {Icon.spark(16)}
        </span>
        Como funciona
      </Link>

      <button
        type="button"
        onClick={handleSair}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 10,
          background: "transparent",
          border: 0,
          color: "var(--danger)",
          fontSize: 14,
          fontFamily: "inherit",
          cursor: "pointer",
          textAlign: "left",
          transition: "background .2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(212,113,88,0.08)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
        }}
      >
        <span style={{ color: "var(--danger)", display: "inline-flex" }}>
          {Icon.logOut(16)}
        </span>
        Sair
      </button>
    </nav>
  )

  return (
    <>
      {/* Desktop — fixa à esquerda */}
      <aside
        className="app-sidebar app-sidebar--desktop"
        aria-label="Menu principal"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 248,
          background:
            "linear-gradient(180deg, rgba(11,13,15,0.95) 0%, rgba(7,8,9,0.98) 100%)",
          borderRight: "1px solid var(--line)",
          backdropFilter: "saturate(180%) blur(18px)",
          WebkitBackdropFilter: "saturate(180%) blur(18px)",
          zIndex: 40,
        }}
      >
        {navContent}
      </aside>

      {/* Mobile — drawer */}
      {mobileOpen && (
        <div
          className="app-sidebar__backdrop"
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 60,
          }}
        />
      )}
      <aside
        className="app-sidebar app-sidebar--mobile"
        aria-label="Menu principal"
        aria-hidden={!mobileOpen}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(280px, 80vw)",
          background: "var(--bg-1)",
          borderRight: "1px solid var(--line)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s cubic-bezier(.2,.7,.2,1)",
          zIndex: 70,
          display: "none",
        }}
      >
        {navContent}
      </aside>

      <style>{`
        @media (max-width: 960px) {
          .app-sidebar--desktop { display: none !important; }
          .app-sidebar--mobile { display: block !important; }
        }
      `}</style>
    </>
  )
}

function SidebarLink({
  href,
  icon,
  active,
  children,
}: {
  href: string
  icon: ReactNode
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        fontSize: 14,
        letterSpacing: "-0.005em",
        color: active ? "var(--ink)" : "var(--ink-2)",
        background: active ? "rgba(78,168,132,0.10)" : "transparent",
        textDecoration: "none",
        transition: "background .2s, color .2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
          e.currentTarget.style.color = "var(--ink)"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = "var(--ink-2)"
        }
      }}
    >
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: "0 3px 3px 0",
            background: "var(--green)",
            boxShadow: "0 0 8px var(--green)",
          }}
        />
      )}
      <span
        style={{
          color: active ? "var(--green)" : "var(--muted)",
          display: "inline-flex",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      {children}
    </Link>
  )
}
