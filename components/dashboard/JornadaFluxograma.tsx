"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Eyebrow, GlassCard, Icon } from "@/components/landing/primitives"

export type JornadaTierKey = "free" | "Bronze" | "Prata" | "Ouro"

type FaseDef = {
  key: JornadaTierKey
  preco: string
  nome: string
  resumo: string
  outcome: string
  features: string[]
  glow: "none" | "green" | "gold"
  accent: "muted" | "green" | "gold"
}

const FASES: FaseDef[] = [
  {
    key: "free",
    preco: "R$ 0",
    nome: "Free",
    resumo: "Cadastro + entrevista com IA",
    outcome: "Entende seu próprio caso em 10 min",
    features: [
      "5 perguntas com a IA grátis",
      "Mini-análise do seu perfil",
      "Leitura do enquadramento MCR",
    ],
    glow: "none",
    accent: "muted",
  },
  {
    key: "Bronze",
    preco: "R$ 79,99",
    nome: "Diagnóstico Rápido",
    resumo: "Como chegar pronto no gerente",
    outcome: "Sabe exatamente o que falar — e o que não falar — no banco",
    features: [
      "PDF tático de posicionamento bancário",
      "Roteiro de conversa com o gerente",
      "Leitura crítica do perfil em linguagem de comitê",
      "Garantia incondicional de 7 dias",
    ],
    glow: "none",
    accent: "muted",
  },
  {
    key: "Prata",
    preco: "R$ 397,00",
    nome: "Dossiê Bancário Completo",
    resumo: "Pedido pronto pra entregar ao comitê",
    outcome: "Protocola no banco no formato que o analista defende",
    features: [
      "Dossiê profissional em PDF de 6 páginas",
      "Checklist 100% ordenado conforme MCR",
      "Defesa de Crédito em linguagem de comitê",
      "Roteiro de Visita Técnica do analista",
      "Garantia incondicional de 7 dias",
    ],
    glow: "green",
    accent: "green",
  },
  {
    key: "Ouro",
    preco: "R$ 1.497,00",
    nome: "Assessoria Premium 1:1",
    resumo: "Acompanhamento pessoal com o fundador",
    outcome: "Consultoria 1:1 dedicada até o pedido entrar pronto no comitê",
    features: [
      "Sessão 1:1 (45 min) com o fundador (14 anos no SFN)",
      "Revisão cirúrgica do seu dossiê",
      "Gargalos ocultos identificados antes do comitê ver",
      "Apenas 6 vagas por mês",
    ],
    glow: "gold",
    accent: "gold",
  },
]

function tierLevel(t: JornadaTierKey): number {
  return { free: 0, Bronze: 1, Prata: 2, Ouro: 3 }[t]
}

type JornadaProps = {
  /** Tier comercial atual do usuário — destaca "VOCÊ ESTÁ AQUI". */
  tierAtual?: JornadaTierKey | null
  /** Variante: "full" (cards grandes) ou "compact" (horizontal denso). */
  variant?: "full" | "compact"
  /** Título em cima do fluxograma. */
  heading?: ReactNode
  /** Descrição em cima. */
  sub?: ReactNode
  /** Ao clicar em um tier, leva pro /planos (só ativo em fases ≥ Bronze). */
  linkToPlanos?: boolean
  /** Esconde preços (usado no dashboard Free-zero — preços só vivem em /planos). */
  showPrices?: boolean
}

