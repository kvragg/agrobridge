"use client"

import { useMemo, useState } from "react"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import { simular } from "@/lib/simulator/engine"
import { CULTURAS } from "@/lib/simulator/data/culturas"
import { GARANTIAS } from "@/lib/simulator/data/garantias"
import { CADASTRO_NIVEIS } from "@/lib/simulator/data/cadastro-niveis"
import { CONJUNTURA_ATUAL } from "@/lib/simulator/data/conjuntura"
import type {
  Faixa,
  SimulatorInput,
  SimulatorResult,
} from "@/lib/simulator/types"
import { SimuladorRadar } from "./SimuladorRadar"

const FAIXA_LABEL: Record<Faixa, string> = {
  muito_baixa: "Muito baixa",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  muito_alta: "Muito alta",
}

function inputBase(): SimulatorInput {
  return {
    valor_pretendido: 850_000,
    cultura: "soja",
    finalidade: "custeio",
    porte: "medio",
    uf: "MT",
    garantias: ["hipoteca_1grau"],
    relacao_terra: "proprio",
    aval_tipo: "nenhum",
    cadastro_nivel: "atualizado_incompleto",
    historico_scr: "limpo",
    endividamento_pct: 35,
    car: "regular_averbado",
    tem_seguro_agricola: true,
    reciprocidade_bancaria: "media",
    cpf_cnpj_regular: true,
    imovel_em_inventario: false,
    arrendamento_com_anuencia: true,
    georref_ok: true,
    itr_em_dia: true,
    ir_em_dia: true,
  }
}

interface Cenario {
  id: string
  rotulo: string
  input: SimulatorInput
}

