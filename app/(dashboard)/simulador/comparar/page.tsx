import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPlanoAtual } from "@/lib/plano"
import { ComparadorClient } from "@/components/simulador/ComparadorClient"
import { FreePaywall } from "@/components/simulador/FreePaywall"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Comparar cenários · Simulador AgroBridge",
  robots: { index: false, follow: false },
}

export default async function CompararPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/simulador/comparar")

  const plano = await getPlanoAtual()
  if (plano.tier === null) {
    return <FreePaywall titulo="Comparador disponível no Bronze." />
  }

  return <ComparadorClient />
}
