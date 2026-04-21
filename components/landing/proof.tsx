"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Container, SectionLabel, Eyebrow, Button, Icon } from "./primitives"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 6,
        padding: 4,
        background: "var(--bg-2)",
        borderRadius: 999,
        border: "1px solid var(--line)",
      }}
    >
      {options.map((o) => {
        const active = o === value
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 13,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "#fff" : "var(--ink-2)",
              transition: "all .2s",
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function ReadRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 14,
        color: ok ? "var(--ink-2)" : "var(--muted)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: ok ? "rgba(26,106,79,0.12)" : "rgba(178,74,58,0.1)",
          color: ok ? "var(--green-3)" : "var(--danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {ok ? Icon.check(12) : Icon.x(10)}
      </div>
      {label}
    </div>
  )
}

type Garantia = "Hipoteca rural" | "Penhor da safra" | "Aval"
type Cultura = "Soja" | "Milho" | "Café" | "Pecuária"

export function Proof() {
  const [valor, setValor] = useState(850)
  const [garantia, setGarantia] = useState<Garantia>("Hipoteca rural")
  const [cultura, setCultura] = useState<Cultura>("Soja")

  const score = useMemo(() => {
    let s = 60
    if (valor > 2000) s -= 15
    if (valor < 500) s += 10
    if (garantia === "Hipoteca rural") s += 18
    if (garantia === "Aval") s -= 10
    if (cultura === "Soja" || cultura === "Milho") s += 12
    return Math.max(35, Math.min(94, s))
  }, [valor, garantia, cultura])

  const status =
    score >= 75 ? "Alta probabilidade" : score >= 55 ? "Probabilidade média" : "Requer ajustes"
  const statusColor =
    score >= 75 ? "var(--green-3)" : score >= 55 ? "#8a6d2a" : "var(--danger)"

  const stats = [
    { k: "Autoridade", v: "14 anos no SFN", tag: "fundador · ex-banco privado" },
    { k: "Domínio do MCR", v: "Capítulos 1–16", tag: "técnico" },
    { k: "Tempo médio de dossiê", v: "3–5 dias", tag: "previsão atual" },
    { k: "Entrega", v: "100% digital", tag: "pagamento único" },
  ]

  return (
    <section style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}>
      <Container>
        <SectionLabel num="05" label="Prova e credibilidade" />

        <div
          className="landing-stat-strip"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1px solid var(--line-2)",
            borderRadius: 14,
            overflow: "hidden",
            background: "#fff",
            marginBottom: 64,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.k}
              className="landing-stat-cell"
              style={{
                padding: "32px 28px",
                borderRight: i < 3 ? "1px solid var(--line)" : "none",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                {s.v}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--muted)",
                  marginTop: 10,
                  letterSpacing: "0.04em",
                }}
              >
                [ {s.tag} ]
              </div>
            </div>
          ))}
        </div>

        <div
          className="landing-sim-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            border: "1px solid var(--line-2)",
            borderRadius: 16,
            overflow: "hidden",
            background: "linear-gradient(180deg, #fff 0%, #fbfaf6 100%)",
          }}
        >
          <div
            className="landing-sim-left"
            style={{ padding: 40, borderRight: "1px solid var(--line)" }}
          >
            <Eyebrow>Simulação preliminar</Eyebrow>
            <h3
              style={{
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                margin: "16px 0 8px",
                lineHeight: 1.15,
              }}
            >
              Dá pra ter uma leitura antes de começar.
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 14.5,
                lineHeight: 1.55,
                margin: 0,
                maxWidth: 380,
              }}
            >
              Não é resposta do banco — é a leitura técnica do AgroBridge, baseada no que o comitê
              olha primeiro.
            </p>

            <div style={{ marginTop: 32, display: "grid", gap: 22 }}>
              <Field label={`Valor pretendido · R$ ${valor.toLocaleString("pt-BR")} mil`}>
                <input
                  type="range"
                  min={100}
                  max={3000}
                  step={50}
                  value={valor}
                  onChange={(e) => setValor(+e.target.value)}
                  style={{ width: "100%" }}
                />
              </Field>
              <Field label="Garantia principal">
                <Segmented
                  options={["Hipoteca rural", "Penhor da safra", "Aval"]}
                  value={garantia}
                  onChange={setGarantia}
                />
              </Field>
              <Field label="Cultura">
                <Segmented
                  options={["Soja", "Milho", "Café", "Pecuária"]}
                  value={cultura}
                  onChange={setCultura}
                />
              </Field>
            </div>
          </div>

          <div style={{ padding: 40, position: "relative" }}>
            <Eyebrow color={statusColor}>Leitura AgroBridge</Eyebrow>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div
                  style={{
                    fontSize: 88,
                    fontWeight: 500,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    color: "var(--ink)",
                  }}
                >
                  {score}
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                  / 100
                </div>
              </div>
              <div style={{ fontSize: 18, color: statusColor, fontWeight: 500, marginTop: 8 }}>
                {status}
              </div>
            </div>

            <div
              style={{
                marginTop: 32,
                height: 6,
                background: "var(--bg-2)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",
                  background: statusColor,
                  transition: "all .35s",
                }}
              />
            </div>

            <div style={{ marginTop: 28, display: "grid", gap: 10 }}>
              <ReadRow
                ok={garantia === "Hipoteca rural"}
                label="Garantia compatível com comitê"
              />
              <ReadRow
                ok={cultura === "Soja" || cultura === "Milho"}
                label="Cultura alinhada ao MCR"
              />
              <ReadRow ok={valor <= 2000} label="Valor dentro do teto da linha" />
              <ReadRow ok={true} label="Perfil elegível para análise completa" />
            </div>

            <div style={{ marginTop: 32 }}>
              <Button variant="primary" size="md" href="/cadastro">
                Iniciar diagnóstico gratuito {Icon.arrow(14)}
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 900px){
          .landing-stat-strip{ grid-template-columns: 1fr 1fr !important }
          .landing-stat-cell:nth-child(2){ border-right: none !important }
          .landing-stat-cell:nth-child(1), .landing-stat-cell:nth-child(2){ border-bottom: 1px solid var(--line) }
          .landing-sim-grid{ grid-template-columns: 1fr !important }
          .landing-sim-left{ border-right: none !important; border-bottom: 1px solid var(--line) }
        }
      `}</style>
    </section>
  )
}
