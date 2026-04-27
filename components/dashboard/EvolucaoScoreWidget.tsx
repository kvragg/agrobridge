"use client"

// v1.1 — Frente B: Histórico evolutivo do simulador
//
// Mostra ao lead o quanto seu score subiu (ou caiu) ao longo do tempo,
// com sparkline. Reaproveita dado já existente em `simulacoes` — zero
// schema novo. Razão: lead pago precisa de motivo pra voltar mesmo
// sem pleito ativo. Score evoluindo é gamificação real.
//
// Comportamentos:
// - 0 simulações → não renderiza (chamador esconde)
// - 1 simulação → mostra só score atual sem delta nem sparkline
// - 2+ simulações → score atual + delta vs primeira do período + sparkline
//
// Cor segue mesma régua do simulador (≥80 verde, 51-79 amarelo, ≤50
// vermelho) pra coerência visual.

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts"
import { Eyebrow, GlassCard, Icon } from "@/components/landing/primitives"

interface SimulacaoPonto {
  score: number
  cultura: string
  valor_pretendido: number
  created_at: string
}

// Hex puro — `var(--*)` em `linear-gradient` + `background-clip: text`
// não renderiza confiável (texto fica invisível). Mesma régua do
// simulador pra coerência cross-componente.
function corDoScore(score: number): string {
  if (score >= 80) return "#4ea884"
  if (score >= 51) return "#facc15"
  return "#d47158"
}

function diasAtras(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)))
}

export function EvolucaoScoreWidget({
  historico,
}: {
  historico: SimulacaoPonto[]
}) {
  if (historico.length === 0) return null

  // Histórico vem do server ordenado por created_at DESC (mais recente
  // primeiro). Pra renderizar sparkline precisa ASC.
  const cronologico = [...historico].reverse()
  const atual = cronologico[cronologico.length - 1]
  const primeira = cronologico[0]
  const delta = atual.score - primeira.score
  const diasJanela = diasAtras(primeira.created_at)
  const cor = corDoScore(atual.score)

  // Faixa qualitativa pra contextualizar
  const faixaTxt =
    atual.score >= 85
      ? "muito alta"
      : atual.score >= 70
        ? "alta"
        : atual.score >= 50
          ? "média"
          : atual.score >= 30
            ? "baixa"
            : "muito baixa"

  const temDelta = historico.length >= 2 && delta !== 0
  const deltaTxt = delta > 0 ? `+${delta}` : `${delta}` // negativo já vem com '-'
  const corDelta = delta > 0 ? "var(--green)" : delta < 0 ? "var(--danger)" : "var(--muted)"

  // Domínio do gráfico — sempre 0..100 pra a linha não enganar visualmente
  const dadosSparkline = cronologico.map((p, i) => ({ idx: i, score: p.score }))

  return (
    <GlassCard glow="green" padding={24} hover={false}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
          alignItems: "center",
        }}
      >
        {/* Coluna esquerda: score atual */}
        <div style={{ minWidth: 140 }}>
          <Eyebrow>Sua nota AgroBridge</Eyebrow>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 500,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                // Cor sólida — gradient-text (`background-clip: text`) é
                // bugado em vários browsers (renderiza retângulo sólido
                // em vez de aplicar clip pelo texto). Mesma decisão do
                // SimuladorClient pra coerência.
                color: cor,
                textShadow: `0 0 16px ${cor}33`,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {atual.score}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              / 100
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              color: cor,
              fontWeight: 500,
              marginTop: 4,
              textTransform: "capitalize",
            }}
          >
            {faixaTxt}
          </div>
          {temDelta && (
            <div
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontFamily: "var(--font-mono, ui-monospace)",
                letterSpacing: "0.08em",
                color: corDelta,
                padding: "4px 10px",
                borderRadius: 999,
                background: `color-mix(in srgb, ${corDelta} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${corDelta} 28%, transparent)`,
              }}
            >
              <span aria-hidden>{delta > 0 ? "↑" : "↓"}</span>
              <span>{deltaTxt} pontos · {diasJanela}d</span>
            </div>
          )}
        </div>

        {/* Coluna direita: sparkline + texto */}
        <div style={{ minWidth: 0 }}>
          {historico.length >= 2 ? (
            <div style={{ height: 80, marginBottom: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosSparkline}>
                  <YAxis domain={[0, 100]} hide />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={cor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: cor, strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-2)",
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              Você fez sua primeira simulação. Volte aqui depois de ajustar
              cadastro/garantia/seguro pra ver sua nota subir ao longo do tempo.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              {historico.length} simulação{historico.length === 1 ? "" : "ões"} · {atual.cultura.replace(/_/g, " ")}
            </div>
            <a
              href="/simulador/historico"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--green)",
                textDecoration: "none",
                fontFamily: "inherit",
              }}
            >
              Ver evolução completa {Icon.arrow(11)}
            </a>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
