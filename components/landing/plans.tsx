"use client"

import {
  Container,
  SectionLabel,
  Button,
  Icon,
  GlassCard,
  useReveal,
} from "./primitives"

type Plan = {
  price: string
  name: string
  tagline: string
  desc: string
  features: string[]
  cta: string
  highlight: boolean
  accent: "muted" | "green" | "gold"
}

const PLANS: Plan[] = [
  {
    price: "29,99",
    name: "Diagnóstico Rápido",
    tagline: "Chegue na agência sabendo o que falar.",
    desc:
      "Leitura técnica do seu caso antes de qualquer reunião. Ideal para entender se vale ir ao banco agora ou ajustar antes.",
    features: [
      "Liberação imediata da IA para entrevista técnica",
      "PDF tático de posicionamento bancário",
      "Roteiro do que dizer — e do que NÃO falar — ao gerente",
      "Leitura crítica do seu perfil em linguagem de comitê",
    ],
    cta: "Fazer diagnóstico",
    highlight: false,
    accent: "muted",
  },
  {
    price: "297,99",
    name: "Dossiê Bancário Completo",
    tagline: "O pedido pronto pra sentar na mesa do comitê.",
    desc:
      "A entrega completa: dossiê institucional montado pela consultoria sênior, no formato que o comitê espera ver.",
    features: [
      "Tudo do Diagnóstico Rápido",
      "Dossiê Bancário profissional em PDF",
      "Sumário executivo e checklist 100% ordenado",
      "Documentos anexados no padrão do banco",
      "Defesa de Crédito em linguagem de comitê",
      "Roteiro de Visita Técnica do analista",
    ],
    cta: "Quero o dossiê completo",
    highlight: true,
    accent: "green",
  },
  {
    price: "697,99",
    name: "Acesso à Mesa de Crédito",
    tagline: "Revisão cirúrgica com quem sentava na mesa.",
    desc:
      "Para operações maiores, estruturação de investimento ou quando a janela da safra não admite erro.",
    features: [
      "Tudo do Dossiê Completo",
      "Consultoria pessoal e direta com o fundador",
      "Revisão minuciosa do seu dossiê",
      "Correção de gargalos ocultos antes do banco ver",
      "Alinhamento estratégico com ótica de comitê",
    ],
    cta: "Quero a mentoria",
    highlight: false,
    accent: "gold",
  },
]

function PlanCard({ plan, delay }: { plan: Plan; delay: number }) {
  const accentColor =
    plan.accent === "gold"
      ? "var(--gold)"
      : plan.accent === "green"
      ? "var(--green)"
      : "var(--ink-2)"
  const glow =
    plan.accent === "gold" ? "gold" : plan.accent === "green" ? "green" : "none"

  return (
    <div
      className={`reveal reveal-d${delay}`}
      style={{ position: "relative" }}
    >
      {plan.highlight && (
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
          Mais escolhido
        </div>
      )}
      <GlassCard
        glow={glow}
        padding={32}
        style={
          plan.highlight
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
          style={{ minHeight: 540, display: "flex", flexDirection: "column" }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              color: accentColor,
              textTransform: "uppercase",
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
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
            {plan.name}
          </div>

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
              {plan.price}
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
              {plan.tagline}
            </div>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--muted)",
              }}
            >
              {plan.desc}
            </p>
          </div>

          <div
            style={{
              height: 1,
              background: "var(--line)",
              margin: "24px 0",
            }}
          />

          <div style={{ display: "grid", gap: 10, flex: 1 }}>
            {plan.features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 13.5,
                  color: "var(--ink-2)",
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
                {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <Button
              size="lg"
              variant={plan.highlight ? "accent" : "ghost"}
              href="/planos"
              style={{ width: "100%" }}
            >
              {plan.cta} {Icon.arrow(14)}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export function Plans() {
  useReveal()
  return (
    <section
      id="planos"
      style={{ padding: "140px 0", position: "relative" }}
    >
      <div
        className="ambient"
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
      <Container style={{ position: "relative" }}>
        <SectionLabel num="06" label="Planos e preços" />
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            alignItems: "flex-end",
            marginBottom: 64,
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: "clamp(36px, 4.8vw, 60px)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              Três estruturas.
              <br />
              <span style={{ color: "var(--muted)" }}>
                Um padrão de qualidade.
              </span>
            </h2>
          </div>
          <div className="reveal reveal-d1">
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: 0,
                maxWidth: 480,
              }}
            >
              Sem mensalidade, sem fidelidade. Você paga pela entrega técnica —
              e só depois que a gente ver chance real de aprovação no seu caso.
            </p>
          </div>
        </div>

        <div
          className="plans-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {PLANS.map((p, i) => (
            <PlanCard key={i} plan={p} delay={i + 1} />
          ))}
        </div>

        <div
          className="reveal reveal-d4"
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--muted)",
            fontSize: 13,
          }}
        >
          {Icon.lock(14)} Todos os planos incluem criptografia de dados e
          conformidade LGPD integral.
        </div>
      </Container>

      <style>{`
        @media (max-width: 1080px){
          .plans-grid{ grid-template-columns: 1fr !important; max-width: 560px; margin: 0 auto !important }
          .two-col{ grid-template-columns: 1fr !important; gap: 32px !important; align-items: flex-start !important }
        }
      `}</style>
    </section>
  )
}
