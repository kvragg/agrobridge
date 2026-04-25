"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { Icon } from "@/components/landing/primitives"
import { useRotator } from "@/hooks/use-rotator"

interface Slide {
  /** Número visível na tag superior. */
  numero: string
  /** Tag de "ato" — agrupa slides por contexto. */
  ato: "cadastro" | "patrimonio" | "documentacao"
  atoLabel: string
  /** Título curto e direto — manchete que prende. */
  titulo: ReactNode
  /** Corpo do slide — frase clara, max 3-4 linhas. */
  corpo: ReactNode
  /** Cor temática do slide. */
  cor: "gold" | "danger" | "green"
}

const SLIDES: Slide[] = [
  // ═══ ATO 1 — CADASTRO (alma do negócio + erros em cascata) ═══
  {
    numero: "01",
    ato: "cadastro",
    atoLabel: "Cadastro · alma do negócio",
    titulo: (
      <>
        Antes do papel, o <span style={{ color: "var(--gold)" }}>cadastro</span>.
      </>
    ),
    corpo: (
      <>
        O cadastro do produtor no banco/cooperativa é a <strong style={{ color: "#fff" }}>alma
        do negócio</strong>. Sem ele 100% atualizado, dossiê perfeito é
        reprovado mesmo assim. É o <strong style={{ color: "var(--danger)" }}>maior
        motivo de reprovação de crédito rural hoje</strong> — mais que
        documento faltando.
      </>
    ),
    cor: "gold",
  },
  {
    numero: "02",
    ato: "cadastro",
    atoLabel: "Cadastro · alma do negócio",
    titulo: (
      <>
        Erro pode vir de <span style={{ color: "var(--danger)" }}>3 lados</span> — atenção.
      </>
    ),
    corpo: (
      <>
        <strong style={{ color: "#fff" }}>O gerente pode errar</strong> — esquecer
        item, não pedir tudo, digitar valor errado.{" "}
        <strong style={{ color: "#fff" }}>O analista de cadastro pode errar</strong> —
        usar valor automático do IR ou matrícula em vez do real.{" "}
        <strong style={{ color: "#fff" }}>Você também pode errar</strong> achando que
        &ldquo;o que já mandei é suficiente&rdquo; — quase nunca é. <span
        style={{ color: "var(--gold)" }}>Não confie em ninguém — confira</span>.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "03",
    ato: "cadastro",
    atoLabel: "Cadastro · alma do negócio",
    titulo: (
      <>
        Você é o <span style={{ color: "var(--gold)" }}>interessado principal</span>{" "}
        — a obrigação é sua.
      </>
    ),
    corpo: (
      <>
        Quem perde se o cadastro tá errado é você — não o gerente, não
        o analista, não a AgroBridge. Por isso é{" "}
        <strong style={{ color: "#fff" }}>obrigação sua</strong>: conferir
        cada item do cadastro, mandar TUDO (não pula nada), e cobrar
        seu gerente quando faltar atualização. Banco trabalha pra fechar
        operações — você trabalha pra <strong style={{ color: "var(--gold)" }}>ter
        sua operação aprovada</strong>.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "04",
    ato: "cadastro",
    atoLabel: "Cadastro · alma do negócio",
    titulo: (
      <>
        Renda <span style={{ color: "var(--gold)" }}>real</span>, não a do IR antigo.
      </>
    ),
    corpo: (
      <>
        Se sua produção cresceu desde o último IR, o banco trabalha com a
        renda menor — e seu teto de crédito cai. <strong style={{ color: "#fff" }}>Atualize
        a renda atual</strong> no formulário do banco antes de pedir,
        com documentos da safra/produção atual (NF de venda, contratos,
        relatórios da integradora).
      </>
    ),
    cor: "gold",
  },

  // ═══ ATO 2 — PATRIMÔNIO REAL ═══
  {
    numero: "05",
    ato: "patrimonio",
    atoLabel: "Patrimônio · valor de mercado",
    titulo: (
      <>
        Patrimônio em <span style={{ color: "var(--gold)" }}>valor de mercado</span>,
        nunca da matrícula nem do IR.
      </>
    ),
    corpo: (
      <>
        Matrícula traz valor histórico (geralmente bem abaixo do real). IR
        traz valor declarado atualizado por índice — também abaixo do mercado.
        O banco pode usar esses valores automaticamente, e seu patrimônio
        aparece muito menor do que é. <strong style={{ color: "var(--danger)" }}>Resultado:
        crédito menor ou reprovação</strong>. Peça reavaliação com laudo
        recente ou avaliação CRECI.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "06",
    ato: "patrimonio",
    atoLabel: "Patrimônio · valor de mercado",
    titulo: (
      <>
        Patrimônio real é <span style={{ color: "var(--gold)" }}>tudo isso</span>{" "}
        — não esqueça nenhum.
      </>
    ),
    corpo: (
      <>
        Casas, lotes, máquinas, carros, empresas, fazendas, investimentos
        — <strong style={{ color: "#fff" }}>tudo a valor de mercado, atualizado</strong>.
        Inclua semoventes (gado), implementos, participações em cooperativas,
        recebíveis. O comitê de crédito olha o conjunto. Faltou item =
        patrimônio menor = crédito menor.
      </>
    ),
    cor: "gold",
  },
  {
    numero: "07",
    ato: "patrimonio",
    atoLabel: "Patrimônio · valor de mercado",
    titulo: (
      <>
        Pergunte direto pro seu <span style={{ color: "var(--gold)" }}>gerente</span>.
      </>
    ),
    corpo: (
      <>
        Antes de protocolar qualquer crédito, faça essa pergunta exata: <em
        style={{ color: "#fff" }}>&ldquo;Meu cadastro está com renda real e patrimônio
        em valor de mercado, ou tá usando valor do IR e matrícula?&rdquo;</em>.
        Se for a segunda — <strong style={{ color: "var(--danger)" }}>pare e atualize
        antes</strong>. Documento perfeito sobre cadastro errado = reprovação.
      </>
    ),
    cor: "danger",
  },

  // ═══ ATO 3 — DOCUMENTAÇÃO + DOSSIÊ ═══
  {
    numero: "08",
    ato: "documentacao",
    atoLabel: "Depois do cadastro · documentação",
    titulo: (
      <>
        Cadastro 100%? <span style={{ color: "var(--gold)" }}>Aí sim</span>{" "}
        partimos pros documentos.
      </>
    ),
    corpo: (
      <>
        Com cadastro perfeito, juntamos os documentos do crédito rural:
        CAR, CCIR, ITR, matrícula, certidões negativas, projeto+croqui se
        investimento, anuência de arrendamento, comprovantes de produção.
        Cada item você anexa aqui ou recebe o passo-a-passo de onde tirar
        — <strong style={{ color: "#fff" }}>te guiamos site a site</strong>, sem
        mistério.
      </>
    ),
    cor: "green",
  },
  {
    numero: "09",
    ato: "documentacao",
    atoLabel: "Depois do cadastro · documentação",
    titulo: (
      <>
        Análise profunda + <span style={{ color: "var(--gold)" }}>Dossiê PDF</span>{" "}
        completo.
      </>
    ),
    corpo: (
      <>
        Com tudo na mão, a AgroBridge gera o dossiê em PDF cobrindo:{" "}
        <strong style={{ color: "#fff" }}>história do produtor</strong>,{" "}
        <strong style={{ color: "#fff" }}>referências comerciais</strong>,{" "}
        <strong style={{ color: "#fff" }}>defesa técnica do crédito</strong>{" "}
        em linguagem de comitê,{" "}
        <strong style={{ color: "#fff" }}>roteiro de como falar com o gerente</strong>,{" "}
        <strong style={{ color: "#fff" }}>análise da área de garantia</strong>{" "}
        e <strong style={{ color: "#fff" }}>área beneficiada</strong>.
        Disponível nos planos <span style={{ color: "var(--gold)" }}>Prata e Ouro</span>.
      </>
    ),
    cor: "green",
  },
]

interface Props {
  /** Tier do user — Ouro ganha CTA "1:1" no slide final. */
  tier?: "free" | "Bronze" | "Prata" | "Ouro"
}

/**
 * Carrossel educativo no topo da aba Documentos. 9 slides em 3 atos
 * narrativos:
 *
 *  ATO 1 (slides 1-4) — CADASTRO é alma do negócio
 *    Slides curados pelo fundador (14 anos no SFN). Mensagem central:
 *    cadastro errado é o maior motivo de reprovação hoje. Erros podem
 *    vir do gerente, do analista de cadastro, OU do próprio cliente
 *    achando que "o que mandou é suficiente". Cliente é o interessado
 *    principal — obrigação dele conferir + cobrar.
 *
 *  ATO 2 (slides 5-7) — PATRIMÔNIO em valor de mercado
 *    Por que matrícula/IR enganam. Lista completa do que conta como
 *    patrimônio (casas, lotes, máquinas, carros, empresas, fazendas,
 *    investimentos). Pergunta exata pro gerente.
 *
 *  ATO 3 (slides 8-9) — DOCUMENTAÇÃO + DOSSIÊ
 *    Só depois do cadastro 100% partimos pros documentos. Lista o
 *    conteúdo do dossiê PDF (história, referências comerciais, defesa
 *    técnica, roteiro pra falar com gerente, análise de garantia +
 *    área beneficiada). Diferencial Ouro = 1:1 com fundador.
 *
 * Características:
 *  - Auto-rotação 9s, pausa por hover, controles manuais discretos
 *  - Tag de ato visível no topo (orienta narrativa em 3 partes)
 *  - Visual: glasscard cor-do-ato (gold/danger/green)
 *  - Respeita prefers-reduced-motion (não gira sozinho)
 *  - Bullets clicáveis pra navegar
 *  - Ouro: bloco extra "1:1 com fundador" no slide 9
 */
export function CarrosselEducativo({ tier = "free" }: Props) {
  const total = SLIDES.length
  const rotator = useRotator(total, {
    intervalMs: 9000,
    autoplay: true,
    respectReducedMotion: true,
  })

  const [hover, setHover] = useState(false)
  const slideAtual = SLIDES[rotator.index]
  const isOuro = tier === "Ouro"

  const cor = {
    gold: { bg: "rgba(201,168,106,0.10)", border: "rgba(201,168,106,0.40)", accent: "var(--gold)", glow: "rgba(201,168,106,0.18)" },
    danger: { bg: "rgba(212,113,88,0.10)", border: "rgba(212,113,88,0.40)", accent: "var(--danger)", glow: "rgba(212,113,88,0.18)" },
    green: { bg: "rgba(78,168,132,0.10)", border: "rgba(78,168,132,0.40)", accent: "var(--green)", glow: "rgba(78,168,132,0.18)" },
  }[slideAtual.cor]

  return (
    <div
      onMouseEnter={() => {
        setHover(true)
        rotator.setHoverPaused(true)
      }}
      onMouseLeave={() => {
        setHover(false)
        rotator.setHoverPaused(false)
      }}
      style={{
        position: "relative",
        marginBottom: 28,
        borderRadius: 18,
        background: `linear-gradient(180deg, ${cor.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${cor.border}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 18px 40px -16px ${cor.glow}`,
        overflow: "hidden",
        transition: "background .4s, border-color .4s, box-shadow .4s",
        minHeight: 280,
      }}
      role="region"
      aria-label="Mensagens essenciais sobre crédito rural"
      aria-roledescription="carrossel"
    >
      {/* Barra de progresso colorida no topo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${rotator.progress * 100}%`,
            background: cor.accent,
            transition: "width .15s linear",
          }}
        />
      </div>

      <div style={{ padding: "26px 28px 22px" }}>
        {/* Tag superior — ato + número + controles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: cor.accent,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 16,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cor.accent,
                boxShadow: `0 0 8px ${cor.accent}`,
              }}
            />
            {slideAtual.atoLabel} · {slideAtual.numero} de {String(total).padStart(2, "0")}
          </div>

          {/* Controles discretos */}
          <div style={{ display: "flex", gap: 4 }}>
            <ControlBtn
              ariaLabel="Anterior"
              onClick={rotator.prev}
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="m10 4-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <ControlBtn
              ariaLabel={rotator.isPaused ? "Continuar" : "Pausar"}
              onClick={rotator.toggle}
              icon={
                rotator.isPaused ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M5 3.5v9l7-4.5-7-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )
              }
            />
            <ControlBtn
              ariaLabel="Próximo"
              onClick={rotator.next}
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Conteúdo do slide — animação fade */}
        <div
          key={rotator.index}
          style={{
            animation: hover ? "none" : "carrosselEduFade .4s ease",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "clamp(22px, 3.2vw, 30px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "#fff",
            }}
          >
            {slideAtual.titulo}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--ink-2)",
              maxWidth: 820,
              letterSpacing: "-0.005em",
            }}
          >
            {slideAtual.corpo}
          </p>

          {/* CTA Ouro no slide 9 (último, dossiê) */}
          {isOuro && rotator.index === 8 && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                background: "rgba(78,168,132,0.10)",
                border: "1px solid rgba(78,168,132,0.32)",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "#fff",
                fontSize: 13.5,
                lineHeight: 1.5,
                maxWidth: 720,
              }}
            >
              <span aria-hidden style={{ color: "var(--green)", flexShrink: 0 }}>
                {Icon.user(15)}
              </span>
              <span>
                <strong style={{ color: "var(--green)", fontWeight: 500 }}>
                  Você é Ouro.
                </strong>{" "}
                Atendimento 1:1 com o fundador (14 anos no SFN) pra
                assuntos profundos: revisão cadastral junto ao banco,
                redação da defesa de crédito, conversa estratégica antes
                do comitê. Agende em{" "}
                <a
                  href="mailto:comercial@agrobridge.space"
                  style={{ color: "var(--green)", textDecoration: "none", fontWeight: 500 }}
                >
                  comercial@agrobridge.space
                </a>
                .
              </span>
            </div>
          )}
        </div>

        {/* Bullets de navegação — agrupados por ato */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center",
          }}
          role="tablist"
          aria-label="Ir para slide específico"
        >
          {SLIDES.map((s, i) => {
            const ativo = i === rotator.index
            const corSlide = {
              gold: "var(--gold)",
              danger: "var(--danger)",
              green: "var(--green)",
            }[s.cor]
            // Separador visual entre atos
            const slideAnterior = SLIDES[i - 1]
            const novoAto = i > 0 && slideAnterior.ato !== s.ato
            return (
              <Fragment key={s.numero}>
                {novoAto && (
                  <span
                    aria-hidden
                    style={{
                      width: 1,
                      height: 16,
                      background: "var(--line-2)",
                      marginInline: 4,
                    }}
                  />
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  aria-label={`Slide ${s.numero}: ${s.atoLabel}`}
                  onClick={() => {
                    const diff = i - rotator.index
                    if (diff === 0) return
                    if (diff > 0) for (let k = 0; k < diff; k++) rotator.next()
                    else for (let k = 0; k < -diff; k++) rotator.prev()
                  }}
                  style={{
                    width: ativo ? 26 : 8,
                    height: 8,
                    borderRadius: 999,
                    background: ativo ? corSlide : "var(--line-2)",
                    border: 0,
                    cursor: "pointer",
                    padding: 0,
                    transition: "all .25s",
                  }}
                />
              </Fragment>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes carrosselEduFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-roledescription="carrossel"] * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

function ControlBtn({
  onClick,
  icon,
  ariaLabel,
}: {
  onClick: () => void
  icon: ReactNode
  ariaLabel: string
}) {
  const baseStyle: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--line-2)",
    color: "var(--muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all .2s",
    fontFamily: "inherit",
    padding: 0,
  }
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--ink)"
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--muted)"
        e.currentTarget.style.borderColor = "var(--line-2)"
      }}
    >
      {icon}
    </button>
  )
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
