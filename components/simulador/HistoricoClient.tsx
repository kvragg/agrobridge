"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import { Alert } from "@/components/shell/Alert"
import { CULTURAS } from "@/lib/simulator/data/culturas"
import type { CulturaId } from "@/lib/simulator/data/culturas"

interface SimulacaoSalva {
  id: string
  score: number
  cultura: string
  valor_pretendido: number
  created_at: string
}

export function HistoricoClient() {
  const [items, setItems] = useState<SimulacaoSalva[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroCultura, setFiltroCultura] = useState<string>("")

  async function carregar() {
    setCarregando(true)
    try {
      const url = filtroCultura
        ? `/api/simulador/historico?cultura=${encodeURIComponent(filtroCultura)}`
        : "/api/simulador/historico"
      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as { simulacoes: SimulacaoSalva[] }
        setItems(data.simulacoes ?? [])
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCultura])

  // Dados pro chart (ordem cronológica ascendente)
  const chartData = useMemo(
    () =>
      [...items]
        .reverse()
        .map((s) => ({
          data: new Date(s.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          score: s.score,
        })),
    [items],
  )

  const culturasUsadas = useMemo(
    () => Array.from(new Set(items.map((s) => s.cultura))),
    [items],
  )

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Eyebrow>Histórico</Eyebrow>
          <h1
            style={{
              margin: "12px 0 4px",
              fontSize: "clamp(26px, 3.4vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "#fff",
            }}
          >
            Suas simulações ao longo do tempo
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            {items.length} simulação{items.length === 1 ? "" : "ões"} salvas.
          </p>
        </div>

        {culturasUsadas.length > 1 && (
          <select
            value={filtroCultura}
            onChange={(e) => setFiltroCultura(e.target.value)}
            style={{
              height: 36,
              padding: "0 12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              borderRadius: 999,
              color: "var(--ink)",
              fontSize: 12.5,
              fontFamily: "inherit",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#0b0d0f" }}>
              Todas as culturas
            </option>
            {culturasUsadas.map((c) => {
              const culturaObj = CULTURAS.find((x) => x.id === (c as CulturaId))
              return (
                <option
                  key={c}
                  value={c}
                  style={{ background: "#0b0d0f" }}
                >
                  {culturaObj?.nome ?? c}
                </option>
              )
            })}
          </select>
        )}
      </div>

      {carregando && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          {Icon.spinner(16)} Carregando…
        </div>
      )}

      {!carregando && items.length === 0 && (
        <Alert variant="info">
          Você ainda não salvou nenhuma simulação.{" "}
          <a
            href="/simulador"
            style={{ color: "var(--green)", textDecoration: "underline" }}
          >
            Faça uma agora
          </a>
          .
        </Alert>
      )}

      {!carregando && items.length > 0 && (
        <>
          {/* Chart de evolução */}
          {chartData.length >= 2 && (
            <GlassCard
              glow="green"
              padding={24}
              hover={false}
              style={{ marginBottom: 22 }}
            >
              <Eyebrow>Evolução do score</Eyebrow>
              <div style={{ width: "100%", height: 220, marginTop: 14 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="data"
                      stroke="var(--muted)"
                      style={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--muted)"
                      style={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(11,13,15,0.95)",
                        border: "1px solid var(--line-2)",
                        borderRadius: 8,
                        color: "var(--ink)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#5cbd95"
                      strokeWidth={2}
                      dot={{ fill: "#5cbd95", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {/* Lista cronológica */}
          <GlassCard glow="none" padding={0} hover={false}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {["Data", "Cultura", "Valor", "Score"].map((th) => (
                    <th
                      key={th}
                      className="mono"
                      style={{
                        padding: "12px 18px",
                        textAlign: "left",
                        fontSize: 10.5,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s, i) => {
                  const cultura = CULTURAS.find(
                    (c) => c.id === (s.cultura as CulturaId),
                  )
                  const cor =
                    s.score >= 85
                      ? "var(--green)"
                      : s.score >= 50
                      ? "var(--gold)"
                      : "var(--danger)"
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderTop:
                          i === 0 ? "none" : "1px solid var(--line)",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "var(--ink-2)",
                        }}
                      >
                        {new Date(s.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "var(--ink)",
                          fontWeight: 500,
                        }}
                      >
                        {cultura?.nome ?? s.cultura}
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "var(--ink-2)",
                        }}
                      >
                        R${" "}
                        {s.valor_pretendido.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          color: cor,
                          fontWeight: 500,
                          fontSize: 16,
                        }}
                      >
                        {s.score}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </GlassCard>
        </>
      )}
    </div>
  )
}
