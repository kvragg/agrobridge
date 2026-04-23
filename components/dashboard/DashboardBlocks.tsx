"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Eyebrow, GlassCard, Icon } from "@/components/landing/primitives"

// ─── 1. Pipeline visual do status do dossiê ───────────────────────

export type FaseStatus = "concluida" | "ativa" | "bloqueada"

export type Fase = {
  nome: string
  status: FaseStatus
  /** Copy complementar embaixo do título (ex: "12/17 itens"). */
  sub?: string
}

/**
 * Pipeline horizontal — 4 fases conectadas por linha. Mostra onde o user
 * está no processo completo. Desktop: horizontal. Mobile: vertical.
 */
export function DashboardPipeline({ fases }: { fases: Fase[] }) {
  return (
    <GlassCard glow="green" padding={28} hover={false}>
      <Eyebrow>Onde você está</Eyebrow>
      <div
        className="pipeline-wrap"
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: `repeat(${fases.length}, 1fr)`,
          gap: 8,
        }}
      >
        {fases.map((f, i) => (
          <PipelinePhase key={i} fase={f} index={i} total={fases.length} />
        ))}
      </div>
      <style>{`
        @media (max-width: 820px) {
          .pipeline-wrap { grid-template-columns: 1fr !important; gap: 14px !important; }
        }
      `}</style>
    </GlassCard>
  )
}

function PipelinePhase({
  fase,
  index,
  total,
}: {
  fase: Fase
  index: number
  total: number
}) {
  const isDone = fase.status === "concluida"
  const isActive = fase.status === "ativa"

  const circleBg = isDone
    ? "linear-gradient(180deg,#5cbd95,#2f7a5c)"
    : isActive
    ? "rgba(78,168,132,0.18)"
    : "transparent"
  const circleBorder = isDone
    ? "none"
    : isActive
    ? "1px solid rgba(78,168,132,0.4)"
    : "1px solid var(--line-2)"
  const circleColor = isDone
    ? "#07120d"
    : isActive
    ? "var(--green)"
    : "var(--muted)"
  const titleColor = isDone || isActive ? "var(--ink)" : "var(--muted)"
  const subColor = isActive ? "var(--green)" : "var(--muted)"
  const isLast = index === total - 1

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: circleBg,
          border: circleBorder,
          color: circleColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), 'Geist Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          flexShrink: 0,
          boxShadow: isDone ? "0 0 16px rgba(78,168,132,0.35)" : "none",
          position: "relative",
          zIndex: 2,
        }}
      >
        {isDone ? Icon.check(16) : (index + 1).toString().padStart(2, "0")}
      </div>

      {!isLast && (
        <div
          className="pipeline-line"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 18,
            left: 48,
            right: -8,
            height: 1,
            background: isDone
              ? "rgba(78,168,132,0.5)"
              : "var(--line-2)",
            zIndex: 1,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: titleColor,
            letterSpacing: "-0.005em",
          }}
        >
          {fase.nome}
        </div>
        <div
          className="mono"
          style={{
            marginTop: 3,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: subColor,
          }}
        >
          {fase.sub ??
            (isDone ? "concluído" : isActive ? "em curso" : "aguardando")}
        </div>
      </div>
    </div>
  )
}

// ─── 2. Banner "Próxima ação" contextual ─────────────────────────

export type ProximaAcaoVariant = "info" | "acao" | "urgente" | "success"

type ProximaAcaoProps = {
  variant?: ProximaAcaoVariant
  titulo: string
  descricao?: string
  cta?: { label: string; href: string }
}

export function ProximaAcao({
  variant = "acao",
  titulo,
  descricao,
  cta,
}: ProximaAcaoProps) {
  const styles = {
    info: {
      bg: "rgba(255,255,255,0.03)",
      border: "var(--line-2)",
      eyebrow: "var(--muted)",
      dot: "var(--muted)",
    },
    acao: {
      bg: "rgba(78,168,132,0.08)",
      border: "rgba(78,168,132,0.28)",
      eyebrow: "var(--green)",
      dot: "var(--green)",
    },
    urgente: {
      bg: "rgba(212,113,88,0.08)",
      border: "rgba(212,113,88,0.32)",
      eyebrow: "var(--danger)",
      dot: "var(--danger)",
    },
    success: {
      bg: "rgba(201,168,106,0.08)",
      border: "rgba(201,168,106,0.32)",
      eyebrow: "var(--gold)",
      dot: "var(--gold)",
    },
  }[variant]

  return (
    <div
      role="status"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 14,
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: styles.eyebrow,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: styles.dot,
              boxShadow: `0 0 8px ${styles.dot}`,
            }}
          />
          Próxima ação
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 17,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}
        >
          {titulo}
        </div>
        {descricao && (
          <div
            style={{
              marginTop: 4,
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.5,
            }}
          >
            {descricao}
          </div>
        )}
      </div>

      {cta && (
        <Link
          href={cta.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            borderRadius: 999,
            background: "linear-gradient(180deg,#5cbd95 0%,#2f7a5c 100%)",
            color: "#07120d",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            textDecoration: "none",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.15) inset," +
              "0 10px 30px -8px rgba(78,168,132,0.5)",
            flexShrink: 0,
          }}
        >
          {cta.label} {Icon.arrow(14)}
        </Link>
      )}
    </div>
  )
}

