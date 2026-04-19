"use client"

import { useEffect, useState } from "react"
import { Container, SectionLabel, Icon } from "./primitives"

const steps = [
  {
    phase: "Entrevista",
    duration: "10 min",
    items: [
      "Perfil da propriedade e área",
      "Cultura principal e segunda safra",
      "Regime: próprio ou arrendado",
      "Faturamento médio declarado",
    ],
  },
  {
    phase: "Checklist",
    duration: "~1 dia",
    items: [
      "CAR — Cadastro Ambiental Rural",
      "CCIR atualizado",
      "ITR dos últimos 5 exercícios",
      "Contrato de arrendamento registrado",
      "DAP ou declaração de aptidão",
    ],
  },
  {
    phase: "Organização",
    duration: "2–3 dias",
    items: [
      "Validação cruzada de documentos",
      "Regularização de pendências",
      "Projeto técnico orçado",
      "Análise de risco pré-envio",
    ],
  },
  {
    phase: "Dossiê",
    duration: "Pronto pro banco",
    items: [
      "PDF institucional · 1 arquivo",
      "Sumário executivo do comitê",
      "Anexos indexados",
      "Enquadramento MCR explícito",
    ],
  },
]

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let phase = 0
    let item = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setChecked((prev) => ({ ...prev, [`${phase}-${item}`]: true }))
      item += 1
      if (item >= steps[phase].items.length) {
        item = 0
        phase += 1
        if (phase >= steps.length) {
          timer = setTimeout(() => {
            phase = 0
            item = 0
            setChecked({})
            setActive(0)
            timer = setTimeout(tick, 600)
          }, 2000)
          return
        }
        setActive(phase)
      }
      timer = setTimeout(tick, 700)
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [])

  const totalItems = steps.reduce((a, s) => a + s.items.length, 0)
  const doneCount = Object.values(checked).filter(Boolean).length

  return (
    <section id="fluxo" style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}>
      <Container>
        <SectionLabel num="04" label="Como funciona" />
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <h2
            style={{
              fontSize: "clamp(34px, 4.6vw, 56px)",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              fontWeight: 500,
              margin: 0,
              textWrap: "balance",
            }}
          >
            Seu dossiê sendo montado,
            <br />
            <span style={{ color: "var(--muted)" }}>item por item.</span>
          </h2>
        </div>

        <div
          className="landing-how-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            gap: 48,
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "grid", gap: 0 }}>
            {steps.map((s, i) => {
              const isActive = i === active
              const isDone = i < active
              return (
                <div
                  key={s.phase}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    padding: "22px 0",
                    gap: 16,
                    alignItems: "flex-start",
                    borderTop: "1px solid var(--line-2)",
                    borderBottom: i === steps.length - 1 ? "1px solid var(--line-2)" : "none",
                    opacity: isActive || isDone ? 1 : 0.5,
                    transition: "opacity .3s",
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isDone ? "var(--green)" : isActive ? "var(--ink)" : "transparent",
                      border: isDone || isActive ? "none" : "1px solid var(--line-2)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {isDone ? Icon.check(14) : (i + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em" }}>
                      {s.phase}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
                      {s.items.length} itens · {s.duration}
                    </div>
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      letterSpacing: "0.08em",
                      marginTop: 6,
                    }}
                  >
                    {isActive ? "em curso" : isDone ? "concluído" : "aguardando"}
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 1px 0 rgba(15,61,46,0.04), 0 30px 60px -30px rgba(15,61,46,0.18)",
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fbfaf6",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                Dossiê em construção
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>
                {doneCount}/{totalItems}
              </div>
            </div>

            <div style={{ padding: 22, display: "grid", gap: 22 }}>
              {steps.map((s, pi) => (
                <div key={s.phase}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        letterSpacing: "0.14em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.phase}
                    </div>
                    <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {s.items.map((it, ii) => {
                      const isChecked = !!checked[`${pi}-${ii}`]
                      return (
                        <div
                          key={it}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "9px 12px",
                            background: isChecked ? "rgba(15,61,46,0.04)" : "transparent",
                            border: `1px solid ${
                              isChecked ? "rgba(15,61,46,0.12)" : "var(--line)"
                            }`,
                            borderRadius: 8,
                            transition: "all .3s",
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              background: isChecked ? "var(--green)" : "transparent",
                              border: `1px solid ${
                                isChecked ? "var(--green)" : "var(--line-2)"
                              }`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              flexShrink: 0,
                              transition: "all .3s",
                            }}
                          >
                            {isChecked && Icon.check(12)}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              color: isChecked ? "var(--ink)" : "var(--muted)",
                              flex: 1,
                              transition: "color .3s",
                            }}
                          >
                            {it}
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: 10.5,
                              color: "var(--muted)",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {isChecked ? "OK" : "—"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "14px 22px",
                borderTop: "1px solid var(--line)",
                background: "#fbfaf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                AgroBridge · documento 01 de 01
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: doneCount === totalItems ? "var(--green)" : "var(--muted)",
                }}
              >
                {doneCount === totalItems ? (
                  <>
                    {Icon.check(12)} pronto para o banco
                  </>
                ) : (
                  "gerando…"
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){ .landing-how-grid{ grid-template-columns: 1fr !important } }
      `}</style>
    </section>
  )
}
