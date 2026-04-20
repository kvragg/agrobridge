"use client"

import { useEffect, useState } from "react"
import { Container, Button, Icon, Logo } from "./primitives"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkStyle = {
    fontSize: 13.5,
    color: "var(--ink-2)",
    opacity: 0.82,
    padding: "6px 0",
    position: "relative" as const,
    letterSpacing: "-0.005em",
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "rgba(247,245,240,0.78)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(180%) blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        transition: "background .3s, border-color .3s, backdrop-filter .3s",
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
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Logo size={22} color="var(--green)" />
            <span style={{ fontWeight: 500, letterSpacing: "-0.025em", fontSize: 17.5 }}>
              AgroBridge
            </span>
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.14em",
                color: "var(--muted)",
                border: "1px solid var(--line-2)",
                padding: "2px 6px",
                borderRadius: 4,
                textTransform: "uppercase",
                marginLeft: 6,
              }}
            >
              beta
            </span>
          </a>
          <nav style={{ display: "flex", gap: 30 }} className="landing-nav-links">
            <a href="#problema" style={linkStyle}>
              Problema
            </a>
            <a href="#solucao" style={linkStyle}>
              Solução
            </a>
            <a href="#fluxo" style={linkStyle}>
              Fluxo
            </a>
            <a href="#faq" style={linkStyle}>
              Dúvidas
            </a>
          </nav>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <a href="/login" style={{ ...linkStyle, fontSize: 13, padding: "6px 14px" }}>
              Entrar
            </a>
            <Button size="sm" variant="primary" href="/cadastro">
              Criar conta {Icon.arrow(13)}
            </Button>
          </div>
        </div>
      </Container>
      <style>{`
        @media (max-width: 860px){ .landing-nav-links{ display:none !important } }
      `}</style>
    </header>
  )
}
