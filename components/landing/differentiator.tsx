"use client"

import { Container, SectionLabel, GlassCard, useReveal } from "./primitives"

function DiffCard({
  tag,
  title,
  body,
  delay = 1,
}: {
  tag: string
  title: string
  body: string
  delay?: number
}) {
  return (
    <GlassCard
      glow="green"
      padding={28}
      className={`reveal reveal-d${delay}`}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--green)",
          marginBottom: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--green)",
            boxShadow: "0 0 8px var(--green)",
          }}
        />
        {tag}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.018em",
          lineHeight: 1.2,
          color: "#fff",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "var(--muted)",
        }}
      >
        {body}
      </p>
    </GlassCard>
  )
}

export function Differentiator() {
  useReveal()
  return (
    <section style={{ padding: "140px 0", position: "relative" }}>
      <div
        className="ambient"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(50% 50% at 15% 80%, rgba(47,122,92,0.1), transparent 60%)",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionLabel num="03" label="Diferencial competitivo" />
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            alignItems: "flex-start",
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
              Construído por quem
              <br />
              <span style={{ color: "var(--muted)" }}>
                decidia crédito por dentro do banco.
              </span>
            </h2>
            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                marginTop: 28,
                maxWidth: 480,
              }}
            >
              A AgroBridge foi construída por time sênior com mais de uma década
              dentro das mesas de crédito rural dos maiores bancos do país.
              Cada linha do MCR, cada critério de comitê, cada motivo silencioso
              de reprovação — a gente conhece.
            </p>
            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                marginTop: 16,
                maxWidth: 480,
              }}
            >
              Não é atendimento — é tradução técnica entre a sua fazenda e o
              comitê que aprova (ou não) o seu dinheiro.
            </p>

            <GlassCard
              glow="gold"
              padding={22}
              hover={false}
              style={{
                marginTop: 36,
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #c9a86a 0%, #8a6d2a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a140a",
                  fontFamily: "Geist",
                  fontWeight: 600,
                  fontSize: 20,
                  flexShrink: 0,
                  boxShadow: "0 0 30px rgba(201,168,106,0.3)",
                }}
              >
                AB
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: "#fff",
                  }}
                >
                  Mesa técnica AgroBridge
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 4,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Analistas sênior · Crédito rural · 10+ anos
                </div>
              </div>
            </GlassCard>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <DiffCard
              delay={1}
              tag="MCR dominado"
              title="Cada cultura, cada linha, cada limite."
              body="Custeio, investimento, Pronamp, Pronaf, Moderfrota, Inovagro, ABC+. A gente sabe qual linha serve pra você — e qual não."
            />
            <DiffCard
              delay={2}
              tag="Risco de reprovação"
              title="Identificado antes do banco ver."
              body="Inconsistência em CAR, restrição no CPF, área não regularizada, faturamento inadequado — tudo apontado antes do envio."
            />
            <DiffCard
              delay={3}
              tag="Linguagem de comitê"
              title="Seu dossiê fala a língua do analista."
              body="Não é um PDF bonito. É a informação no formato exato que o analista de crédito precisa pra defender seu pedido internamente."
            />
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){ .two-col{ grid-template-columns: 1fr !important; gap: 48px !important } }
      `}</style>
    </section>
  )
}
