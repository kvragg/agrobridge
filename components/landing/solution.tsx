"use client"

import {
  Container,
  SectionLabel,
  GlassCard,
  GridLayer,
  useReveal,
} from "./primitives"

const STEPS = [
  {
    n: "01",
    t: "Entrevista com IA",
    d:
      "Você conta sua operação em 10 minutos. A IA já sabe quais perguntas o comitê vai fazer.",
  },
  {
    n: "02",
    t: "Checklist personalizado",
    d:
      "Documentos exatos pro seu caso — proprietário, arrendatário, Pronamp, custeio, investimento.",
  },
  {
    n: "03",
    t: "Organização guiada",
    d: "Validação do que existe, aponta o que falta e diz onde buscar.",
  },
  {
    n: "04",
    t: "Dossiê pronto",
    d:
      "PDF institucional, no padrão bancário, que o gerente defende internamente.",
  },
]

export function Solution() {
  useReveal()
  return (
    <section
      id="solucao"
      style={{ padding: "140px 0", position: "relative", overflow: "hidden" }}
    >
      <div
        className="ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(60% 60% at 10% 20%, rgba(78,168,132,0.12), transparent 60%)," +
            "radial-gradient(40% 60% at 85% 80%, rgba(201,168,106,0.08), transparent 60%)",
        }}
      />
      <GridLayer size={80} opacity={0.03} mask="ellipse at 50% 50%" />

      <Container style={{ position: "relative" }}>
        <SectionLabel num="02" label="Como resolvemos" />
        <div
          className="sol-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            alignItems: "flex-end",
            marginBottom: 56,
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: "clamp(40px, 5.5vw, 74px)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              Um despachante
              <br />
              <span
                style={{
                  color: "transparent",
                  background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                técnico digital.
              </span>
            </h2>
          </div>
          <div className="reveal reveal-d1">
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: 0,
                maxWidth: 480,
                letterSpacing: "-0.005em",
              }}
            >
              A gente não &quot;ajuda&quot; você a pedir crédito — monta o
              pedido no padrão que o banco aprova. Entrevista com IA, checklist
              específico, dossiê no jeito que o comitê lê.
            </p>
          </div>
        </div>

        <div
          className="sol-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {STEPS.map((s, i) => {
            const isGold = i === 3
            return (
              <GlassCard
                key={i}
                glow={isGold ? "gold" : "green"}
                padding={28}
                className={`reveal reveal-d${i + 1}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 260,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    color: isGold ? "var(--gold)" : "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isGold ? "var(--gold)" : "var(--green)",
                      boxShadow: `0 0 10px ${
                        isGold ? "var(--gold)" : "var(--green)"
                      }`,
                    }}
                  />
                  {s.n} · passo
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    marginTop: 48,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                        margin: "0 0 10px",
                        lineHeight: 1.15,
                        color: "#fff",
                      }}
                    >
                      {s.t}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--muted)",
                        letterSpacing: "-0.003em",
                      }}
                    >
                      {s.d}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){ .sol-header{ grid-template-columns: 1fr !important; gap: 24px !important; align-items: flex-start !important } }
        @media (max-width: 1080px){ .sol-grid{ grid-template-columns: repeat(2, 1fr) !important } }
        @media (max-width: 560px){ .sol-grid{ grid-template-columns: 1fr !important } }
      `}</style>
    </section>
  )
}
