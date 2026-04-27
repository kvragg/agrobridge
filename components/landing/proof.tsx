"use client"

// Antes: simulador interativo (a v1 do prompt original).
// Agora: SimuladorLoop não-interativo (BLOCO 6 do prompt do simulador) —
// inputs mudam sozinhos em loop, score reage com animação CountUp,
// CTA leva pro cadastro/simulador.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Container,
  SectionLabel,
  Eyebrow,
  Button,
  Icon,
  GlassCard,
  useReveal,
} from "./primitives"
import { MagneticHover } from "./_magnetic-hover"
import { simular } from "@/lib/simulator/engine"
import { CONJUNTURA_ATUAL } from "@/lib/simulator/data/conjuntura"
import type { SimulatorInput, Faixa } from "@/lib/simulator/types"

// 5 cenários pré-definidos pra cicar no loop. Cada um pinta um perfil
// realista de produtor com nota diferente — pra hipnotizar o lead.
const CENARIOS: { rotulo: string; input: SimulatorInput }[] = [
  {
    rotulo: "Soja MT · cadastro pronto",
    input: {
      valor_pretendido: 1_200_000,
      cultura: "soja",
      finalidade: "custeio",
      porte: "grande",
      uf: "MT",
      garantias: ["alienacao_fiduciaria_rural", "cpr_f_registrada"],
      relacao_terra: "proprio",
      aval_tipo: "nenhum",
      cadastro_nivel: "padrao_agrobridge",
      historico_scr: "limpo",
      endividamento_pct: 30,
      car: "regular_averbado",
      tem_seguro_agricola: true,
      reciprocidade_bancaria: "forte",
      cpf_cnpj_regular: true,
      imovel_em_inventario: false,
      arrendamento_com_anuencia: true,
      itr_em_dia: true,
      ir_em_dia: true,
    },
  },
  {
    rotulo: "Pecuária GO · arrendado + aval",
    input: {
      valor_pretendido: 680_000,
      cultura: "pecuaria_corte",
      finalidade: "investimento",
      porte: "medio",
      uf: "GO",
      garantias: ["hipoteca_1grau", "alienacao_maquinas"],
      relacao_terra: "totalmente_arrendado",
      aval_tipo: "amplo_amparo_patrimonial",
      cadastro_nivel: "atualizado_incompleto",
      historico_scr: "restricao_encerrada",
      endividamento_pct: 55,
      car: "regular_averbado",
      tem_seguro_agricola: false,
      reciprocidade_bancaria: "media",
      cpf_cnpj_regular: true,
      imovel_em_inventario: false,
      arrendamento_com_anuencia: true,
      itr_em_dia: true,
      ir_em_dia: true,
    },
  },
  {
    rotulo: "Café MG · tradicional",
    input: {
      valor_pretendido: 480_000,
      cultura: "cafe_arabica",
      finalidade: "custeio",
      porte: "medio",
      uf: "MG",
      garantias: ["hipoteca_1grau"],
      relacao_terra: "proprio",
      aval_tipo: "nenhum",
      cadastro_nivel: "atualizado_incompleto",
      historico_scr: "limpo",
      endividamento_pct: 40,
      car: "regular_averbado",
      tem_seguro_agricola: true,
      reciprocidade_bancaria: "forte",
      cpf_cnpj_regular: true,
      imovel_em_inventario: false,
      arrendamento_com_anuencia: true,
      itr_em_dia: true,
      ir_em_dia: true,
    },
  },
  {
    rotulo: "Avicultura SP · integradora AAA",
    input: {
      valor_pretendido: 2_500_000,
      cultura: "avicultura_corte",
      finalidade: "investimento",
      porte: "grande",
      uf: "SP",
      garantias: ["cessao_creditorios_aaa", "alienacao_fiduciaria_rural"],
      relacao_terra: "proprio",
      aval_tipo: "nenhum",
      cadastro_nivel: "padrao_agrobridge",
      historico_scr: "limpo",
      endividamento_pct: 25,
      car: "regular_averbado",
      tem_seguro_agricola: true,
      reciprocidade_bancaria: "forte",
      cpf_cnpj_regular: true,
      imovel_em_inventario: false,
      arrendamento_com_anuencia: true,
      itr_em_dia: true,
      ir_em_dia: true,
    },
  },
  {
    rotulo: "Pequeno PR · Pronaf + CAF",
    input: {
      valor_pretendido: 120_000,
      cultura: "feijao",
      finalidade: "custeio",
      porte: "pequeno",
      uf: "PR",
      garantias: ["penhor_safra_com_seguro"],
      relacao_terra: "proprio",
      aval_tipo: "amplo_amparo_patrimonial",
      cadastro_nivel: "atualizado_incompleto",
      historico_scr: "primeira_operacao",
      endividamento_pct: 15,
      car: "regular_averbado",
      tem_seguro_agricola: true,
      reciprocidade_bancaria: "forte",
      cpf_cnpj_regular: true,
      imovel_em_inventario: false,
      arrendamento_com_anuencia: true,
      tem_dap_caf: true,
      itr_em_dia: true,
      ir_em_dia: true,
    },
  },
]

