"use client"

import { useEffect, useState } from "react"
import {
  Container,
  SectionLabel,
  Icon,
  GlassCard,
  useReveal,
} from "./primitives"

type Phase = {
  phase: string
  duration: string
  items: string[]
}

const STEPS: Phase[] = [
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
      "ITR do último exercício",
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
  useReveal()
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const printMode =
    typeof window !== "undefined" && window.location.search.includes("print")

  useEffect(() => {
    if (printMode) {
      queueMicrotask(() => {
        const all: Record<string, boolean> = {}
        STEPS.forEach((s, pi) =>
          s.items.forEach((_, ii) => {
            all[`${pi}-${ii}`] = true
          }),
        )
        setChecked(all)
        setActive(STEPS.length - 1)
      })
      return
    }
    let phase = 0
    let item = 0
    let timer: ReturnType<typeof setTimeout>
    const schedule = (ms: number, fn: () => void) => {
      timer = setTimeout(fn, ms)
    }
    const tick = () => {
      setChecked((prev) => ({ ...prev, [`${phase}-${item}`]: true }))
      item += 1
      if (item >= STEPS[phase].items.length) {
        item = 0
        phase += 1
        if (phase >= STEPS.length) {
          schedule(2000, () => {
            phase = 0
            item = 0
            setChecked({})
            setActive(0)
            schedule(600, tick)
          })
          return
        }
        setActive(phase)
      }
      schedule(700, tick)
    }
    schedule(500, tick)
    return () => clearTimeout(timer)
  }, [printMode])

  const totalItems = STEPS.reduce((a, s) => a + s.items.length, 0)
  const doneCount = Object.keys(checked).filter((k) => checked[k]).length

  return (
    <section
      id="fluxo"
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
            "radial-gradient(60% 50% at 70% 40%, rgba(78,168,132,0.1), transparent 60%)",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionLabel num="04" label="Como funciona" />
        <div className="reveal" style={{ maxWidth: 760, marginBottom: 56 }}>
          <h2
            style={{
              fontSize: "clamp(36px, 4.8vw, 60px)",
              lineHeight: 1.0,
              letterSpacing: "-0.035em",
              fontWeight: 500,
              margin: 0,
              textWrap: "balance",
              color: "#fff",
            }}
          >
            Seu dossiê sendo montado,
            <br />
            <span style={{ color: "var(--muted)" }}>item por item.</span>
          </h2>
        </div>

        <div
          className="how-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <GlassCard
            glow="none"
            padding={0}
            hover={false}
            className="reveal"
          >
            {STEPS.map((s, i) => {
              const isActive = i === active
              const isDone = i < active
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr auto",
                    padding: "22px 24px",
                    gap: 16,
                    alignItems: "center",
                    borderBottom:
                      i < STEPS.length - 1 ? "1px solid var(--line)" : "none",
                    opacity: isActive || isDone ? 1 : 0.55,
                    transition: "opacity .3s, background .3s",
                    background: isActive
                      ? "rgba(78,168,132,0.05)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isDone
                        ? "linear-gradient(180deg,#5cbd95,#2f7a5c)"
                        : isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                      border: isDone ? "none" : "1px solid var(--line-2)",
                      color: isDone ? "#07120d" : "var(--ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Geist Mono",
                      fontSize: 11,
                      boxShadow: isDone
                        ? "0 0 18px rgba(78,168,132,0.4)"
                        : "none",
                    }}
                  >
                    {isDone ? Icon.check(14) : (i + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: "#fff",
                      }}
                    >
                      {s.phase}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: "var(--muted)",
                        marginTop: 3,
                      }}
                    >
                      {s.items.length} itens · {s.duration}
                    </div>
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: isActive ? "var(--green)" : "var(--muted)",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {isActive
                      ? "em curso"
                      : isDone
                      ? "concluído"
                      : "aguardando"}
                  </div>
                </div>
              )
            })}
          </GlassCard>

          <GlassCard
            glow="green"
            padding={0}
            hover={false}
            className="reveal reveal-d1"
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                Dossiê em construção
              </div>
              <div
                className="mono"
                style={{ fontSize: 12, color: "var(--ink)" }}
              >
                {doneCount}/{totalItems}
              </div>
            </div>

            <div style={{ padding: 22, display: "grid", gap: 20 }}>
              {STEPS.map((s, pi) => (
                <div key={pi}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        letterSpacing: "0.18em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.phase}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "var(--line)",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {s.items.map((it, ii) => {
                      const isChecked = !!checked[`${pi}-${ii}`]
                      return (
                        <div
                          key={ii}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "9px 12px",
                            background: isChecked
                              ? "rgba(78,168,132,0.08)"
                              : "rgba(255,255,255,0.02)",
                            border:
                              "1px solid " +
                              (isChecked
                                ? "rgba(78,168,132,0.22)"
                                : "var(--line)"),
                            borderRadius: 8,
                            transition: "all .3s",
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              background: isChecked
                                ? "linear-gradient(180deg,#5cbd95,#2f7a5c)"
                                : "transparent",
                              border:
                                "1px solid " +
                                (isChecked ? "transparent" : "var(--line-2)"),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#07120d",
                              flexShrink: 0,
                              transition: "all .3s",
                            }}
                          >
                            {isChecked && Icon.check(12)}
                          </div>
                          <div
                            style={{
                              fontSize: 13.5,
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
                              color: isChecked ? "var(--green)" : "var(--faint)",
                              letterSpacing: "0.1em",
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
                background: "rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                AgroBridge · documento 01 de 01
              </div>
              <div
                style={{
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color:
                    doneCount === totalItems
                      ? "var(--green)"
                      : "var(--muted)",
                  fontFamily: "Geist Mono",
                }}
              >
                {doneCount === totalItems ? (
                  <>
                    {Icon.check(12)} pronto para o banco
                  </>
                ) : (
                  <>gerando…</>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </Container>

      <style>{`
        @media (max-width: 1020px){ .how-grid{ grid-template-columns: 1fr !important } }
      `}</style>
    </section>
  )
}
