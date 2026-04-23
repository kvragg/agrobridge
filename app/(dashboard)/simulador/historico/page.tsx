import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPlanoAtual } from "@/lib/plano"
import { HistoricoClient } from "@/components/simulador/HistoricoClient"
import { FreePaywall } from "@/components/simulador/FreePaywall"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Histórico de simulações · AgroBridge",
  robots: { index: false, follow: false },
}

export default async function HistoricoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/simulador/historico")

  const plano = await getPlanoAtual()
  if (plano.tier === null) {
    return <FreePaywall titulo="Histórico disponível no Bronze." />
  }

  return <HistoricoClient />
}