const FAIXA_LABEL: Record<Faixa, string> = {
  muito_baixa: "Muito baixa",
  baixa: "Baixa",
  media: "Probabilidade média",
  alta: "Alta probabilidade",
  muito_alta: "Muito alta",
}

// Hex puro — `var(--*)` em `linear-gradient(..., ${cor})` +
// `background-clip: text` falha o render (texto transparente).
// Mesma lição do fix do simulador (commit 5943006).
const FAIXA_COR: Record<Faixa, string> = {
  muito_baixa: "#d47158",
  baixa: "#d47158",
  media: "#c9a86a",
  alta: "#4ea884",
  muito_alta: "#4ea884",
}

export function Proof() {
  useReveal()
  const [idx, setIdx] = useState(0)
  const [scoreAnim, setScoreAnim] = useState(0)
  const animRef = useRef<number | null>(null)

  const cenarioAtual = CENARIOS[idx]
  const resultado = useMemo(
    () => simular(cenarioAtual.input, CONJUNTURA_ATUAL),
    [cenarioAtual],
  )
  const cor = FAIXA_COR[resultado.faixa]

  // CountUp animado pro score
  useEffect(() => {
    const inicio = scoreAnim
    const fim = resultado.score
    const duracao = 700
    const t0 = performance.now()

    function step(now: number) {
      const t = Math.min(1, (now - t0) / duracao)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const v = Math.round(inicio + (fim - inicio) * eased)
      setScoreAnim(v)
      if (t < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado.score])

  // Cicla cenários a cada 3.5s
  useEffect(() => {
    const iv = setInterval(() => {
      setIdx((i) => (i + 1) % CENARIOS.length)
    }, 3500)
    return () => clearInterval(iv)
  }, [])

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
            "radial-gradient(40% 60% at 85% 30%, rgba(78,168,132,0.10), transparent 60%)",
        }}
      />
      <Container style={{ position: "relative" }}>
        <SectionLabel num="05" label="Veja sua leitura antes do banco" />

        <div
          className="proof-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            marginBottom: 48,
            alignItems: "flex-end",
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: "clamp(36px, 4.6vw, 56px)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              A mesma leitura
              <br />
              <span
                style={{
                  color: "transparent",
                  background:
                    "linear-gradient(90deg,#5cbd95,#c9a86a)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                que o comitê faz.
              </span>
            </h2>
          </div>
          <div className="reveal reveal-d1">
            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                margin: 0,
                maxWidth: 480,
              }}
            >
              Descubra sua nota de viabilidade antes de entrar no banco. O
              motor lê seu cenário e mostra exatamente o que aumenta — e o
              que reduz — sua chance de aprovação.
            </p>
          </div>
        </div>

        <GlassCard glow="green" padding={0} hover={false} className="reveal reveal-d2">
          <div
            className="proof-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
          >
            {/* Esquerda — cenário animado */}
            <div
              className="proof-left"
              style={{
                padding: 36,
                borderRight: "1px solid var(--line)",
                position: "relative",
                minHeight: 360,
              }}
            >
              <Eyebrow>Cenário ao vivo · {cenarioAtual.rotulo}</Eyebrow>

              <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
                <Row
                  label="Cultura"
                  valor={resultado.linha_mcr_provavel ?? "—"}
                />
                <Row
                  label="Valor pretendido"
                  valor={`R$ ${cenarioAtual.input.valor_pretendido.toLocaleString("pt-BR")}`}
                />
                <Row
                  label="Cadastro"
                  valor={cenarioAtual.input.cadastro_nivel === "padrao_agrobridge" ? "Padrão AgroBridge" : "Atualizado incompleto"}
                />
                <Row
                  label="Garantias"
                  valor={`${cenarioAtual.input.garantias.length} ${cenarioAtual.input.garantias.length === 1 ? "selecionada" : "selecionadas"}`}
                />
                <Row
                  label="Histórico SCR"
                  valor={cenarioAtual.input.historico_scr === "limpo" ? "Limpo" : "Em recuperação"}
                />
              </div>

              {/* Indicadores dos cenários */}
              <div
                style={{
                  marginTop: 32,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {CENARIOS.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === idx ? 24 : 6,
                      height: 6,
                      borderRadius: 999,
                      background:
                        i === idx ? "var(--green)" : "var(--line-2)",
                      transition: "all .3s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Direita — score + faixa */}
            <div
              className="proof-right"
              style={{ padding: 36, position: "relative" }}
            >
              <Eyebrow color={cor} dot={cor}>
                Leitura AgroBridge
              </Eyebrow>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 96,
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
                  {scoreAnim}
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                  / 100
                </div>
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: cor,
                  fontWeight: 500,
                  marginTop: 8,
                }}
              >
                {FAIXA_LABEL[resultado.faixa]}
              </div>

              <div
                style={{
                  marginTop: 24,
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
                    background:
                      cor === "#4ea884"
                        ? `linear-gradient(90deg, ${cor}, #c9a86a)`
                        : `linear-gradient(90deg, ${cor}, ${cor})`,
                    boxShadow: `0 0 14px ${cor}`,
                    transition: "all .6s ease",
                  }}
                />
              </div>

              <div style={{ marginTop: 24, display: "grid", gap: 8 }}>
                <Check ok={resultado.score >= 50} label="Garantia compatível com comitê" />
                <Check ok={cenarioAtual.input.historico_scr === "limpo" || cenarioAtual.input.historico_scr === "restricao_encerrada"} label="Histórico SCR aceitável" />
                <Check ok={cenarioAtual.input.car === "regular_averbado"} label="CAR regular" />
                <Check ok={cenarioAtual.input.endividamento_pct < 100} label="Endividamento sob controle" />
              </div>

              <div style={{ marginTop: 32 }}>
                <MagneticHover strength={8} radius={80}>
                  <Button variant="accent" size="md" href="/cadastro">
                    Fazer minha simulação grátis {Icon.arrow(14)}
                  </Button>
                </MagneticHover>
              </div>
            </div>
          </div>
        </GlassCard>
      </Container>

      <style>{`
        @media (max-width: 1020px) {
          .proof-header { grid-template-columns: 1fr !important; gap: 24px !important; align-items: flex-start !important; }
          .proof-grid { grid-template-columns: 1fr !important; }
          .proof-left { border-right: none !important; border-bottom: 1px solid var(--line); }
        }
      `}</style>
    </section>
  )
}

function Row({ label, valor }: { label: string; valor: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13.5,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
          textAlign: "right",
        }}
      >
        {valor}
      </span>
    </div>
  )
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13.5,
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
