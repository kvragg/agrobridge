"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import { Alert } from "@/components/shell/Alert"
import { simular } from "@/lib/simulator/engine"
import { CULTURAS, getCultura } from "@/lib/simulator/data/culturas"
import { GARANTIAS } from "@/lib/simulator/data/garantias"
import { CADASTRO_NIVEIS } from "@/lib/simulator/data/cadastro-niveis"
import { CONJUNTURA_ATUAL } from "@/lib/simulator/data/conjuntura"
import type {
  SimulatorInput,
  SimulatorResult,
  Faixa,
  DividaPatrimonioFaixa,
} from "@/lib/simulator/types"
import { SimuladorRadar } from "./SimuladorRadar"
import { useWidgetIA } from "@/components/widget-ia/WidgetIAProvider"

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO",
  "MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const

// Régua de cor pelo NÚMERO (não pela faixa qualitativa, que mantém
// 5 categorias em outros lugares). Pedido do produto:
//   ≥ 80 verde · 51-79 amarelo · ≤ 50 vermelho.
// Amarelo literal #facc15 (não o `--gold` dourado da paleta) pra ficar
// nítido como "atenção" sem se confundir com o dourado de luxo do site.
function corDoScore(score: number): string {
  if (score >= 80) return "var(--green)"
  if (score >= 51) return "#facc15"
  return "var(--danger)"
}

const FAIXA_LABEL: Record<Faixa, string> = {
  muito_baixa: "Muito baixa probabilidade",
  baixa: "Baixa probabilidade",
  media: "Probabilidade média",
  alta: "Alta probabilidade",
  muito_alta: "Muito alta probabilidade",
}

