"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Container, Logo, Icon } from "@/components/landing/primitives"
import { createClient } from "@/lib/supabase/client"

export type TopbarTier = "free" | "Bronze" | "Prata" | "Ouro" | null

type TopbarProps = {
  nome?: string | null
  email?: string | null
  tier?: TopbarTier
  /** Renderiza um breadcrumb simples no centro (ex: nome do processo). */
  center?: ReactNode
  /**
   * Callback pra abrir o drawer mobile. Quando presente, renderiza botão
   * hambúrguer no topo esquerdo (só aparece em viewport < 960px).
   */
  onMenuClick?: () => void
}

const TIER_STYLES: Record<Exclude<TopbarTier, null>, { bg: string; color: string; border: string }> = {
  free: {
    bg: "rgba(255,255,255,0.04)",
    color: "var(--muted)",
    border: "rgba(255,255,255,0.12)",
  },
  Bronze: {
    bg: "rgba(184,115,51,0.12)",
    color: "#d4a47a",
    border: "rgba(184,115,51,0.30)",
  },
  Prata: {
    bg: "rgba(192,192,192,0.08)",
    color: "#cbd0d4",
    border: "rgba(192,192,192,0.28)",
  },
  Ouro: {
    bg: "rgba(201,168,106,0.12)",
    color: "var(--gold)",
    border: "rgba(201,168,106,0.35)",
  },
}

/**
 * Topbar dark premium pras telas autenticadas (dashboard, entrevista,
 * checklist, planos, conta/dados). Avatar + dropdown com Sair + Planos
 * + LGPD.
 */
export function Topbar({ nome, email, tier = "free", center, onMenuClick }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const inicial = (nome?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase()
  const tierShow = tier ?? "free"
  const tierLabel = tierShow === "free" ? "Free" : tierShow
  const tierStyle = TIER_STYLES[tierShow]

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(7,8,9,0.72)",
        backdropFilter: "saturate(180%) blur(18px)",
        WebkitBackdropFilter: "saturate(180%) blur(18px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Container>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {onMenuClick && (
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={onMenuClick}
                className="topbar-hamburger"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--line-2)",
                  color: "var(--ink)",
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {Icon.menu(18)}
              </button>
            )}
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "var(--ink)",
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
          </div>

          {center && (
            <div
              className="topbar-center"
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13.5,
              }}
            >
              {center}
            </div>
          )}

          <div
            ref={ref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <span
              className="mono"
              style={{
                padding: "5px 10px",
                borderRadius: 999,
                background: tierStyle.bg,
                color: tierStyle.color,
                border: `1px solid ${tierStyle.border}`,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {tierLabel}
            </span>

            <button
              type="button"
              aria-label="Menu da conta"
              onClick={() => setOpen((s) => !s)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
                color: "#07120d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 0 20px rgba(78,168,132,0.4)",
              }}
            >
              {inicial}
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: 48,
                  right: 0,
                  minWidth: 240,
                  background:
                    "linear-gradient(180deg, rgba(22,26,30,0.96) 0%, rgba(12,15,18,0.98) 100%)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 14,
                  padding: 6,
                  boxShadow:
                    "0 20px 40px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
                  backdropFilter: "blur(18px)",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line)",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {nome ?? "Produtor"}
                  </div>
                  {email && (
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {email}
                    </div>
                  )}
                </div>

                <MenuItem
                  href="/dashboard"
                  onClose={() => setOpen(false)}
                  icon={Icon.layout(14)}
                >
                  Início
                </MenuItem>
                <MenuItem
                  href="/planos"
                  onClose={() => setOpen(false)}
                  icon={Icon.bank(14)}
                >
                  Planos e preços
                </MenuItem>
                <MenuItem
                  href="/conta/dados"
                  onClose={() => setOpen(false)}
                  icon={Icon.lock(14)}
                >
                  Meus dados (LGPD)
                </MenuItem>

                <div style={{ height: 1, background: "var(--line)", margin: "6px 0" }} />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSair}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: 0,
                    borderRadius: 10,
                    color: "var(--danger)",
                    fontSize: 13.5,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(212,113,88,0.08)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  {Icon.arrow(14)} Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 760px) {
          .topbar-center { display: none !important; }
        }
        @media (max-width: 960px) {
          .topbar-hamburger { display: inline-flex !important; }
        }
      `}</style>
    </header>
  )
}

function MenuItem({
  href,
  children,
  icon,
  onClose,
}: {
  href: string
  children: ReactNode
  icon: ReactNode
  onClose: () => void
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        color: "var(--ink-2)",
        textDecoration: "none",
        fontSize: 13.5,
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
      <span style={{ color: "var(--muted)", display: "inline-flex" }}>{icon}</span>
      {children}
    </Link>
  )
}
