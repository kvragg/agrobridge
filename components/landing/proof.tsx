"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  Container,
  SectionLabel,
  Eyebrow,
  Button,
  Icon,
  GlassCard,
  useReveal,
} from "./primitives"

const STATS = [
  { k: "Projetos instruídos", v: "em piloto", tag: "placeholder honesto" },
  { k: "Domínio do MCR", v: "Cap. 1–16", tag: "técnico" },
  { k: "Tempo médio de dossiê", v: "3–5 dias", tag: "previsão atual" },
  { k: "Custo para você", v: "R$ 0 até aprovar", tag: "sem mensalidade" },
]

const GARANTIAS = ["Hipoteca rural", "Penhor da safra", "Aval"] as const
const CULTURAS = ["Soja", "Milho", "Café", "Pecuária"] as const

type Garantia = (typeof GARANTIAS)[number]
type Cultura = (typeof CULTURAS)[number]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.18em",
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
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        gap: 4,
        padding: 4,
        background: "rgba(0,0,0,0.35)",
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
              fontSize: 12.5,
              background: active
                ? "rgba(78,168,132,0.22)"
                : "transparent",
              color: active ? "#fff" : "var(--muted)",
              border: active
                ? "1px solid rgba(78,168,132,0.4)"
                : "1px solid transparent",
              fontFamily: "Geist",
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
        color: ok ? "var(--ink)" : "var(--muted)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: ok ? "rgba(78,168,132,0.18)" : "rgba(212,113,88,0.12)",
          color: ok ? "var(--green)" : "var(--danger)",
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

export function Proof() {
  useReveal()
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
    score >= 75
      ? "Alta probabilidade"
      : score >= 55
      ? "Probabilidade média"
      : "Requer ajustes"
  const statusColor =
    score >= 75
      ? "var(--green)"
      : score >= 55
      ? "var(--gold)"
      : "var(--danger)"

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
            "radial-gradient(40% 60% at 85% 30%, rgba(78,168,132,0.08), transparent 60%)",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionLabel num="05" label="Prova e credibilidade" />

        <div
          className="stat-strip"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 56,
          }}
        >
          {STATS.map((s, i) => (
            <GlassCard
              key={i}
              glow={i === 3 ? "gold" : "none"}
              padding={24}
              className={`reveal reveal-d${i + 1}`}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {s.k}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  color: "#fff",
                }}
              >
                {s.v}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--faint)",
                  marginTop: 12,
                  letterSpacing: "0.08em",
                }}
              >
                [ {s.tag} ]
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard glow="green" padding={0} hover={false} className="reveal">
          <div
            className="sim-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
          >
            <div
              className="sim-left"
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
                  color: "#fff",
                }}
              >
                Dá pra ter uma leitura antes de começar.
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: 380,
                }}
              >
                Não é resposta do banco — é a leitura técnica do AgroBridge,
                baseada no que o comitê olha primeiro.
              </p>

              <div style={{ marginTop: 32, display: "grid", gap: 22 }}>
                <Field
                  label={`Valor pretendido · R$ ${valor.toLocaleString(
                    "pt-BR",
                  )} mil`}
                >
                  <input
                    type="range"
                    min="100"
                    max="3000"
                    step="50"
                    value={valor}
                    onChange={(e) => setValor(+e.target.value)}
                    style={{ width: "100%", accentColor: "var(--green)" }}
                  />
                </Field>
                <Field label="Garantia principal">
                  <Segmented
                    options={GARANTIAS}
                    value={garantia}
                    onChange={setGarantia}
                  />
                </Field>
                <Field label="Cultura">
                  <Segmented
                    options={CULTURAS}
                    value={cultura}
                    onChange={setCultura}
                  />
                </Field>
              </div>
            </div>

            <div className="sim-right" style={{ padding: 40, position: "relative" }}>
              <Eyebrow color={statusColor} dot={statusColor}>
                Leitura AgroBridge
              </Eyebrow>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <div
                    style={{
                      fontSize: 96,
                      fontWeight: 500,
                      letterSpacing: "-0.045em",
                      lineHeight: 1,
                      color: "transparent",
                      background: `linear-gradient(180deg, #fff 0%, ${statusColor} 100%)`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                    }}
                  >
                    {score}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 13, color: "var(--muted)" }}
                  >
                    / 100
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: statusColor,
                    fontWeight: 500,
                    marginTop: 8,
                  }}
                >
                  {status}
                </div>
              </div>

              <div
                style={{
                  marginTop: 32,
                  height: 6,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${score}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${statusColor}, ${
                      statusColor === "var(--green)" ? "var(--gold)" : statusColor
                    })`,
                    boxShadow: `0 0 14px ${statusColor}`,
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
                <Button variant="accent" size="md" href="/cadastro">
                  Continuar com meu caso real {Icon.arrow(14)}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </Container>

      <style>{`
        @media (max-width: 1020px){
          .stat-strip{ grid-template-columns: repeat(2, 1fr) !important }
          .sim-grid{ grid-template-columns: 1fr !important }
          .sim-left{ border-right: none !important; border-bottom: 1px solid var(--line) }
        }
        @media (max-width: 560px){
          .stat-strip{ grid-template-columns: 1fr !important }
        }
      `}</style>
    </section>
  )
}
