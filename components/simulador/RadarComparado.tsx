"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"
import type { RadarEixo } from "@/lib/simulator/types"

export interface SerieRadar {
  /** Identificador estável (ex: 'a', 'b', 'c'). */
  id: string
  /** Rótulo curto exibido na legenda. */
  rotulo: string
  /** Cor hex/var (#5cbd95, #c9a86a, #6e8aa8). */
  cor: string
  /** 6 eixos de score (Garantia, Cultura, Cadastro, Histórico, Capacidade, Documentação). */
  eixos: RadarEixo[]
}

interface Props {
  /** Até 3 séries sobrepostas com transparência. */
  series: SerieRadar[]
  /** Altura do gráfico em px. Default 320. */
  altura?: number
}

/**
 * Radar sobreposto pra comparar até 3 cenários. Cada série recebe
 * fillOpacity 0.18 pra que sobreposições continuem legíveis. Cores
 * distintas (verde, dourado, azul) já são dadas pelo caller.
 *
 * Os 6 eixos vêm dos próprios resultados — recharts pivota internamente.
 */
export function RadarComparado({ series, altura = 320 }: Props) {
  if (series.length === 0) return null

  // Recharts precisa de um único array de objetos com chaves dinâmicas
  // por série. Pivot: { eixo, [serie.id]: valor }.
  const eixos = series[0].eixos.map((e) => e.eixo)
  const data = eixos.map((nomeEixo) => {
    const linha: Record<string, string | number> = { eixo: nomeEixo }
    for (const s of series) {
      const v = s.eixos.find((e) => e.eixo === nomeEixo)?.valor ?? 0
      linha[s.id] = v
    }
    return linha
  })

  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: "100%", height: altura }}>
        <ResponsiveContainer>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
            <PolarGrid stroke="rgba(255,255,255,0.10)" />
            <PolarAngleAxis
              dataKey="eixo"
              tick={{
                fill: "var(--ink-2)",
                fontSize: 12,
                fontFamily: "var(--font-sans), Geist, sans-serif",
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            {series.map((s) => (
              <Radar
                key={s.id}
                name={s.rotulo}
                dataKey={s.id}
                stroke={s.cor}
                fill={s.cor}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda manual — recharts default fica feia */}
      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        {series.map((s) => (
          <div
            key={s.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--ink-2)",
              letterSpacing: "-0.005em",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.cor,
                boxShadow: `0 0 8px ${s.cor}`,
              }}
            />
            {s.rotulo}
          </div>
        ))}
      </div>
    </div>
  )
}
