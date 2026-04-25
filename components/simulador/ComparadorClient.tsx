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
import { RadarComparado, type SerieRadar } from "./RadarComparado"

const FAIXA_LABEL: Record<Faixa, string> = {
  muito_baixa: "Muito baixa",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  muito_alta: "Muito alta",
}

// Cores estáveis por posição — cenário A sempre verde, B dourado, C azul.
const CORES_CENARIO = ["#5cbd95", "#c9a86a", "#6e8aa8"] as const

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

// Atributos exibidos na tabela de diff (ordem importa — visual de leitura).
const ATRIBUTOS_DIFF: ReadonlyArray<{
  campo: keyof SimulatorInput
  rotulo: string
  formatar: (v: SimulatorInput) => string
}> = [
  {
    campo: "cultura",
    rotulo: "Cultura",
    formatar: (v) => CULTURAS.find((c) => c.id === v.cultura)?.nome ?? v.cultura,
  },
  {
    campo: "valor_pretendido",
    rotulo: "Valor pretendido",
    formatar: (v) => `R$ ${v.valor_pretendido.toLocaleString("pt-BR")}`,
  },
  {
    campo: "cadastro_nivel",
    rotulo: "Cadastro",
    formatar: (v) =>
      CADASTRO_NIVEIS.find((n) => n.id === v.cadastro_nivel)?.nome ??
      v.cadastro_nivel,
  },
  {
    campo: "garantias",
    rotulo: "Garantias",
    formatar: (v) =>
      v.garantias.length === 0
        ? "Nenhuma"
        : v.garantias
            .map((g) => GARANTIAS.find((x) => x.id === g)?.nome ?? g)
            .join(" + "),
  },
  {
    campo: "relacao_terra",
    rotulo: "Estrutura fundiária",
    formatar: (v) =>
      ({
        proprio: "Própria",
        misto_proprio_arrendado: "Mista (próprio + arrendado)",
        maioria_arrendado: "Maioria arrendada",
        totalmente_arrendado: "100% arrendada",
      })[v.relacao_terra],
  },
  {
    campo: "historico_scr",
    rotulo: "Histórico SCR",
    formatar: (v) =>
      ({
        limpo: "Limpo",
        primeira_operacao: "Primeira operação",
        restricao_encerrada: "Restrição encerrada",
        com_restricao_ativa: "Restrição ATIVA",
      })[v.historico_scr],
  },
  {
    campo: "endividamento_pct",
    rotulo: "Endividamento",
    formatar: (v) => `${v.endividamento_pct}% da receita`,
  },
  {
    campo: "car",
    rotulo: "CAR",
    formatar: (v) =>
      ({
        regular_averbado: "Regular e averbado",
        inscrito_pendente: "Inscrito (pendente)",
        nao_tem: "Não tem",
      })[v.car],
  },
  {
    campo: "tem_seguro_agricola",
    rotulo: "Seguro agrícola",
    formatar: (v) => (v.tem_seguro_agricola ? "Sim" : "Não"),
  },
  {
    campo: "reciprocidade_bancaria",
    rotulo: "Reciprocidade bancária",
    formatar: (v) =>
      ({
        forte: "Forte",
        media: "Média",
        nenhuma: "Nenhuma",
      })[v.reciprocidade_bancaria],
  },
]

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
  const [editor, setEditor] = useState<string | null>(null)

  function patch(id: string, p: Partial<SimulatorInput>) {
    setCenarios((cs) =>
      cs.map((c) => (c.id === id ? { ...c, input: { ...c.input, ...p } } : c)),
    )
  }

  function remover(id: string) {
    setCenarios((cs) => cs.filter((c) => c.id !== id))
    if (editor === id) setEditor(null)
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

  // Séries pro radar sobreposto
  const series: SerieRadar[] = cenarios.map((c, i) => ({
    id: c.id,
    rotulo: c.rotulo,
    cor: CORES_CENARIO[i % CORES_CENARIO.length],
    eixos: resultados[c.id].radar,
  }))

  // Síntese: cenário com maior score + maior diferença
  const ordenados = [...cenarios].sort(
    (a, b) => resultados[b.id].score - resultados[a.id].score,
  )
  const vencedor = ordenados[0]
  const ultimoColocado = ordenados[ordenados.length - 1]
  const diffPontos =
    cenarios.length >= 2
      ? resultados[vencedor.id].score - resultados[ultimoColocado.id].score
      : 0

  // Atributo que mais difere — primeiro campo com divergência relevante
  const fraseDiff = computarFraseDiferencial(cenarios, resultados)

  function divergente(campo: keyof SimulatorInput): boolean {
    if (cenarios.length < 2) return false
    const v0 = JSON.stringify(cenarios[0].input[campo])
    return cenarios.slice(1).some((c) => JSON.stringify(c.input[campo]) !== v0)
  }

  return (
    <div>
      {/* Header + adicionar */}
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
            Veja qual cenário tem mais força.
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
            Até {3 - cenarios.length === 0 ? "0" : 3 - cenarios.length} cenário
            {3 - cenarios.length === 1 ? "" : "s"} a mais.
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

      {/* RESUMO EXECUTIVO no topo */}
      <GlassCard glow="green" padding={28} hover={false} style={{ marginBottom: 18 }}>
        <div
          className="comp-resumo"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cenarios.length}, minmax(0, 1fr)) auto`,
            gap: 24,
            alignItems: "center",
          }}
        >
          {cenarios.map((c, i) => {
            const r = resultados[c.id]
            const cor = CORES_CENARIO[i % CORES_CENARIO.length]
            const isVencedor = c.id === vencedor.id && cenarios.length > 1
            return (
              <div key={c.id} style={{ position: "relative" }}>
                <div
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: cor,
                    marginBottom: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: cor,
                      boxShadow: `0 0 8px ${cor}`,
                    }}
                  />
                  {c.rotulo}
                  {isVencedor && (
                    <span
                      title="Pontuação mais alta"
                      style={{ marginLeft: 6, color: "var(--gold)" }}
                    >
                      ★
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 500,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: cor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.score}
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                    / 100
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>
                  {FAIXA_LABEL[r.faixa]}
                </div>
              </div>
            )
          })}

          {cenarios.length >= 2 && (
            <div
              style={{
                paddingLeft: 20,
                borderLeft: "1px solid var(--line-2)",
                color: "var(--ink-2)",
                fontSize: 13.5,
                lineHeight: 1.55,
                maxWidth: 280,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 6,
                }}
              >
                Diferença
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#fff", marginBottom: 6 }}>
                {diffPontos > 0 ? "+" : ""}
                {diffPontos} pontos
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{fraseDiff}</div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* RADAR ÚNICO SOBREPOSTO */}
      <GlassCard glow="none" padding={24} hover={false} style={{ marginBottom: 18 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: 4,
          }}
        >
          Radar — 6 dimensões
        </div>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 16 }}>
          Cada eixo vai de 0 a 100. Quanto mais ‘inflado’, mais forte o cenário naquele aspecto.
        </div>
        <RadarComparado series={series} altura={340} />
      </GlassCard>

      {/* TABELA DIFF */}
      <GlassCard glow="none" padding={0} hover={false} style={{ marginBottom: 18, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              O que muda entre os cenários
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4 }}>
              Linhas em <span style={{ color: "var(--gold)" }}>dourado</span> são os
              atributos divergentes.
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 24px",
                    color: "var(--muted)",
                    fontWeight: 500,
                    fontSize: 11.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  Atributo
                </th>
                {cenarios.map((c, i) => (
                  <th
                    key={c.id}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: CORES_CENARIO[i % CORES_CENARIO.length],
                      fontWeight: 500,
                      fontSize: 11.5,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATRIBUTOS_DIFF.map((attr) => {
                const div = divergente(attr.campo)
                return (
                  <tr
                    key={attr.campo}
                    style={{
                      background: div ? "rgba(201,168,106,0.06)" : "transparent",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 24px",
                        color: "var(--ink)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        borderLeft: div ? "2px solid var(--gold)" : "2px solid transparent",
                      }}
                    >
                      {attr.rotulo}
                    </td>
                    {cenarios.map((c) => (
                      <td
                        key={c.id}
                        style={{
                          padding: "12px 16px",
                          color: div ? "#fff" : "var(--ink-2)",
                          fontWeight: div ? 500 : 400,
                          letterSpacing: "-0.005em",
                        }}
                      >
                        {attr.formatar(c.input)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ACCORDION — editores de cenário (inputs ficam aqui, não no topo) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cenarios.map((c, i) => {
          const cor = CORES_CENARIO[i % CORES_CENARIO.length]
          const aberto = editor === c.id
          return (
            <GlassCard key={c.id} glow="none" padding={0} hover={false} style={{ overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setEditor(aberto ? null : c.id)}
                aria-expanded={aberto}
                aria-controls={`editor-${c.id}`}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 20px",
                  background: "transparent",
                  border: 0,
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cor,
                    boxShadow: `0 0 8px ${cor}`,
                  }}
                />
                <span style={{ fontWeight: 500, color: "var(--ink)", fontSize: 14.5 }}>
                  Editar {c.rotulo}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: cor,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {resultados[c.id].score} pts
                </span>
                {cenarios.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      remover(c.id)
                    }}
                    aria-label={`Remover ${c.rotulo}`}
                    style={{
                      marginLeft: "auto",
                      marginRight: 8,
                      background: "transparent",
                      border: 0,
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: 4,
                      display: "inline-flex",
                    }}
                  >
                    {Icon.x(14)}
                  </button>
                )}
                <span
                  style={{
                    color: "var(--muted)",
                    transform: aberto ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                    marginLeft: cenarios.length > 1 ? 0 : "auto",
                  }}
                >
                  {Icon.chevron(16)}
                </span>
              </button>

              {aberto && (
                <div
                  id={`editor-${c.id}`}
                  style={{
                    padding: "8px 20px 22px",
                    borderTop: "1px solid var(--line)",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 14,
                  }}
                  className="comp-editor-grid"
                >
                  <Mini
                    label="Cultura"
                    options={CULTURAS.slice(0, 8).map((o) => ({
                      value: o.id,
                      label: o.nome,
                    }))}
                    value={c.input.cultura}
                    onChange={(v) => patch(c.id, { cultura: v as SimulatorInput["cultura"] })}
                  />
                  <Mini
                    label={`Valor · R$ ${c.input.valor_pretendido.toLocaleString("pt-BR")}`}
                  >
                    <input
                      type="range"
                      min={50_000}
                      max={5_000_000}
                      step={50_000}
                      value={c.input.valor_pretendido}
                      onChange={(e) => patch(c.id, { valor_pretendido: +e.target.value })}
                      style={{ width: "100%", accentColor: cor }}
                    />
                  </Mini>
                  <Mini
                    label="Cadastro"
                    options={CADASTRO_NIVEIS.map((n) => ({
                      value: n.id,
                      label: n.nome,
                    }))}
                    value={c.input.cadastro_nivel}
                    onChange={(v) =>
                      patch(c.id, { cadastro_nivel: v as SimulatorInput["cadastro_nivel"] })
                    }
                  />
                  <Mini
                    label="Histórico SCR"
                    options={[
                      { value: "limpo", label: "Limpo" },
                      { value: "primeira_operacao", label: "1ª operação" },
                      { value: "restricao_encerrada", label: "Restrição encerrada" },
                      { value: "com_restricao_ativa", label: "Restrição ATIVA" },
                    ]}
                    value={c.input.historico_scr}
                    onChange={(v) =>
                      patch(c.id, { historico_scr: v as SimulatorInput["historico_scr"] })
                    }
                  />
                  <Mini
                    label="Estrutura fundiária"
                    options={[
                      { value: "proprio", label: "Própria" },
                      { value: "misto_proprio_arrendado", label: "Mista" },
                      { value: "maioria_arrendado", label: "Maioria arrendada" },
                      { value: "totalmente_arrendado", label: "100% arrendada" },
                    ]}
                    value={c.input.relacao_terra}
                    onChange={(v) =>
                      patch(c.id, { relacao_terra: v as SimulatorInput["relacao_terra"] })
                    }
                  />
                  <Mini
                    label="CAR"
                    options={[
                      { value: "regular_averbado", label: "Regular e averbado" },
                      { value: "inscrito_pendente", label: "Inscrito (pendente)" },
                      { value: "nao_tem", label: "Não tem" },
                    ]}
                    value={c.input.car}
                    onChange={(v) => patch(c.id, { car: v as SimulatorInput["car"] })}
                  />
                  <Mini
                    label={`Garantias (${c.input.garantias.length})`}
                  >
                    <select
                      multiple
                      value={c.input.garantias as string[]}
                      onChange={(e) => {
                        const sel = Array.from(e.target.selectedOptions).map((o) => o.value)
                        patch(c.id, { garantias: sel as SimulatorInput["garantias"] })
                      }}
                      style={{
                        width: "100%",
                        minHeight: 92,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--line-2)",
                        borderRadius: 8,
                        color: "var(--ink)",
                        fontSize: 12,
                        fontFamily: "inherit",
                        padding: 6,
                        outline: "none",
                      }}
                    >
                      {GARANTIAS.map((g) => (
                        <option key={g.id} value={g.id} style={{ background: "#0b0d0f" }}>
                          {g.nome.slice(0, 50)} ({g.delta > 0 ? "+" : ""}{g.delta})
                        </option>
                      ))}
                    </select>
                  </Mini>
                  <Mini
                    label="Reciprocidade"
                    options={[
                      { value: "forte", label: "Forte" },
                      { value: "media", label: "Média" },
                      { value: "nenhuma", label: "Nenhuma" },
                    ]}
                    value={c.input.reciprocidade_bancaria}
                    onChange={(v) =>
                      patch(c.id, {
                        reciprocidade_bancaria: v as SimulatorInput["reciprocidade_bancaria"],
                      })
                    }
                  />
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .comp-resumo {
            grid-template-columns: 1fr 1fr !important;
          }
          .comp-resumo > div:last-child {
            grid-column: 1 / -1;
            padding-left: 0 !important;
            border-left: 0 !important;
            border-top: 1px solid var(--line-2);
            padding-top: 16px;
            max-width: none !important;
          }
        }
        @media (max-width: 600px) {
          .comp-resumo { grid-template-columns: 1fr !important; }
          .comp-editor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ─── helper: frase do que mais diverge entre cenários ───────────────
function computarFraseDiferencial(
  cenarios: Cenario[],
  resultados: Record<string, SimulatorResult>,
): string {
  if (cenarios.length < 2) return ""

  // Pega o eixo do radar com maior amplitude (max - min) entre cenários
  const eixos = resultados[cenarios[0].id].radar.map((e) => e.eixo)
  let maiorAmplitude = 0
  let eixoMaisDif = eixos[0]
  for (const eixo of eixos) {
    const valores = cenarios
      .map((c) => resultados[c.id].radar.find((r) => r.eixo === eixo)?.valor ?? 0)
    const amp = Math.max(...valores) - Math.min(...valores)
    if (amp > maiorAmplitude) {
      maiorAmplitude = amp
      eixoMaisDif = eixo
    }
  }

  if (maiorAmplitude < 8) {
    return "Os cenários estão equilibrados nas 6 dimensões — diferenças sutis."
  }
  return `Diferença mais marcante: ${eixoMaisDif} (${maiorAmplitude} pontos de variação no radar).`
}

// ─── Mini select reutilizável (igual ao do simulador principal) ────
function Mini({
  label,
  children,
  options,
  value,
  onChange,
}: {
  label: string
  children?: React.ReactNode
  options?: { value: string; label: string }[]
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <div>
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
            height: 36,
            padding: "0 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--line-2)",
            borderRadius: 8,
            color: "var(--ink)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value} style={{ background: "#0b0d0f" }}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
