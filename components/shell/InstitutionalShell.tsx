"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Container, Logo } from "@/components/landing/primitives"

/**
 * Layout C — institucional (privacidade, termos, auth/confirmado, 404).
 * Nav simplificado no topo (só Logo + wordmark). Container estreito
 * pra legibilidade de texto longo.
 */
export function InstitutionalShell({
  children,
  maxWidth = 720,
}: {
  children: ReactNode
  maxWidth?: number
}) {
  return (
    <div
      className="landing-root"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <Logo size={22} color="var(--ink)" accent="var(--gold)" />
              <span style={{ fontWeight: 500, letterSpacing: "-0.025em", fontSize: 17 }}>
                AgroBridge
              </span>
            </Link>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              ← Voltar ao site
            </Link>
          </div>
        </Container>
      </header>

      <main style={{ flex: 1, padding: "56px 24px 96px" }}>
        <Container style={{ maxWidth }}>{children}</Container>
      </main>
    </div>
  )
}