export function JornadaFluxograma({
  tierAtual = null,
  variant = "full",
  heading,
  sub,
  linkToPlanos = true,
  showPrices = true,
}: JornadaProps) {
  const atualLvl = tierAtual ? tierLevel(tierAtual) : -1

  return (
    <section style={{ position: "relative" }}>
      {(heading || sub) && (
        <div style={{ marginBottom: 24, maxWidth: 720 }}>
          {heading && (
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(24px, 3vw, 34px)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "#fff",
              }}
            >
              {heading}
            </h2>
          )}
          {sub && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--ink-2)",
              }}
            >
              {sub}
            </p>
          )}
        </div>
      )}

      <div
        className={`jornada-grid jornada-grid--${variant}`}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: variant === "compact" ? 10 : 16,
          position: "relative",
        }}
      >
        {FASES.map((fase, i) => {
          const faseLvl = tierLevel(fase.key)
          const isAtual = tierAtual === fase.key
          const isPassado = tierAtual !== null && faseLvl < atualLvl
          const isFuturo = tierAtual !== null && faseLvl > atualLvl

          const conteudo = (
            <FaseCard
              fase={fase}
              isAtual={isAtual}
              isPassado={isPassado}
              isFuturo={isFuturo}
              variant={variant}
              showPrices={showPrices}
            />
          )

          // Tier Bronze/Prata/Ouro são clicáveis pro /planos
          if (linkToPlanos && fase.key !== "free") {
            return (
              <Link
                key={fase.key}
                href="/planos"
                style={{
                  textDecoration: "none",
                  position: "relative",
                  display: "block",
                }}
                aria-label={`Ver plano ${fase.nome}`}
              >
                {conteudo}
                {i > 0 && <Connector />}
              </Link>
            )
          }
          return (
            <div
              key={fase.key}
              style={{ position: "relative" }}
            >
              {conteudo}
              {i > 0 && <Connector />}
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .jornada-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .jornada-grid .jornada-connector { display: none !important; }
        }
        @media (max-width: 560px) {
          .jornada-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function FaseCard({
  fase,
  isAtual,
  isPassado,
  isFuturo,
  variant,
  showPrices,
}: {
  fase: FaseDef
  isAtual: boolean
  isPassado: boolean
  isFuturo: boolean
  variant: "full" | "compact"
  showPrices: boolean
}) {
  const accentColor =
    fase.accent === "gold"
      ? "var(--gold)"
      : fase.accent === "green"
      ? "var(--green)"
      : "var(--muted)"

  const padding = variant === "compact" ? 20 : 24

  return (
    <div style={{ position: "relative" }}>
      {isAtual && (
        <div
          className="mono"
          style={{
            position: "absolute",
            top: -12,
            left: 12,
            background: "linear-gradient(90deg,#5cbd95,#2f7a5c)",
            color: "#07120d",
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 999,
            zIndex: 3,
            boxShadow: "0 0 18px rgba(78,168,132,0.5)",
          }}
        >
          ✓ Você está aqui
        </div>
      )}

      <GlassCard
        glow={fase.glow}
        padding={padding}
        hover={!isPassado}
        style={{
          height: "100%",
          opacity: isPassado ? 0.55 : 1,
          ...(isAtual
            ? {
                border: "1px solid rgba(78,168,132,0.45)",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.06) inset," +
                  "0 0 0 3px rgba(78,168,132,0.14)," +
                  "0 30px 60px -30px rgba(0,0,0,0.8)," +
                  "0 0 80px -20px rgba(78,168,132,0.35)",
              }
            : {}),
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: variant === "compact" ? 10 : 14,
            minHeight: variant === "compact" ? 200 : 280,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accentColor,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accentColor,
                boxShadow:
                  fase.accent === "muted" ? "none" : `0 0 8px ${accentColor}`,
              }}
            />
            {showPrices ? fase.preco : fase.nome === "Free" ? "Grátis" : "Plano"}
          </div>

          <div>
            <div
              style={{
                fontSize: variant === "compact" ? 15.5 : 17,
                fontWeight: 500,
                color: "#fff",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}
            >
              {fase.nome}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12.5,
                color: "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {fase.resumo}
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: "var(--line)",
            }}
          />

          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 8,
              flex: 1,
            }}
          >
            {fase.features.map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontSize: 12.5,
                  color: "var(--ink-2)",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "rgba(78,168,132,0.15)",
                    color: "var(--green)",
                    flexShrink: 0,
                    marginTop: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Icon.check(9)}
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 10,
              borderTop: "1px dashed var(--line)",
              fontSize: 12,
              lineHeight: 1.45,
              color: accentColor,
              fontStyle: "italic",
            }}
          >
            {fase.outcome}
          </div>

          {isFuturo && (
            <div
              className="mono"
              style={{
                marginTop: 4,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Próximo passo →
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function Connector() {
  return (
    <div
      className="jornada-connector"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: -10,
        top: "50%",
        width: 20,
        height: 1,
        background:
          "linear-gradient(90deg, rgba(78,168,132,0.6), rgba(201,168,106,0.6))",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    />
  )
}

/**
 * Versão compacta pra ser embedada no dashboard/Free-zero.
 * Esconde features e outcome, mantém preço + nome + resumo.
 */
export function JornadaFluxogramaCompacto({
  tierAtual,
}: {
  tierAtual?: JornadaTierKey | null
}) {
  const atualLvl = tierAtual ? tierLevel(tierAtual) : -1
  return (
    <div style={{ position: "relative" }}>
      <Eyebrow>Sua jornada</Eyebrow>
      <div
        className="jornada-compact"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginTop: 14,
        }}
      >
        {FASES.map((fase) => {
          const faseLvl = tierLevel(fase.key)
          const isAtual = tierAtual === fase.key
          const isPassado = tierAtual !== null && faseLvl < atualLvl
          const accentColor =
            fase.accent === "gold"
              ? "var(--gold)"
              : fase.accent === "green"
              ? "var(--green)"
              : "var(--muted)"

          return (
            <div
              key={fase.key}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: isAtual
                  ? "rgba(78,168,132,0.12)"
                  : isPassado
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.03)",
                border: isAtual
                  ? "1px solid rgba(78,168,132,0.4)"
                  : "1px solid var(--line-2)",
                opacity: isPassado ? 0.55 : 1,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: accentColor,
                }}
              >
                {fase.preco}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#fff",
                  letterSpacing: "-0.005em",
                }}
              >
                {fase.nome}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11.5,
                  color: "var(--muted)",
                  lineHeight: 1.4,
                }}
              >
                {fase.resumo}
              </div>
              {isAtual && (
                <div
                  className="mono"
                  style={{
                    marginTop: 8,
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--green)",
                  }}
                >
                  ✓ Você está aqui
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`
        @media (max-width: 760px) {
          .jornada-compact { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
