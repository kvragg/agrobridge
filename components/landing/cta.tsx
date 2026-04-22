"use client"

import type { ReactNode } from "react"
import {
  Container,
  Eyebrow,
  Button,
  Icon,
  GlassCard,
  GridLayer,
  useReveal,
} from "./primitives"

function CTAStat({ icon, k, v }: { icon: ReactNode; k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "rgba(78,168,132,0.12)",
          border: "1px solid rgba(78,168,132,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--green)",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 4,
          }}
        >
          {k}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.005em",
          }}
        >
          {v}
        </div>
      </div>
    </div>
  )
}

export function CTA() {
  useReveal()
  return (
    <section
      id="cta"
      style={{
        padding: "160px 0",
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
            "radial-gradient(60% 70% at 80% 30%, rgba(78,168,132,0.22), transparent 60%)," +
            "radial-gradient(40% 60% at 15% 100%, rgba(201,168,106,0.12), transparent 60%)",
        }}
      />
      <GridLayer size={80} opacity={0.04} mask="ellipse at 50% 50%" />

      <Container style={{ position: "relative" }}>
        <GlassCard
          glow="green"
          padding={0}
          hover={false}
          className="reveal"
        >
          <div
            style={{
              padding: "clamp(40px, 7vw, 96px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(60% 80% at 70% 30%, rgba(78,168,132,0.14), transparent 60%)",
              }}
            />
            <div style={{ position: "relative", maxWidth: 920 }}>
              <Eyebrow>Janela da safra 25/26</Eyebrow>
              <h2
                style={{
                  fontSize: "clamp(44px, 6.5vw, 112px)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.048em",
                  fontWeight: 500,
                  margin: "24px 0 32px",
                  textWrap: "balance",
                  color: "#fff",
                }}
              >
                Cada semana perdida
                <br />
                <span
                  style={{
                    color: "transparent",
                    background:
                      "linear-gradient(90deg,#5cbd95 0%,#c9a86a 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  é insumo mais caro e safra menor.
                </span>
              </h2>
              <p
                style={{
                  fontSize: 19,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  margin: 0,
                  maxWidth: 640,
                  letterSpacing: "-0.005em",
                }}
              >
                Comece agora. A IA te mostra onde você está e o caminho mais
                curto pra o seu dossiê chegar no comitê com cara de aprovado.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 48,
                }}
              >
                <Button size="lg" variant="accent" href="/cadastro">
                  Iniciar análise gratuita {Icon.arrow(15)}
                </Button>
                <Button size="lg" variant="ghost" href="#planos">
                  Ver planos e preços
                </Button>
              </div>

              <div
                className="cta-strip"
                style={{
                  marginTop: 64,
                  paddingTop: 32,
                  borderTop: "1px solid var(--line)",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 40,
                }}
              >
                <CTAStat
                  icon={Icon.lock(15)}
                  k="Segurança"
                  v="Dados criptografados · LGPD"
                />
                <CTAStat
                  icon={Icon.check(15)}
                  k="Compromisso"
                  v="Sem mensalidade ou fidelidade"
                />
                <CTAStat
                  icon={Icon.bank(15)}
                  k="Padrão"
                  v="Linguagem de comitê de crédito"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </Container>

      <style>{`
        @media (max-width: 760px){
          .cta-strip{ grid-template-columns: 1fr !important; gap: 24px !important }
        }
      `}</style>
    </section>
  )
}