export function ComparadorClient() {
  const [cenarios, setCenarios] = useState<Cenario[]>([
    { id: "a", rotulo: "Cenário A", input: inputBase() },
    {
      id: "b",
      rotulo: "Cenário B",
      input: {
        ...inputBase(),
        cadastro_nivel: "padrao_agrobridge",
        garantias: ["alienacao_fiduciaria_guarda_chuva"],
      },
    },
  ])

  function patch(id: string, p: Partial<SimulatorInput>) {
    setCenarios((cs) =>
      cs.map((c) => (c.id === id ? { ...c, input: { ...c.input, ...p } } : c)),
    )
  }

  function remover(id: string) {
    setCenarios((cs) => cs.filter((c) => c.id !== id))
  }

  function adicionar() {
    if (cenarios.length >= 3) return
    const novoId = String.fromCharCode(97 + cenarios.length) // c, d…
    setCenarios((cs) => [
      ...cs,
      {
        id: novoId,
        rotulo: `Cenário ${novoId.toUpperCase()}`,
        input: inputBase(),
      },
    ])
  }

  // Resultados memoizados
  const resultados: Record<string, SimulatorResult> = useMemo(() => {
    const out: Record<string, SimulatorResult> = {}
    for (const c of cenarios) {
      out[c.id] = simular(c.input, CONJUNTURA_ATUAL)
    }
    return out
  }, [cenarios])

  function divergente(campo: keyof SimulatorInput): boolean {
    if (cenarios.length < 2) return false
    const v0 = JSON.stringify(cenarios[0].input[campo])
    return cenarios.slice(1).some((c) => JSON.stringify(c.input[campo]) !== v0)
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Eyebrow>Comparador de cenários</Eyebrow>
          <h1
            style={{
              margin: "12px 0 4px",
              fontSize: "clamp(26px, 3.4vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "#fff",
            }}
          >
            Lado a lado, até 3 cenários.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            Diferenças destacadas em <span style={{ color: "var(--gold)" }}>dourado</span>.
          </p>
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={adicionar}
          disabled={cenarios.length >= 3}
        >
          + Adicionar cenário
        </Button>
      </div>

      <div
        className="comp-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cenarios.length}, minmax(0, 1fr))`,
          gap: 16,
        }}
      >
        {cenarios.map((c) => {
          const r = resultados[c.id]
          return (
            <CenarioCard
              key={c.id}
              cenario={c}
              resultado={r}
              divergente={divergente}
              patch={(p) => patch(c.id, p)}
              remover={cenarios.length > 1 ? () => remover(c.id) : undefined}
            />
          )
        })}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .comp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function CenarioCard({
  cenario,
  resultado,
  divergente,
  patch,
  remover,
}: {
  cenario: Cenario
  resultado: SimulatorResult
  divergente: (campo: keyof SimulatorInput) => boolean
  patch: (p: Partial<SimulatorInput>) => void
  remover?: () => void
}) {
  const cor =
    resultado.faixa === "muito_alta" || resultado.faixa === "alta"
      ? "var(--green)"
      : resultado.faixa === "media"
      ? "var(--gold)"
      : "var(--danger)"

  const div = (campo: keyof SimulatorInput) =>
    divergente(campo)
      ? {
          background: "rgba(201,168,106,0.10)",
          border: "1px solid rgba(201,168,106,0.30)",
        }
      : {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--line-2)",
        }

  return (
    <GlassCard glow="green" padding={22} hover={false}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: cor,
          }}
        >
          {cenario.rotulo}
        </div>
        {remover && (
          <button
            type="button"
            onClick={remover}
            aria-label="Remover cenário"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            {Icon.x(14)}
          </button>
        )}
      </div>

      {/* Score grande */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: cor,
          }}
        >
          {resultado.score}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          / 100
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>
        {FAIXA_LABEL[resultado.faixa]}
      </div>

      {/* Mini radar */}
      <div style={{ marginTop: 14 }}>
        <SimuladorRadar data={resultado.radar} />
      </div>

      {/* Mini-form com diferenças destacadas */}
      <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
        <Mini
          label="Cultura"
          style={div("cultura")}
          options={CULTURAS.slice(0, 8).map((c) => ({
            value: c.id,
            label: c.nome,
          }))}
          value={cenario.input.cultura}
          onChange={(v) =>
            patch({ cultura: v as SimulatorInput["cultura"] })
          }
        />
        <Mini
          label={`Valor · R$ ${cenario.input.valor_pretendido.toLocaleString("pt-BR")}`}
          style={div("valor_pretendido")}
        >
          <input
            type="range"
            min={50_000}
            max={5_000_000}
            step={50_000}
            value={cenario.input.valor_pretendido}
            onChange={(e) =>
              patch({ valor_pretendido: +e.target.value })
            }
            style={{ width: "100%", accentColor: "var(--green)" }}
          />
        </Mini>
        <Mini
          label="Cadastro"
          style={div("cadastro_nivel")}
          options={CADASTRO_NIVEIS.map((n) => ({
            value: n.id,
            label: n.nome,
          }))}
          value={cenario.input.cadastro_nivel}
          onChange={(v) =>
            patch({ cadastro_nivel: v as SimulatorInput["cadastro_nivel"] })
          }
        />
        <Mini
          label={`Garantias (${cenario.input.garantias.length})`}
          style={div("relacao_terra")}
        >
          <select
            multiple
            value={cenario.input.garantias as string[]}
            onChange={(e) => {
              const sel = Array.from(e.target.selectedOptions).map(
                (o) => o.value,
              )
              patch({
                garantias: sel as SimulatorInput["garantias"],
              })
            }}
            style={{
              width: "100%",
              minHeight: 80,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              color: "var(--ink)",
              fontSize: 11.5,
              fontFamily: "inherit",
              padding: 6,
              outline: "none",
            }}
          >
            {GARANTIAS.map((g) => (
              <option
                key={g.id}
                value={g.id}
                style={{ background: "#0b0d0f" }}
              >
                {g.nome.slice(0, 40)} ({g.delta > 0 ? "+" : ""}
                {g.delta})
              </option>
            ))}
          </select>
        </Mini>
        <Mini
          label="Histórico SCR"
          style={div("historico_scr")}
          options={[
            { value: "limpo", label: "Limpo" },
            { value: "primeira_operacao", label: "1ª operação" },
            { value: "restricao_encerrada", label: "Restrição encerrada" },
            { value: "com_restricao_ativa", label: "Restrição ATIVA" },
          ]}
          value={cenario.input.historico_scr}
          onChange={(v) =>
            patch({ historico_scr: v as SimulatorInput["historico_scr"] })
          }
        />
      </div>

      {/* Linha MCR */}
      {resultado.linha_mcr_provavel && (
        <div
          className="mono"
          style={{
            marginTop: 14,
            fontSize: 10.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {resultado.linha_mcr_provavel}
        </div>
      )}
    </GlassCard>
  )
}

function Mini({
  label,
  children,
  options,
  value,
  onChange,
  style,
}: {
  label: string
  children?: React.ReactNode
  options?: { value: string; label: string }[]
  value?: string
  onChange?: (v: string) => void
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        ...style,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children ?? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            width: "100%",
            height: 32,
            padding: "0 8px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line-2)",
            borderRadius: 6,
            color: "var(--ink)",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {options?.map((o) => (
            <option
              key={o.value}
              value={o.value}
              style={{ background: "#0b0d0f" }}
            >
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
