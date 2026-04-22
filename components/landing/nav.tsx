"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { Container, Button, Icon, Logo } from "./primitives"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const linkStyle: CSSProperties = {
    fontSize: 13.5,
    color: "var(--ink-2)",
    opacity: 0.82,
    padding: "6px 0",
    position: "relative",
    letterSpacing: "-0.005em",
    transition: "opacity .2s",
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(7,8,9,0.72)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(18px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(180%) blur(18px)" : "none",
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
            height: 68,
          }}
        >
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={22} color="var(--ink)" accent="var(--gold)" />
            <span
              style={{
                fontWeight: 500,
                letterSpacing: "-0.025em",
                fontSize: 17,
                color: "var(--ink)",
              }}
            >
              AgroBridge
            </span>
            <span
              className="mono"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.18em",
                color: "var(--muted)",
                border: "1px solid var(--line-2)",
                padding: "2px 7px",
                borderRadius: 4,
                textTransform: "uppercase",
                marginLeft: 6,
              }}
            >
              beta
            </span>
          </a>

          <nav style={{ display: "flex", gap: 30 }} className="landing-nav-links">
            <a href="#problema" style={linkStyle}>Problema</a>
            <a href="#solucao" style={linkStyle}>Solução</a>
            <a href="#fluxo" style={linkStyle}>Fluxo</a>
            <a href="#planos" style={linkStyle}>Planos</a>
            <a href="#faq" style={linkStyle}>Dúvidas</a>
          </nav>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              href="/login"
              style={{ ...linkStyle, fontSize: 13, padding: "6px 14px" }}
            >
              Entrar
            </a>
            <Button size="sm" variant="accent" href="/cadastro">
              Análise gratuita {Icon.arrow(13)}
            </Button>
          </div>
        </div>
      </Container>
      <style>{`
        @media (max-width: 960px){ .landing-nav-links{ display:none !important } }
      `}</style>
    </header>
  )
}
