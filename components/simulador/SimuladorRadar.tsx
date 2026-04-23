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

export function SimuladorRadar({ data }: { data: RadarEixo[] }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.10)" />
          <PolarAngleAxis
            dataKey="eixo"
            tick={{
              fill: "var(--ink-2)",
              fontSize: 11.5,
              fontFamily: "var(--font-sans), Geist, sans-serif",
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="valor"
            stroke="#5cbd95"
            fill="rgba(78,168,132,0.30)"
            strokeWidth={1.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
