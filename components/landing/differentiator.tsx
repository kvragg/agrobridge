"use client"

import type { CSSProperties } from "react"
import { Container, SectionLabel } from "./primitives"

function DiffCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  const baseStyle: CSSProperties = {
    padding: 28,
    border: "1px solid var(--line-2)",
    borderRadius: 14,
    background: "var(--cream)",
    transition: "all .25s",
  }
  return (
    <div
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--green)"
        e.currentTarget.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line-2)"
        e.currentTarget.style.transform = "none"
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--green)",
          marginBottom: 12,
        }}
      >
        {tag}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h3>
      <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.55, color: "var(--muted)" }}>
        {body}
      </p>
    </div>
  )
}

export function Differentiator() {
  return (
    <section style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}>
      <Container>
        <SectionLabel num="03" label="Diferencial competitivo" />
        <div
          className="landing-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(34px, 4.4vw, 54px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
              }}
            >
              Feito por quem
              <br />
              <span style={{ color: "var(--muted)" }}>
                decidiu crédito por dentro do banco.
              </span>
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                marginTop: 28,
                maxWidth: 460,
              }}
            >
              A AgroBridge foi construída por um especialista com 14 anos no Sistema Financeiro
              Nacional, formado dentro de um banco privado de grande porte. Começou na linha de
              frente como caixa, escalou para carteira Agro III e chegou à gestão de agência
              integral.
            </p>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                marginTop: 18,
                maxWidth: 460,
              }}
            >
              Isso não é atendimento — é tradução técnica entre a sua fazenda e o analista que
              aprova (ou não) o seu dinheiro.
            </p>

            <div
              style={{
                marginTop: 40,
                padding: 24,
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                borderRadius: 14,
              }}
            >
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2a5a45 0%, #0f3d2e 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  F
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>Fundador AgroBridge</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      marginTop: 2,
                      letterSpacing: "0.04em",
                    }}
                  >
                    [ 14 anos no SFN · gestor de carteira Agro · ex-banco privado ]
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { tag: "FBB-420", src: "FEBRABAN" },
                  { tag: "CPA-20", src: "ANBIMA" },
                  { tag: "Rehagro", src: "Cooperativismo" },
                ].map((c) => (
                  <div
                    key={c.tag}
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: "rgba(15,61,46,0.06)",
                      border: "1px solid var(--line-2)",
                      color: "var(--ink-2)",
                      display: "inline-flex",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{c.tag}</span>
                    <span style={{ color: "var(--muted)" }}>· {c.src}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <DiffCard
              tag="MCR dominado"
              title="Cada cultura, cada linha, cada limite."
              body="Custeio, investimento, PRONAF, PRONAMP, FCO, BNDES, CPR, Moderfrota, Inovagro. A gente identifica qual linha serve pra você — e qual não enquadra."
            />
            <DiffCard
              tag="Risco de reprovação"
              title="Identificado antes do banco ver."
              body="Inconsistência em CAR, restrição no CPF, área não regularizada, faturamento inadequado pra linha — tudo apontado antes do envio."
            />
            <DiffCard
              tag="Linguagem de comitê"
              title="Seu dossiê fala a língua do analista."
              body="Não é um PDF bonito. É a informação no formato exato que o analista de crédito precisa pra defender seu pedido internamente."
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
