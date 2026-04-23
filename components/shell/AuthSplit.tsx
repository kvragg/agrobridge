"use client"

import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { GlassCard, GridLayer, Logo } from "@/components/landing/primitives"

/**
 * Layout A — "split auth" pras telas /login, /cadastro, /resetar-senha,
 * /auth/confirmado etc. Dark premium com painel esquerdo institucional
 * + card glass verde à direita com o conteúdo.
 *
 * Painel esquerdo some em viewport < 960px.
 */
type AuthSplitProps = {
  children: ReactNode
  cardStyle?: CSSProperties
  /**
   * Quando a tela é centralizada (sucesso, confirmações), usa `cardOnly`
   * e o painel lateral é omitido.
   */
  cardOnly?: boolean
  /** Glow do card (default "green"). Use "gold" em telas de sucesso. */
  glow?: "green" | "gold" | "none"
  /** Largura máxima do card central. Default 440. */
  maxWidth?: number
}

export function AuthSplit({
  children,
  cardStyle,
  cardOnly = false,
  glow = "green",
  maxWidth = 440,
}: AuthSplitProps) {
  return (
    <div
      className="landing-root auth-split"
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg)",
      }}
    >
      {!cardOnly && (
        <aside
          className="auth-split__panel"
          style={{
            width: 420,
            flexShrink: 0,
            background: "var(--bg-1)",
            borderRight: "1px solid var(--line)",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="ambient"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              background:
                "radial-gradient(60% 50% at 20% 10%, rgba(78,168,132,0.10), transparent 60%)," +
                "radial-gradient(40% 40% at 80% 90%, rgba(201,168,106,0.08), transparent 60%)",
            }}
          />
          <Link
            href="/"
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <Logo size={24} color="var(--ink)" accent="var(--gold)" />
            <span
              style={{
                fontWeight: 500,
                letterSpacing: "-0.02em",
                fontSize: 18,
                color: "var(--ink)",
              }}
            >
              AgroBridge
            </span>
          </Link>

          <div style={{ position: "relative", zIndex: 2 }}>
            <blockquote
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.5,
                color: "var(--ink-2)",
                maxWidth: 320,
                fontStyle: "normal",
                letterSpacing: "-0.005em",
              }}
            >
              &ldquo;14 anos no SFN. Gestor de carteira Agro em banco privado.
              Cada linha do MCR conhecida de dentro.&rdquo;
            </blockquote>
            <div
              className="mono"
              style={{
                marginTop: 18,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Fundador AgroBridge
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: "1px solid var(--line)",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {[
                ["FBB-420", "FEBRABAN"],
                ["CPA-20", "ANBIMA"],
                ["Cert.", "Rehagro"],
              ].map(([sigla, emissor]) => (
                <span
                  key={sigla}
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(201,168,106,0.08)",
                    border: "1px solid rgba(201,168,106,0.25)",
                    color: "var(--gold)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {sigla} · {emissor}
                </span>
              ))}
            </div>
          </div>
        </aside>
      )}

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 48px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(60% 70% at 80% 10%, rgba(78,168,132,0.12), transparent 60%)",
          }}
        />
        <GridLayer size={72} opacity={0.03} mask="ellipse at 60% 30%" />

        <GlassCard
          glow={glow}
          padding={40}
          hover={false}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth,
            ...cardStyle,
          }}
        >
          {children}
        </GlassCard>
      </main>

      <style>{`
        @media (max-width: 960px) {
          .auth-split { flex-direction: column; }
          .auth-split__panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
