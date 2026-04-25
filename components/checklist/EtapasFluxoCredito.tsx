"use client"

import { Icon } from "@/components/landing/primitives"

type StatusEtapa = "completa" | "ativa" | "pendente"

interface Etapa {
  numero: number
  nome: string
  descricao: string
  status: StatusEtapa
}

interface Props {
  etapaAtiva: 1 | 2 | 3 | 4
  /** Marca etapa 1 (entrevista) como concluída — passar true após concluir. */
  entrevistaConcluida?: boolean
}

/**
 * Mapa visual em 4 etapas — orienta o lead sobre onde está no
 * processo de crédito rural. Inspirado nas melhores ferramentas
 * SaaS (Linear, Stripe Onboarding) — não é gimmick, é narrativa.
 *
 * Etapas:
 *  1. Entrevista — IA mapeia perfil completo
 *  2. Cadastro bancário atualizado — alma do negócio (renda real,
 *     patrimônio em valor de mercado)
 *  3. Documentos — CAR, CCIR, ITR, matrícula, certidões, etc
 *  4. Análise + Dossiê — time AgroBridge gera PDF de defesa
 *
 * Usado no topo de /checklist e /checklist/[id]. Etapa ativa em
 * destaque dourado, completas em verde, pendentes em muted.
 */
export function EtapasFluxoCredito({
  etapaAtiva,
  entrevistaConcluida = false,
}: Props) {
  const etapas: Etapa[] = [
    {
      numero: 1,
      nome: "Entrevista",
      descricao: "IA mapeia seu perfil",
      status: entrevistaConcluida || etapaAtiva > 1 ? "completa" : etapaAtiva === 1 ? "ativa" : "pendente",
    },
    {
      numero: 2,
      nome: "Cadastro bancário",
      descricao: "Renda + patrimônio reais",
      status: etapaAtiva > 2 ? "completa" : etapaAtiva === 2 ? "ativa" : "pendente",
    },
    {
      numero: 3,
      nome: "Documentos",
      descricao: "CAR, CCIR, ITR, matrícula…",
      status: etapaAtiva > 3 ? "completa" : etapaAtiva === 3 ? "ativa" : "pendente",
    },
    {
      numero: 4,
      nome: "Análise + Dossiê",
      descricao: "PDF pro comitê do banco",
      status: etapaAtiva === 4 ? "ativa" : "pendente",
    },
  ]

  return (
    <div
      role="navigation"
      aria-label="Etapas do processo de crédito"
      style={{
        marginBottom: 28,
        padding: "16px 20px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
        border: "1px solid var(--line)",
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 8,
          overflowX: "auto",
        }}
        className="etapas-container"
      >
        {etapas.map((etapa, i) => (
          <Fragment key={etapa.numero}>
            <ItemEtapa etapa={etapa} />
            {i < etapas.length - 1 && <Separador status={etapa.status} />}
          </Fragment>
        ))}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .etapas-container {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

function ItemEtapa({ etapa }: { etapa: Etapa }) {
  const cores = {
    completa: {
      bg: "rgba(78,168,132,0.14)",
      border: "rgba(78,168,132,0.40)",
      ink: "var(--green)",
      icone: "var(--green)",
    },
    ativa: {
      bg: "rgba(201,168,106,0.16)",
      border: "rgba(201,168,106,0.48)",
      ink: "#fff",
      icone: "var(--gold)",
    },
    pendente: {
      bg: "rgba(255,255,255,0.02)",
      border: "var(--line-2)",
      ink: "var(--muted)",
      icone: "var(--muted)",
    },
  }[etapa.status]

  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 140,
        padding: "10px 12px",
        background: cores.bg,
        border: `1px solid ${cores.border}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 2,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background:
              etapa.status === "completa"
                ? "var(--green)"
                : etapa.status === "ativa"
                ? "var(--gold)"
                : "transparent",
            border: etapa.status === "pendente" ? `1.5px solid ${cores.icone}` : "0",
            color: etapa.status === "pendente" ? cores.icone : "#0b0d0f",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {etapa.status === "completa" ? Icon.check(12) : etapa.numero}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: cores.icone,
            fontWeight: 500,
          }}
        >
          {etapa.status === "completa" ? "feito" : etapa.status === "ativa" ? "agora" : "depois"}
        </span>
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: cores.ink,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        {etapa.nome}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: cores.ink === "#fff" ? "var(--ink-2)" : cores.ink,
          opacity: cores.ink === "#fff" ? 1 : 0.8,
          lineHeight: 1.4,
          letterSpacing: "-0.002em",
        }}
      >
        {etapa.descricao}
      </div>
    </div>
  )
}

function Separador({ status }: { status: StatusEtapa }) {
  return (
    <div
      aria-hidden
      style={{
        width: 16,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: status === "completa" ? "var(--green)" : "var(--faint)",
      }}
      className="etapa-separador"
    >
      {Icon.arrow(12)}
    </div>
  )
}

// Helper local pra evitar import de React.Fragment direto
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
