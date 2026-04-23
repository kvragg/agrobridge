"use client"

import { Button, GlassCard, Icon } from "@/components/landing/primitives"

/**
 * Paywall reutilizável das 3 páginas do simulador (/simulador,
 * /simulador/comparar, /simulador/historico). Mostrado quando user é
 * Free. Client component porque chama Icon (que é client-only via
 * primitives "use client").
 */
export function FreePaywall({
  titulo,
  ctaLabel = "Ver planos",
}: {
  titulo: string
  ctaLabel?: string
}) {
  return (
    <GlassCard glow="gold" padding={48} hover={false}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(201,168,106,0.12)",
            border: "1px solid rgba(201,168,106,0.35)",
            color: "var(--gold)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          {Icon.lock(28)}
        </div>
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          {titulo}
        </h2>
        <p
          style={{
            margin: "0 0 22px",
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          O simulador completo com radar, plano de subida, comparador de
          cenários e histórico — desbloqueia a partir do{" "}
          <strong style={{ color: "var(--gold)" }}>
            Diagnóstico Rápido (R$ 29,99)
          </strong>
          . Pagamento único.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="accent" size="lg" href="/planos">
            {ctaLabel} {Icon.arrow(15)}
          </Button>
          <Button variant="ghost" size="lg" href="/dashboard">
            Voltar
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}
