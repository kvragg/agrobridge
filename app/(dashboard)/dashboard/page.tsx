import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanoAtual } from "@/lib/plano"
import { redirect } from "next/navigation"
import type { PerfilLead } from "@/types/perfil-lead"
import { DashboardView } from "./DashboardView"

export const dynamic = "force-dynamic"

interface ProcessoResumo {
  id: string
  perfil_json: Record<string, unknown> | null
  pagamento_confirmado: boolean
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard")

  const admin = createAdminClient()

  const [{ data: perfilRaw }, plano, { data: processosRaw }, { data: simulacoesRaw }] = await Promise.all([
    admin.from("perfis_lead").select("*").eq("user_id", user.id).maybeSingle(),
    getPlanoAtual(),
    admin
      .from("processos")
      .select("id, perfil_json, pagamento_confirmado, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    // Histórico das últimas 12 simulações (v1.1 — Frente B). Alimenta
    // KPI da última + widget de evolução com sparkline. Limit 12
    // garante até 90d de história em uso normal sem inflar payload.
    admin
      .from("simulacoes")
      .select("score, cultura, valor_pretendido, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  const perfil = (perfilRaw ?? null) as PerfilLead | null
  const processos = (processosRaw ?? []) as ProcessoResumo[]
  const historicoSimulacoes = (simulacoesRaw ?? []).map((s) => ({
    score: s.score as number,
    cultura: s.cultura as string,
    valor_pretendido: s.valor_pretendido as number,
    created_at: s.created_at as string,
  }))
  const nomeCurto =
    perfil?.nome?.split(" ")[0] ??
    (user.user_metadata?.nome as string | undefined)?.split(" ")[0] ??
    "produtor"

  return (
    <DashboardView
      plano={plano.plano}
      perfil={perfil}
      processos={processos}
      nomeCurto={nomeCurto}
      historicoSimulacoes={historicoSimulacoes}
    />
  )
}