// ─── 3. Grid de KPIs do produtor ──────────────────────────────────

export type KPI = {
  label: string
  valor: string | null
  hint?: string
  /** Ícone opcional (já renderizado — ex: Icon.bank(14)). */
  icon?: ReactNode
  /** Cor do rótulo. */
  accent?: "green" | "gold" | "muted"
}

export function ProdutorKPIs({ kpis }: { kpis: KPI[] }) {
  return (
    <div
      className="kpis-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${kpis.length}, 1fr)`,
        gap: 12,
      }}
    >
      {kpis.map((k, i) => (
        <KPIBlock key={i} {...k} />
      ))}
      <style>{`
        @media (max-width: 1080px) {
          .kpis-grid { grid-template-columns: repeat(2, 1fr) !important }
        }
        @media (max-width: 520px) {
          .kpis-grid { grid-template-columns: 1fr !important }
        }
      `}</style>
    </div>
  )
}

function KPIBlock({ label, valor, hint, icon, accent = "muted" }: KPI) {
  const accentColor =
    accent === "gold"
      ? "var(--gold)"
      : accent === "green"
      ? "var(--green)"
      : "var(--muted)"
  const vazio = !valor
  return (
    <GlassCard glow="none" padding={18} hover={false}>
      <div
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accentColor,
          marginBottom: 10,
        }}
      >
        {icon && <span style={{ color: accentColor }}>{icon}</span>}
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
          color: vazio ? "var(--muted)" : "#fff",
        }}
      >
        {valor ?? "—"}
      </div>
      {hint && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11.5,
            color: "var(--muted)",
            lineHeight: 1.4,
          }}
        >
          {hint}
        </div>
      )}
    </GlassCard>
  )
}

// ─── 4. Strip de documentos ───────────────────────────────────────

export type DocStatus = "ok" | "enviando" | "pendente" | "rejeitado"

export type DocChip = {
  slug: string
  label: string
  status: DocStatus
}

const DOC_STATUS: Record<
  DocStatus,
  { bg: string; border: string; color: string; icon: ReactNode }
> = {
  ok: {
    bg: "rgba(78,168,132,0.14)",
    border: "rgba(78,168,132,0.32)",
    color: "var(--green)",
    icon: Icon.check(10),
  },
  enviando: {
    bg: "rgba(201,168,106,0.10)",
    border: "rgba(201,168,106,0.28)",
    color: "var(--gold)",
    icon: Icon.spinner(10),
  },
  pendente: {
    bg: "rgba(255,255,255,0.03)",
    border: "var(--line-2)",
    color: "var(--muted)",
    icon: Icon.dot(6),
  },
  rejeitado: {
    bg: "rgba(212,113,88,0.10)",
    border: "rgba(212,113,88,0.32)",
    color: "var(--danger)",
    icon: Icon.x(10),
  },
}

type DocumentosStripProps = {
  docs: DocChip[]
  total: number
  /** Link pra tela detalhada do checklist. */
  href?: string
}

export function DocumentosStrip({ docs, total, href }: DocumentosStripProps) {
  const visiveis = docs.slice(0, 8)
  const extras = total > 8 ? total - 8 : 0
  const done = docs.filter((d) => d.status === "ok").length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const content = (
    <GlassCard glow="none" padding={22} hover={Boolean(href)}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Eyebrow>Documentos</Eyebrow>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "var(--muted)",
            textTransform: "uppercase",
          }}
        >
          {done}/{total} · {pct}%
        </div>
      </div>

      <div
        style={{
          height: 5,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
            transition: "width .5s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {visiveis.map((doc) => {
          const s = DOC_STATUS[doc.status]
          return (
            <span
              key={doc.slug}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: "var(--ink-2)",
                fontSize: 12.5,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: s.color, display: "inline-flex" }}>{s.icon}</span>
              {doc.label}
            </span>
          )
        })}
        {extras > 0 && (
          <span
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              color: "var(--muted)",
              fontSize: 11.5,
              letterSpacing: "0.1em",
            }}
          >
            +{extras}
          </span>
        )}
        {visiveis.length === 0 && (
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            Nenhum documento pendente ainda.
          </span>
        )}
      </div>
    </GlassCard>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    )
  }
  return content
}
