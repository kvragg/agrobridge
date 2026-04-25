"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { Icon } from "@/components/landing/primitives"
import { useRotator } from "@/hooks/use-rotator"

interface Slide {
  /** Número visível na tag superior. */
  numero: string
  /** Título curto e direto — manchete que prende. */
  titulo: ReactNode
  /** Corpo do slide — frase clara, max 2-3 linhas. */
  corpo: ReactNode
  /** Cor temática do slide. */
  cor: "gold" | "danger" | "green"
}

const SLIDES: Slide[] = [
  {
    numero: "01",
    titulo: (
      <>
        Antes do papel, o <span style={{ color: "var(--gold)" }}>cadastro</span>.
      </>
    ),
    corpo: (
      <>
        O cadastro do produtor no banco/cooperativa é a <strong style={{ color: "#fff" }}>alma do
        negócio</strong>. Sem ele atualizado, dossiê perfeito é reprovado mesmo
        assim. Antes de juntar CAR, ITR ou matrícula — confira se o seu
        cadastro está 100% atual.
      </>
    ),
    cor: "gold",
  },
  {
    numero: "02",
    titulo: (
      <>
        Renda <span style={{ color: "var(--gold)" }}>real</span>, não a do IR antigo.
      </>
    ),
    corpo: (
      <>
        Se sua produção cresceu desde o último IR, o banco trabalha com a
        renda menor — e seu teto de crédito cai. <strong style={{ color: "#fff" }}>Atualize a renda
        atual</strong> no formulário do banco antes de pedir.
      </>
    ),
    cor: "gold",
  },
  {
    numero: "03",
    titulo: (
      <>
        Patrimônio em <span style={{ color: "var(--gold)" }}>valor de mercado</span>,
        nunca da matrícula.
      </>
    ),
    corpo: (
      <>
        A matrícula traz valor histórico — geralmente bem abaixo do real.
        O banco pode usar esse valor automaticamente, e seu patrimônio
        aparece menor do que é. <strong style={{ color: "var(--danger)" }}>Resultado:
        crédito menor ou reprovação direta</strong>. Peça reavaliação com
        laudo recente ou avaliação CRECI.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "04",
    titulo: (
      <>
        IR também tem essa armadilha — <span style={{ color: "var(--gold)" }}>cuidado</span>.
      </>
    ),
    corpo: (
      <>
        Bens declarados no IR ficam em valor histórico atualizado por índice
        oficial — quase sempre MUITO abaixo do mercado. <strong style={{ color: "#fff" }}>Faça
        atualização patrimonial completa</strong>: imóveis, máquinas, semoventes
        (gado), tudo a valor de mercado, antes de qualquer pedido.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "05",
    titulo: (
      <>
        Pergunte direto pro seu <span style={{ color: "var(--gold)" }}>gerente</span>.
      </>
    ),
    corpo: (
      <>
        Antes de protocolar qualquer crédito, faça essa pergunta exata: <em
        style={{ color: "#fff" }}>&ldquo;Meu cadastro está atualizado com renda real e
        patrimônio em valor de mercado, ou está usando valor do IR e
        matrícula?&rdquo;</em>. Se for a segunda — pare e atualize antes.
        É o <strong style={{ color: "var(--danger)" }}>maior motivo de reprovação
        de crédito rural hoje</strong>.
      </>
    ),
    cor: "danger",
  },
  {
    numero: "06",
    titulo: (
      <>
        Como o fluxo funciona aqui na <span style={{ color: "var(--gold)" }}>AgroBridge</span>.
      </>
    ),
    corpo: (
      <>
        <strong style={{ color: "#fff" }}>1.</strong> Conversa com a IA pra mapear
        seu caso · <strong style={{ color: "#fff" }}>2.</strong> Atualiza o cadastro
        no banco (essa página guia) · <strong style={{ color: "#fff" }}>3.</strong> Anexa
        ou tira documentos um a um (link site-a-site) · <strong style={{ color: "#fff" }}>4.</strong> IA
        analisa profundamente e gera o PDF do dossiê pro comitê.
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
 * Carrossel educativo no topo da aba Documentos. Substitui a estética
 * "lista monolítica de avisos" por mensagens diretas, uma por vez.
 * Aprendido com a fundação (14 anos no SFN): cadastro errado é o maior
 * motivo de reprovação. Lead PRECISA ouvir essa mensagem antes de gastar
 * energia juntando papel.
 *
 * Características:
 *  - 6 slides curados (cadastro · renda real · patrimônio mercado x
 *    matrícula x IR · pergunta gerente · fluxo AgroBridge)
 *  - Auto-rotação 8s, pausa por hover, controles manuais discretos
 *  - Visual: glasscard dourado/vermelho/verde por contexto do slide
 *  - Respeita prefers-reduced-motion (não gira sozinho)
 *  - Bullets clicáveis pra navegar
 */
export function CarrosselEducativo({ tier = "free" }: Props) {
  const total = SLIDES.length
  const rotator = useRotator(total, {
    intervalMs: 8500,
    autoplay: true,
    respectReducedMotion: true,
  })

  const [hover, setHover] = useState(false)
  const slideAtual = SLIDES[rotator.index]
  const isOuro = tier === "Ouro"

  const cor = {
    gold: { bg: "rgba(201,168,106,0.10)", border: "rgba(201,168,106,0.40)", accent: "var(--gold)" },
    danger: { bg: "rgba(212,113,88,0.10)", border: "rgba(212,113,88,0.40)", accent: "var(--danger)" },
    green: { bg: "rgba(78,168,132,0.10)", border: "rgba(78,168,132,0.40)", accent: "var(--green)" },
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
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 18px 40px -16px ${cor.accent.replace("var(--", "rgba(").replace(")", ", 0.18)")}`,
        overflow: "hidden",
        transition: "background .4s, border-color .4s",
      }}
      role="region"
      aria-label="Mensagens essenciais sobre crédito rural"
      aria-roledescription="carrossel"
    >
      {/* Barra de progresso dourada no topo */}
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
        {/* Tag superior */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
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
            Essencial · {slideAtual.numero} de {String(total).padStart(2, "0")}
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
              lineHeight: 1.6,
              color: "var(--ink-2)",
              maxWidth: 780,
              letterSpacing: "-0.005em",
            }}
          >
            {slideAtual.corpo}
          </p>

          {/* CTA Ouro no slide 6 */}
          {isOuro && rotator.index === 5 && (
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
              }}
            >
              <span aria-hidden style={{ color: "var(--green)" }}>
                {Icon.user(15)}
              </span>
              Você é Ouro — posso te acompanhar pessoalmente em qualquer
              etapa. Agende em{" "}
              <a
                href="mailto:comercial@agrobridge.space"
                style={{ color: "var(--green)", textDecoration: "none", fontWeight: 500 }}
              >
                comercial@agrobridge.space
              </a>
              .
            </div>
          )}
        </div>

        {/* Bullets de navegação */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 22,
            justifyContent: "center",
          }}
          role="tablist"
          aria-label="Ir para slide específico"
        >
          {SLIDES.map((s, i) => {
            const ativo = i === rotator.index
            return (
              <button
                key={s.numero}
                type="button"
                role="tab"
                aria-selected={ativo}
                aria-label={`Slide ${s.numero}`}
                onClick={() => {
                  // Navega manualmente — usa rotator.next/prev em loop
                  const diff = i - rotator.index
                  if (diff === 0) return
                  if (diff > 0) for (let k = 0; k < diff; k++) rotator.next()
                  else for (let k = 0; k < -diff; k++) rotator.prev()
                }}
                style={{
                  width: ativo ? 26 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: ativo ? cor.accent : "var(--line-2)",
                  border: 0,
                  cursor: "pointer",
                  padding: 0,
                  transition: "all .25s",
                }}
              />
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
