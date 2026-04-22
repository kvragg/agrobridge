"use client"

import { Container, SectionLabel, GlassCard, useReveal } from "./primitives"

const PAINS = [
  {
    tag: "01",
    title: "O banco recusa e você não sabe o motivo.",
    body:
      'O gerente diz que "faltou documento" ou que "não atende ao MCR". Você volta sem saber o que corrigir.',
  },
  {
    tag: "02",
    title: "A documentação trava tudo.",
    body:
      "CAR, CCIR, ITR, contrato de arrendamento, DAP. Um papel errado e o pedido volta pro início da fila.",
  },
  {
    tag: "03",
    title: "A demora queima a janela da safra.",
    body:
      "O plantio não espera. Quando o crédito sai, o insumo já subiu ou a janela já fechou.",
  },
  {
    tag: "04",
    title: "Ninguém explica o que o banco quer ver.",
    body:
      "Critérios do MCR são técnicos. O gerente não tem tempo. O contador conhece imposto, não crédito rural.",
  },
]

export function Problem() {
  useReveal()
  return (
    <section
      id="problema"
      style={{ padding: "140px 0", position: "relative" }}
    >
      <div
        className="ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(50% 50% at 80% 20%, rgba(212,113,88,0.08), transparent 70%)",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionLabel num="01" label="O problema real" />
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.25fr",
            gap: 72,
            marginBottom: 56,
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: "clamp(36px, 4.6vw, 58px)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              Você produz no campo.
              <br />
              <span style={{ color: "var(--muted)" }}>
                Mas perde dinheiro na mesa do gerente.
              </span>
            </h2>
          </div>
          <div className="reveal reveal-d1">
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                margin: 0,
                maxWidth: 480,
              }}
            >
              Crédito rural não é falta de dinheiro no banco — é falta de dossiê
              no padrão que o banco aprova. É um problema técnico, não de sorte.
            </p>
          </div>
        </div>

        <div
          className="pain-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {PAINS.map((p, i) => (
            <GlassCard
              key={i}
              glow="none"
              padding={28}
              className={`reveal reveal-d${i + 1}`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 220,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--gold)",
                }}
              >
                {p.tag}
              </div>
              <div style={{ marginTop: 48 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18.5,
                    fontWeight: 500,
                    letterSpacing: "-0.018em",
                    lineHeight: 1.28,
                    color: "#fff",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--muted)",
                  }}
                >
                  {p.body}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </Container>
      <style>{`
        @media (max-width: 1080px){ .pain-grid{ grid-template-columns: repeat(2, 1fr) !important } }
        @media (max-width: 900px){ .two-col{ grid-template-columns: 1fr !important; gap: 32px !important } }
        @media (max-width: 560px){ .pain-grid{ grid-template-columns: 1fr !important } }
      `}</style>
    </section>
  )
}
