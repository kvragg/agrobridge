"use client"

import { useEffect, useState } from "react"
import { TIER_NIVEL, type Tier } from "@/lib/tier"
import { DashboardShell } from "@/components/shell/DashboardShell"
import {
  Button,
  Eyebrow,
  Icon,
  GlassCard,
  GridLayer,
} from "@/components/landing/primitives"
import {
  JornadaFluxograma,
  type JornadaTierKey,
} from "@/components/dashboard/JornadaFluxograma"

// URLs Cakto — checkout externo, redirect (não iframe).
// Cakto propaga `?ref=<processo_id>` da URL para o webhook.
const CAKTO_DIAGNOSTICO = "https://pay.cakto.com.br/wwdtenz_857137"
const CAKTO_DOSSIE = "https://pay.cakto.com.br/t4ajfpf_857143"
const CAKTO_MENTORIA = "https://pay.cakto.com.br/efia2s6_857148"

function comRef(url: string, processoId: string | null): string {
  if (!url || !processoId) return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}ref=${encodeURIComponent(processoId)}`
}

interface Feature {
  text: string
  destaque?: boolean
}

interface Plano {
  id: "diagnostico" | "dossie" | "mentoria"
  nome: string
  tagline: string
  preco: string
  features: Feature[]
  cta: string
  href: string
  accent: "muted" | "green" | "gold"
  destaque?: boolean
  badge?: string
}

const PLANOS: Plano[] = [
  {
    id: "diagnostico",
    nome: "Diagnóstico Rápido",
    tagline: "Pra chegar na agência sabendo o que falar.",
    preco: "29,99",
    accent: "muted",
    features: [
      { text: "Liberação imediata da IA para entrevista técnica" },
      { text: "PDF tático de posicionamento bancário" },
      { text: "Roteiro do que dizer — e do que NÃO falar — ao gerente" },
      { text: "Leitura crítica do seu perfil em linguagem de comitê" },
    ],
    cta: "Quero o diagnóstico",
    href: CAKTO_DIAGNOSTICO,
  },
  {
    id: "dossie",
    nome: "Dossiê Bancário Completo",
    tagline: "O pedido pronto pra sentar na mesa do comitê.",
    preco: "297,99",
    accent: "green",
    destaque: true,
    badge: "Mais escolhido",
    features: [
      { text: "Tudo do Diagnóstico Rápido", destaque: true },
      { text: "Dossiê Bancário profissional em PDF" },
      { text: "Sumário executivo e checklist 100% ordenado" },
      { text: "Documentos anexados no padrão do banco" },
      { text: "Defesa de Crédito em linguagem de comitê" },
      { text: "Roteiro de Visita Técnica do analista na fazenda" },
    ],
    cta: "Quero o dossiê completo",
    href: CAKTO_DOSSIE,
  },
  {
    id: "mentoria",
    nome: "Acesso à Mesa de Crédito",
    tagline: "Revisão cirúrgica direto com quem sentava na mesa.",
    preco: "697,99",
    accent: "gold",
    features: [
      { text: "Tudo do Dossiê Completo", destaque: true },
      { text: "Consultoria pessoal e direta com o fundador" },
      { text: "Revisão minuciosa do seu dossiê" },
      { text: "Correção de gargalos ocultos antes do banco ver" },
      {
        text: "Alinhamento estratégico com a ótica de quem passou 14 anos no SFN",
      },
    ],
    cta: "Quero a mentoria",
    href: CAKTO_MENTORIA,
  },
]

interface VagasMentoriaApi {
  limite_mensal: number
  vagas_usadas: number
  vagas_restantes: number
}

function tierLabel(tier: Tier | null): "free" | "Bronze" | "Prata" | "Ouro" {
  if (tier === "diagnostico") return "Bronze"
  if (tier === "dossie") return "Prata"
  if (tier === "mentoria") return "Ouro"
  return "free"
}

export default function PlanosClient({
  nome,
  processoId,
  tierAtual,
}: {
  nome: string
  processoId: string | null
  tierAtual: Tier | null
}) {
  const [vagasMentoria, setVagasMentoria] = useState<VagasMentoriaApi | null>(
    null,
  )

  useEffect(() => {
    let cancelado = false
    fetch("/api/planos/vagas-mentoria", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: VagasMentoriaApi | null) => {
        if (!cancelado && json && typeof json.vagas_restantes === "number") {
          setVagasMentoria(json)
        }
      })
      .catch(() => {
        // falha silenciosa — card da Mentoria fica sem badge de vagas
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <DashboardShell
      nome={nome}
      tier={tierLabel(tierAtual)}
      containerStyle={{ maxWidth: 1280 }}
    >
      <div style={{ position: "relative", padding: "16px 0 32px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(40% 40% at 50% 20%, rgba(78,168,132,0.12), transparent 60%)," +
              "radial-gradient(40% 40% at 85% 70%, rgba(201,168,106,0.08), transparent 60%)",
          }}
        />
        <GridLayer size={72} opacity={0.03} mask="ellipse at 50% 30%" />

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            alignItems: "flex-end",
            marginBottom: 56,
          }}
          className="planos-header"
        >
          <div>
            <Eyebrow>Olá, {nome} · último passo</Eyebrow>
            <h1
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(36px, 4.8vw, 60px)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              Escolha como chegar
              <br />
              <span
                style={{
                  color: "transparent",
                  background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                no banco.
              </span>
            </h1>
          </div>
          <div>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: 0,
                maxWidth: 480,
              }}
            >
              Pagamento único, sem fidelidade. Cada nível foi desenhado por quem
              passou 14 anos no SFN gerindo carteira Agro em banco privado —
              você leva o pedido pronto pra mesa e segue com a sua safra.
            </p>
          </div>
        </div>

        {/* Jornada Free → Ouro — contexto visual antes dos cards de preço */}
        <div style={{ marginBottom: 56 }}>
          <JornadaFluxograma
            tierAtual={tierLabel(tierAtual) as JornadaTierKey}
            variant="full"
            heading="Sua jornada, do Free ao Ouro."
            sub="Cada plano é o próximo passo lógico. Você só paga quando quer avançar — sem mensalidade, sem fidelidade."
            linkToPlanos={false}
          />
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="planos-grid"
        >
          {PLANOS.map((plano, i) => (
            <PlanoCard
              key={plano.id}
              plano={plano}
              delay={i + 1}
              processoId={processoId}
              vagasMentoria={plano.id === "mentoria" ? vagasMentoria : null}
              tierAtual={tierAtual}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="planos-trust"
        >
          <TrustCard
            icon={Icon.lock(16)}
            label="Pagamento seguro"
            sub="Processado pela Cakto · PIX, crédito, parcelado"
          />
          <TrustCard
            icon={Icon.check(16)}
            label="Acesso imediato"
            sub="Liberação automática após confirmação"
          />
          <TrustCard
            icon={Icon.doc(16)}
            label="Pagamento único"
            sub="Nenhuma cobrança recorrente"
          />
        </div>

        <p
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          Dúvida antes de comprar?{" "}
          <a
            href="mailto:paulocosta.contato1@gmail.com"
            style={{
              color: "var(--green)",
              textDecoration: "underline",
            }}
          >
            paulocosta.contato1@gmail.com
          </a>
        </p>
      </div>

      <style>{`
        @media (max-width: 1080px){
          .planos-grid{ grid-template-columns: 1fr !important; max-width: 560px; margin: 0 auto !important }
          .planos-header{ grid-template-columns: 1fr !important; gap: 32px !important; align-items: flex-start !important }
        }
        @media (max-width: 760px){
          .planos-trust{ grid-template-columns: 1fr !important }
        }
      `}</style>
    </DashboardShell>
  )
}

function PlanoCard({
  plano,
  processoId,
  vagasMentoria,
  tierAtual,
  delay,
}: {
  plano: Plano
  processoId: string | null
  vagasMentoria: VagasMentoriaApi | null
  tierAtual: Tier | null
  delay: number
}) {
  const ehMentoria = plano.id === "mentoria"
  const mentoriaEsgotada =
    ehMentoria && vagasMentoria !== null && vagasMentoria.vagas_restantes <= 0
  const jaPossui = tierAtual !== null && plano.id === tierAtual
  const tierInferior =
    tierAtual !== null && TIER_NIVEL[plano.id] < TIER_NIVEL[tierAtual]
  const bloqueadoPorPlano = jaPossui || tierInferior
  const desabilitado = !plano.href || mentoriaEsgotada || bloqueadoPorPlano
  const href = plano.href ? comRef(plano.href, processoId) : ""

  const accentColor =
    plano.accent === "gold"
      ? "var(--gold)"
      : plano.accent === "green"
      ? "var(--green)"
      : "var(--ink-2)"
  const glow =
    plano.accent === "gold" ? "gold" : plano.accent === "green" ? "green" : "none"

  const ctaDisabledLabel = jaPossui
    ? "Plano atual — você já tem esse acesso"
    : tierInferior
    ? "Incluso no seu plano"
    : mentoriaEsgotada
    ? "Esgotado — volte no próximo mês"
    : "Checkout em configuração"

  return (
    <div style={{ position: "relative" }}>
      {plano.destaque && (
        <div
          className="mono"
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg,#5cbd95,#2f7a5c)",
            color: "#07120d",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 999,
            zIndex: 3,
            boxShadow: "0 0 20px rgba(78,168,132,0.5)",
          }}
        >
          {plano.badge ?? "Mais escolhido"}
        </div>
      )}

      {jaPossui && (
        <div
          className="mono"
          style={{
            position: "absolute",
            top: -12,
            right: 20,
            background: "rgba(201,168,106,0.18)",
            color: "var(--gold)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 999,
            zIndex: 3,
            border: "1px solid rgba(201,168,106,0.45)",
          }}
        >
          Seu plano atual
        </div>
      )}

      {ehMentoria && vagasMentoria !== null && !jaPossui && (
        <div
          className="mono"
          style={{
            position: "absolute",
            top: -12,
            right: 20,
            background: mentoriaEsgotada
              ? "rgba(212,113,88,0.18)"
              : vagasMentoria.vagas_restantes <= 2
              ? "rgba(212,113,88,0.18)"
              : "rgba(201,168,106,0.18)",
            color: mentoriaEsgotada
              ? "var(--danger)"
              : vagasMentoria.vagas_restantes <= 2
              ? "var(--danger)"
              : "var(--gold)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 999,
            zIndex: 3,
            border: mentoriaEsgotada
              ? "1px solid rgba(212,113,88,0.40)"
              : vagasMentoria.vagas_restantes <= 2
              ? "1px solid rgba(212,113,88,0.40)"
              : "1px solid rgba(201,168,106,0.45)",
          }}
        >
          {mentoriaEsgotada
            ? "Esgotado este mês"
            : `${vagasMentoria.vagas_restantes}/${vagasMentoria.limite_mensal} vagas`}
        </div>
      )}

      <GlassCard
        glow={glow}
        padding={32}
        hover={!desabilitado}
        className={`reveal reveal-d${delay}`}
        style={
          plano.destaque && !desabilitado
            ? {
                border: "1px solid rgba(78,168,132,0.4)",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.06) inset," +
                  "0 -1px 0 rgba(0,0,0,0.3) inset," +
                  "0 30px 60px -30px rgba(0,0,0,0.8)," +
                  "0 0 80px -20px rgba(78,168,132,0.35)",
                transform: "translateY(-6px)",
              }
            : undefined
        }
      >
        <div
          style={{ minHeight: 560, display: "flex", flexDirection: "column" }}
        >
          <h3
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              color: accentColor,
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              margin: 0,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
            {plano.nome}
          </h3>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: "var(--muted)",
                letterSpacing: "-0.01em",
              }}
            >
              R$
            </span>
            <span
              style={{
                fontSize: 56,
                fontWeight: 500,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#fff",
              }}
            >
              {plano.preco}
            </span>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.12em",
              marginTop: 6,
              textTransform: "uppercase",
            }}
          >
            pagamento único · sem mensalidade
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              {plano.tagline}
            </div>
          </div>

          <div
            style={{ height: 1, background: "var(--line)", margin: "24px 0" }}
          />

          <div style={{ display: "grid", gap: 10, flex: 1 }}>
            {plano.features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 13.5,
                  color: f.destaque ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: f.destaque ? 500 : 400,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "rgba(78,168,132,0.15)",
                    color: "var(--green)",
                    flexShrink: 0,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Icon.check(10)}
                </span>
                {f.text}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            {desabilitado ? (
              <Button
                variant="ghost"
                size="lg"
                style={{
                  width: "100%",
                  opacity: 0.55,
                  cursor: "not-allowed",
                }}
              >
                {ctaDisabledLabel}
              </Button>
            ) : (
              <Button
                variant={plano.destaque ? "accent" : "ghost"}
                size="lg"
                href={href}
                external
                style={{ width: "100%" }}
              >
                {plano.cta} {Icon.arrow(14)}
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function TrustCard({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <GlassCard glow="none" padding={20} hover={false}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "rgba(78,168,132,0.12)",
            border: "1px solid rgba(78,168,132,0.25)",
            color: "var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink-2)",
            }}
          >
            {sub}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
