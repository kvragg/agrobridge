import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPlanoAtual } from "@/lib/plano"
import { Eyebrow } from "@/components/landing/primitives"
import { SimuladorClient } from "@/components/simulador/SimuladorClient"
import { FreePaywall } from "@/components/simulador/FreePaywall"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Simulador de Viabilidade · AgroBridge",
  description:
    "A mesma leitura que o comitê de crédito faz. Ajuste seu cenário e veja sua nota antes de protocolar no banco.",
  robots: { index: false, follow: false },
}

export default async function SimuladorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/simulador")

  const plano = await getPlanoAtual()
  const isFree = plano.tier === null

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <Eyebrow>Simulador AgroBridge</Eyebrow>
        <h1
          style={{
            margin: "12px 0 8px",
            fontSize: "clamp(28px, 3.6vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          A leitura que o comitê faz — antes do banco.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Ajuste seu cenário e veja sua nota de viabilidade em tempo real.
          Cada slider, cada toggle, cada garantia muda como o analista de
          crédito enxerga o seu pedido.
        </p>

        {!isFree && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/simulador/comparar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line-2)",
                borderRadius: 999,
                color: "var(--ink-2)",
                fontSize: 12.5,
                textDecoration: "none",
              }}
            >
              Comparar cenários
            </Link>
            <Link
              href="/simulador/historico"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line-2)",
                borderRadius: 999,
                color: "var(--ink-2)",
                fontSize: 12.5,
                textDecoration: "none",
              }}
            >
              Histórico
            </Link>
          </div>
        )}
      </header>

      {isFree ? (
        <FreePaywall titulo="Disponível a partir do plano Bronze." />
      ) : (
        <SimuladorClient podeSalvar />
      )}
    </div>
  )
}