function inputInicial(): SimulatorInput {
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
    divida_outros_bancos: "nenhuma",
    renda_bruta_anual: 1_200_000,
    endividamento_pct: 35,
    divida_patrimonio_faixa: "nao_sei",
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

export function SimuladorClient({
  podeSalvar,
}: {
  podeSalvar: boolean
}) {
  const [input, setInput] = useState<SimulatorInput>(inputInicial)
  const [debounced, setDebounced] = useState(input)
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvoSucesso, setSalvoSucesso] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const widget = useWidgetIA()

  // Debounce dos inputs pra rodar simular() suavemente
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebounced(input)
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  const resultado: SimulatorResult = useMemo(
    () => simular(debounced, CONJUNTURA_ATUAL),
    [debounced],
  )

  const cor = corDoScore(resultado.score)
  const arrendado =
    input.relacao_terra === "totalmente_arrendado" ||
    input.relacao_terra === "maioria_arrendado"

  function patch(p: Partial<SimulatorInput>) {
    setInput((s) => ({ ...s, ...p }))
    setSalvoSucesso(false)
  }

  function toggleGarantia(id: SimulatorInput["garantias"][number]) {
    setInput((s) => ({
      ...s,
      garantias: s.garantias.includes(id)
        ? s.garantias.filter((g) => g !== id)
        : [...s.garantias, id],
    }))
    setSalvoSucesso(false)
  }

  function reset() {
    setInput(inputInicial())
    setSalvoSucesso(false)
  }

  async function salvar() {
    if (!podeSalvar) return
    setSalvando(true)
    try {
      const res = await fetch("/api/simulador/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: debounced }),
      })
      if (res.ok) {
        setSalvoSucesso(true)
        setTimeout(() => setSalvoSucesso(false), 4000)
        widget.notificarSimulacaoSalva({
          score: resultado.score,
          cultura: getCultura(debounced.cultura)?.nome,
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className="sim-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {/* ─── Coluna esquerda: inputs ─── */}
      <GlassCard glow="green" padding={28} hover={false}>
        <Eyebrow>Simulação preliminar</Eyebrow>
        <h2
          style={{
            margin: "12px 0 8px",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          Conte sua operação
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 13.5,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          Cada mudança recalcula sua leitura instantaneamente.
        </p>

        <Field label={`Valor pretendido · R$ ${input.valor_pretendido.toLocaleString("pt-BR")}`}>
          <input
            type="range"
            min={50_000}
            max={10_000_000}
            step={10_000}
            value={input.valor_pretendido}
            onChange={(e) => patch({ valor_pretendido: +e.target.value })}
            style={{ width: "100%", accentColor: "var(--green)" }}
          />
        </Field>

        <Field label="Cultura / atividade">
          <Select
            value={input.cultura}
            onChange={(v) =>
              patch({ cultura: v as SimulatorInput["cultura"] })
            }
            options={CULTURAS.map((c) => ({ value: c.id, label: c.nome }))}
          />
        </Field>

        <Field label="Finalidade do crédito">
          <Select
            value={input.finalidade}
            onChange={(v) =>
              patch({ finalidade: v as SimulatorInput["finalidade"] })
            }
            options={[
              { value: "custeio", label: "Custeio" },
              { value: "investimento", label: "Investimento" },
              { value: "comercializacao", label: "Comercialização" },
              { value: "industrializacao", label: "Industrialização" },
            ]}
          />
        </Field>

        <Field label="Porte">
          <Segmented
            value={input.porte}
            onChange={(v) => patch({ porte: v as SimulatorInput["porte"] })}
            options={[
              { value: "pequeno", label: "Pequeno" },
              { value: "medio", label: "Médio" },
              { value: "grande", label: "Grande" },
            ]}
          />
        </Field>

        <Field label="UF da propriedade">
          <Select
            value={input.uf}
            onChange={(v) => patch({ uf: v })}
            options={UF_LIST.map((uf) => ({ value: uf, label: uf }))}
          />
        </Field>

        <Field
          label={`Garantias (${input.garantias.length} selecionadas)`}
          extra={
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--gold)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 6px var(--gold)",
                }}
              />
              Preferidas mercado 2026
            </span>
          }
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GARANTIAS.map((g) => {
              const active = input.garantias.includes(g.id)
              const cor =
                g.tier === "premium"
                  ? "var(--green)"
                  : g.tier === "forte"
                  ? "#6ad0a5"
                  : g.tier === "media"
                  ? "var(--gold)"
                  : "var(--danger)"
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGarantia(g.id)}
                  title={g.preferida_mercado_2026
                    ? `${g.nome} — preferida do mercado em 2026 (10/10)`
                    : g.nome}
                  style={{
                    padding: "6px 11px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    background: active
                      ? `color-mix(in srgb, ${cor} 22%, transparent)`
                      : "rgba(255,255,255,0.03)",
                    color: active ? cor : "var(--ink-2)",
                    border: `1px solid ${active ? cor : "var(--line-2)"}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                    whiteSpace: "nowrap",
                    position: "relative",
                  }}
                >
                  {g.preferida_mercado_2026 && (
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        boxShadow: "0 0 6px var(--gold)",
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                  {abreviar(g.nome)}{" "}
                  <span
                    className="mono"
                    style={{ opacity: 0.7, marginLeft: 4 }}
                  >
                    {g.delta > 0 ? "+" : ""}
                    {g.delta}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Sua relação com a terra">
          <Select
            value={input.relacao_terra}
            onChange={(v) =>
              patch({
                relacao_terra: v as SimulatorInput["relacao_terra"],
              })
            }
            options={[
              { value: "proprio", label: "100% próprio" },
              { value: "misto_proprio_arrendado", label: "Misto" },
              { value: "maioria_arrendado", label: "Maioria arrendado" },
              { value: "totalmente_arrendado", label: "100% arrendatário" },
            ]}
          />
        </Field>

        {arrendado && (
          <Field label="Tipo de aval disponível">
            <Select
              value={input.aval_tipo ?? "nenhum"}
              onChange={(v) =>
                patch({ aval_tipo: v as SimulatorInput["aval_tipo"] })
              }
              options={[
                { value: "nenhum", label: "Nenhum" },
                {
                  value: "puro_sem_respaldo",
                  label: "Aval puro sem respaldo",
                },
                {
                  value: "ate_100k_com_respaldo",
                  label: "Até R$ 100k com respaldo",
                },
                {
                  value: "amplo_amparo_patrimonial",
                  label: "Amplo amparo patrimonial",
                },
              ]}
            />
          </Field>
        )}

        <Field
          label="Nível do seu cadastro"
          extra={
            <button
              type="button"
              onClick={() => setShowCadastroModal(true)}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--green)",
                fontSize: 11.5,
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Como subir meu cadastro?
            </button>
          }
        >
          <Select
            value={input.cadastro_nivel}
            onChange={(v) =>
              patch({
                cadastro_nivel: v as SimulatorInput["cadastro_nivel"],
              })
            }
            options={CADASTRO_NIVEIS.map((n) => ({
              value: n.id,
              label: `${n.nome} (teto ${n.teto_score})`,
            }))}
          />
        </Field>

        <Field label="Histórico bancário (SCR — passado/restrições)">
          <Select
            value={input.historico_scr}
            onChange={(v) =>
              patch({
                historico_scr: v as SimulatorInput["historico_scr"],
              })
            }
            options={[
              { value: "limpo", label: "Limpo" },
              {
                value: "restricao_encerrada",
                label: "Restrição já encerrada",
              },
              { value: "primeira_operacao", label: "Primeira operação" },
              {
                value: "com_restricao_ativa",
                label: "Com restrição ativa",
              },
            ]}
          />
        </Field>

        <Field label="Operações ATIVAS em outros bancos (presente)">
          <Select
            value={input.divida_outros_bancos ?? "nenhuma"}
            onChange={(v) =>
              patch({
                divida_outros_bancos:
                  v as SimulatorInput["divida_outros_bancos"],
              })
            }
            options={[
              { value: "nenhuma", label: "Nenhuma — só com banco-alvo" },
              {
                value: "em_dia",
                label: "Tenho operação em outros bancos, em dia",
              },
              {
                value: "com_atraso",
                label: "Tenho operação com atraso em outro banco",
              },
            ]}
          />
        </Field>

        <Field
          label={`Renda bruta anual · R$ ${(input.renda_bruta_anual ?? 0).toLocaleString("pt-BR")}`}
          extra={
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--gold)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Régua do pleito
            </span>
          }
        >
          <input
            type="range"
            min={0}
            max={20_000_000}
            step={50_000}
            value={input.renda_bruta_anual ?? 0}
            onChange={(e) =>
              patch({ renda_bruta_anual: +e.target.value })
            }
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 4,
              fontFamily: "var(--font-mono, ui-monospace)",
            }}
          >
            <span>Faturamento da operação · base do múltiplo</span>
            <span>
              {input.finalidade === "investimento" ? "5×" : "3×"} =
              R$ {((input.renda_bruta_anual ?? 0) * (input.finalidade === "investimento" ? 5 : 3)).toLocaleString("pt-BR")}
            </span>
          </div>
        </Field>

        <Field
          label={`Endividamento atual · ${input.endividamento_pct}% da receita anual`}
        >
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={input.endividamento_pct}
            onChange={(e) => patch({ endividamento_pct: +e.target.value })}
            style={{ width: "100%", accentColor: "var(--green)" }}
          />
        </Field>

        <Field
          label="Alavancagem patrimonial · % do patrimônio comprometido em crédito"
          extra={
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--gold)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Crítico em 2026
            </span>
          }
        >
          <FaixaPatrimonioPicker
            value={input.divida_patrimonio_faixa ?? "nao_sei"}
            onChange={(v) => patch({ divida_patrimonio_faixa: v })}
          />
        </Field>

        <Field label="CAR (Cadastro Ambiental Rural)">
          <Select
            value={input.car}
            onChange={(v) =>
              patch({ car: v as SimulatorInput["car"] })
            }
            options={[
              { value: "regular_averbado", label: "Regular e averbado" },
              {
                value: "inscrito_pendente",
                label: "Inscrito mas com pendência",
              },
              { value: "nao_tem", label: "Não tenho" },
            ]}
          />
        </Field>

        <Field label="Reciprocidade no banco-alvo">
          <Segmented
            value={input.reciprocidade_bancaria}
            onChange={(v) =>
              patch({
                reciprocidade_bancaria:
                  v as SimulatorInput["reciprocidade_bancaria"],
              })
            }
            options={[
              { value: "forte", label: "Forte" },
              { value: "media", label: "Média" },
              { value: "nenhuma", label: "Nenhuma" },
            ]}
          />
        </Field>

        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <Toggle
            label="Tem seguro agrícola"
            value={input.tem_seguro_agricola}
            onChange={(v) => patch({ tem_seguro_agricola: v })}
          />
          <Toggle
            label="CPF/CNPJ regular na Receita"
            value={input.cpf_cnpj_regular}
            onChange={(v) => patch({ cpf_cnpj_regular: v })}
          />
          <Toggle
            label="ITR em dia (último exercício)"
            value={input.itr_em_dia}
            onChange={(v) => patch({ itr_em_dia: v })}
          />
          <Toggle
            label="IR em dia"
            value={input.ir_em_dia}
            onChange={(v) => patch({ ir_em_dia: v })}
          />
          <Toggle
            label="Imóvel em inventário"
            value={input.imovel_em_inventario}
            onChange={(v) => patch({ imovel_em_inventario: v })}
            cor="danger"
          />
          {input.porte === "pequeno" && (
            <Toggle
              label="Tem CAF (DAP) ativa"
              value={input.tem_dap_caf ?? false}
              onChange={(v) => patch({ tem_dap_caf: v })}
            />
          )}
        </div>
      </GlassCard>

      {/* ─── Coluna direita: resultado ─── */}
      <div style={{ position: "sticky", top: 88 }}>
        <GlassCard glow="green" padding={28} hover={false}>
          <Eyebrow color={cor} dot={cor}>
            Leitura AgroBridge · {CONJUNTURA_ATUAL.vigencia}
          </Eyebrow>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontWeight: 500,
                letterSpacing: "-0.045em",
                lineHeight: 1,
                color: "transparent",
                background: `linear-gradient(180deg, #fff 0%, ${cor} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {resultado.score}
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
              fontSize: 17,
              color: cor,
              fontWeight: 500,
              marginTop: 6,
            }}
          >
            {FAIXA_LABEL[resultado.faixa]}
          </div>

          <div
            style={{
              marginTop: 20,
              height: 6,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${resultado.score}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${cor}, ${cor === "var(--green)" ? "var(--gold)" : cor})`,
                boxShadow: `0 0 14px ${cor}`,
                transition: "all .35s",
              }}
            />
          </div>

          {/* Radar */}
          <div style={{ marginTop: 24 }}>
            <SimuladorRadar data={resultado.radar} />
          </div>

          {/* Linha MCR */}
          {resultado.linha_mcr_provavel && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Linha MCR provável
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink)",
                  letterSpacing: "-0.005em",
                }}
              >
                {resultado.linha_mcr_provavel}
              </div>
            </div>
          )}

          {/* Avisos */}
          {resultado.avisos.length > 0 && (
            <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
              {resultado.avisos.slice(0, 3).map((a, i) => (
                <Alert
                  key={i}
                  variant={
                    a.tipo === "critico"
                      ? "error"
                      : a.tipo === "alerta"
                      ? "gold"
                      : "info"
                  }
                >
                  {a.texto}
                </Alert>
              ))}
            </div>
          )}

          {/* Plano de subida */}
          {resultado.plano_de_subida.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <Eyebrow>Como sua nota pode subir</Eyebrow>
              <ul
                style={{
                  margin: "12px 0 0",
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: 8,
                }}
              >
                {resultado.plano_de_subida.map((p, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 13,
                      color: "var(--ink-2)",
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        flexShrink: 0,
                        width: 60,
                        textAlign: "right",
                        color: "var(--green)",
                        fontSize: 11,
                      }}
                    >
                      +{p.ganho_estimado}
                    </span>
                    <span style={{ flex: 1 }}>
                      {p.acao}
                      <span
                        className="mono"
                        style={{
                          marginLeft: 6,
                          color: "var(--muted)",
                          fontSize: 11,
                        }}
                      >
                        ~{p.prazo_dias}d
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conjuntura */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
            title={CONJUNTURA_ATUAL.descricao_longa}
          >
            <span style={{ color: "var(--gold)", display: "inline-flex" }}>
              {Icon.spark(14)}
            </span>
            Cenário {CONJUNTURA_ATUAL.vigencia}: {CONJUNTURA_ATUAL.descricao_curta}
          </div>

          {/* Salvar success */}
          {salvoSucesso && (
            <Alert variant="success">
              Simulação salva no seu histórico.
            </Alert>
          )}

          {/* CTAs */}
          <div
            style={{
              marginTop: 22,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Button variant="accent" size="md" href="/entrevista">
              Continuar com meu caso real {Icon.arrow(14)}
            </Button>
            {podeSalvar && (
              <Button
                variant="ghost"
                size="md"
                onClick={salvar}
                disabled={salvando}
              >
                {salvando ? "Salvando…" : "Salvar esta leitura"}
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={reset}>
              Nova simulação
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Modal Como subir cadastro */}
      {showCadastroModal && (
        <CadastroModal onClose={() => setShowCadastroModal(false)} />
      )}

      <style>{`
        @media (max-width: 1080px) {
          .sim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────

function Field({
  label,
  children,
  extra,
}: {
  label: string
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <label
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {label}
        </label>
        {extra}
      </div>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--line-2)",
        borderRadius: 10,
        color: "var(--ink)",
        fontSize: 13.5,
        fontFamily: "inherit",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0b0d0f" }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
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
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              background: active
                ? "rgba(78,168,132,0.22)"
                : "transparent",
              color: active ? "#fff" : "var(--muted)",
              border: active
                ? "1px solid rgba(78,168,132,0.4)"
                : "1px solid transparent",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
  cor,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  cor?: "danger"
}) {
  const accent = cor === "danger" ? "var(--danger)" : "var(--green)"
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        fontSize: 13,
        color: value ? "var(--ink)" : "var(--ink-2)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 16,
          height: 16,
          accentColor: accent,
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>{label}</span>
    </label>
  )
}

function CadastroModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 90,
        }}
      />
      <div
        role="dialog"
        aria-label="Como subir meu cadastro"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 95,
          width: "min(640px, 92vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 32,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(22,26,30,0.98) 0%, rgba(12,15,18,0.99) 100%)",
          border: "1px solid var(--line-gold)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Eyebrow>Níveis de cadastro</Eyebrow>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            {Icon.x(16)}
          </button>
        </div>
        <h2
          style={{
            margin: "0 0 18px",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.018em",
            color: "#fff",
          }}
        >
          Como subir meu cadastro?
        </h2>
        <div style={{ display: "grid", gap: 14 }}>
          {CADASTRO_NIVEIS.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "16px 18px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--line-2)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#fff",
                  }}
                >
                  {n.nome}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--gold)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Teto {n.teto_score}
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.5,
                }}
              >
                {n.resumo_curto}
              </p>
              {n.requisitos_faltantes.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  <strong style={{ color: "var(--danger)" }}>Falta:</strong>{" "}
                  {n.requisitos_faltantes.join(" · ")}
                </div>
              )}
              {n.requisitos_cumpridos.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  <strong style={{ color: "var(--green)" }}>Tem:</strong>{" "}
                  {n.requisitos_cumpridos.join(" · ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function abreviar(s: string): string {
  if (s.length <= 36) return s
  return s.slice(0, 33) + "…"
}

// Picker de faixa de alavancagem patrimonial. Radio em cores graduais
// (verde → âmbar → vermelho) pra deixar o impacto visual claro. Se
// "Não sei" o engine não aplica delta — IA do chat aprofunda no Turno 3.
function FaixaPatrimonioPicker({
  value,
  onChange,
}: {
  value: DividaPatrimonioFaixa
  onChange: (v: DividaPatrimonioFaixa) => void
}) {
  const opcoes: {
    id: DividaPatrimonioFaixa
    rotulo: string
    descr: string
    cor: string
  }[] = [
    {
      id: "ate_50",
      rotulo: "Até 50%",
      descr: "Folga confortável",
      cor: "var(--green)",
    },
    {
      id: "de_51_a_70",
      rotulo: "51 a 70%",
      descr: "Atende com ressalvas",
      cor: "var(--gold)",
    },
    {
      id: "de_71_a_85",
      rotulo: "71 a 85%",
      descr: "Zona de alerta",
      cor: "#d97a4f",
    },
    {
      id: "acima_85",
      rotulo: "Acima de 85%",
      descr: "Crítico",
      cor: "var(--danger)",
    },
    {
      id: "nao_sei",
      rotulo: "Não sei",
      descr: "IA aprofunda no chat",
      cor: "var(--muted)",
    },
  ]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
        gap: 6,
      }}
    >
      {opcoes.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              padding: "9px 10px",
              borderRadius: 10,
              background: active
                ? `color-mix(in srgb, ${o.cor} 18%, transparent)`
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? o.cor : "var(--line-2)"}`,
              color: active ? o.cor : "var(--ink-2)",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "all .15s",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                fontWeight: 500,
              }}
            >
              {o.rotulo}
            </span>
            <span
              style={{
                fontSize: 10.5,
                color: active ? o.cor : "var(--muted)",
                opacity: active ? 0.85 : 1,
                lineHeight: 1.3,
              }}
            >
              {o.descr}
            </span>
          </button>
        )
      })}
    </div>
  )
}
