import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/shell/DashboardShell"
import type { TopbarTier } from "@/components/shell/Topbar"
import { getPlanoAtual } from "@/lib/plano"
import type { PlanoComercial } from "@/lib/plano"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

function planoToTier(plano: PlanoComercial): TopbarTier {
  if (plano === "Bronze") return "Bronze"
  if (plano === "Prata") return "Prata"
  if (plano === "Ouro") return "Ouro"
  return "free"
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const nome =
    (user.user_metadata?.nome as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "Produtor"

  const plano = await getPlanoAtual()

  return (
    <DashboardShell
      nome={nome}
      email={user.email ?? null}
      tier={planoToTier(plano.plano)}
      userId={user.id}
    >
      {children}
    </DashboardShell>
  )
}
