"use client"

import Link from "next/link"
import type { PlanoComercial } from "@/lib/plano"
import { DashboardShell } from "@/components/shell/DashboardShell"
import { Eyebrow } from "@/components/landing/primitives"
import { MfaSetupBlock } from "@/components/conta/MfaSetupBlock"

function tierToTopbar(
  plano: PlanoComercial,
): "free" | "Bronze" | "Prata" | "Ouro" {
  if (plano === "Bronze") return "Bronze"
  if (plano === "Prata") return "Prata"
  if (plano === "Ouro") return "Ouro"
  return "free"
}

export default function SegurancaClient({
  nome,
  email,
  plano,
  userId,
}: {
  nome: string
  email: string
  plano: PlanoComercial
  userId?: string | null
}) {
  return (
    <DashboardShell
      nome={nome}
      email={email}
      tier={tierToTopbar(plano)}
      containerStyle={{ maxWidth: 820 }}
      userId={userId}
    >
      <div style={{ marginBottom: 40 }}>
        <Eyebrow>Sua conta · Segurança</Eyebrow>
        <h1
          style={{
            margin: "14px 0 8px",
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
          }}
        >
          Segurança da conta
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          Proteja sua conta com verificação em duas etapas. Mesmo que alguém
          descubra sua senha, sem o código do app autenticador não consegue
          entrar.
        </p>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <MfaSetupBlock />
      </div>

      <p
        style={{
          marginTop: 32,
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        Para gerenciar seus dados pessoais (LGPD Art. 18), vá em{" "}
        <Link
          href="/conta/dados"
          style={{ color: "var(--green)", textDecoration: "underline" }}
        >
          Meus dados
        </Link>
        . Reportar vulnerabilidade de segurança?{" "}
        <Link
          href="/seguranca"
          style={{ color: "var(--green)", textDecoration: "underline" }}
        >
          /seguranca
        </Link>
        .
      </p>
    </DashboardShell>
  )
}
