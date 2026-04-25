import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanoAtual } from "@/lib/plano"
import { Eyebrow } from "@/components/landing/primitives"
import { ChecklistGenerico } from "@/components/checklist/ChecklistGenerico"
import { CadastroBancarioBlock } from "@/components/checklist/CadastroBancarioBlock"
import { EtapasFluxoCredito } from "@/components/checklist/EtapasFluxoCredito"
import { CarrosselEducativo } from "@/components/checklist/CarrosselEducativo"
import type { LeadType, SocioPJ } from "@/types/perfil-lead"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Documentos do crédito · AgroBridge",
  robots: { index: false, follow: false },
}

/**
 * /checklist (sem id) — comportamento:
 *  1. Se user tem processo com pagamento confirmado: redireciona pro
 *     checklist personalizado em /checklist/[id]
 *  2. Senão (sem processo ou só free): mostra o checklist GENÉRICO
 *     com docs core do crédito rural + banner pra entrevista
 *
 * Carrega contexto do lead (nome, lead_type, sócios, finalidade) pra
 * personalizar greeting e filtrar docs não aplicáveis. UX é o ponto
 * de maior abandono — quanto menos ruído, melhor.
 */
export default async function ChecklistIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/checklist")

  const admin = createAdminClient()
  const { data } = await admin
    .from("processos")
    .select("id")
    .eq("user_id", user.id)
    .eq("pagamento_confirmado", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data?.id) {
    redirect(`/checklist/${data.id}`)
  }

  // Sem processo pago — render genérico (acessível a TODOS, inclusive Free)
  const plano = await getPlanoAtual()
  const isFree = plano.tier === null

  // Carrega perfil_lead pra greeting + lead_type + finalidade
  const { data: perfil } = await admin
    .from("perfis_lead")
    .select("nome, lead_type, finalidade_credito, memoria_ia")
    .eq("user_id", user.id)
    .maybeSingle()

  const nome = (perfil?.nome ?? null) as string | null
  const leadType: LeadType = (perfil?.lead_type as LeadType | undefined) ?? "pf"

  // Heurística simples pra inferir investimento/Pronaf a partir da finalidade
  const finalidade = String(perfil?.finalidade_credito ?? "").toLowerCase()
  const investimento =
    finalidade.includes("investimento") ||
    finalidade.includes("aquisição") ||
    finalidade.includes("aquisicao") ||
    finalidade.includes("pronamp") ||
    finalidade.includes("inovagro") ||
    finalidade.includes("moderfrota") ||
    finalidade.includes("abc")
  const pronaf = finalidade.includes("pronaf")

  // Estado civil pode estar em memoria_ia (entrevista grava lá) — heurística defensiva
  const memoriaCasado = (() => {
    const m = perfil?.memoria_ia as Record<string, unknown> | null
    if (!m) return false
    const ec = String(m.estado_civil ?? "").toLowerCase()
    return ec.includes("casad") || ec.includes("uniao") || ec.includes("união")
  })()

  // Sócios (só se PJ)
  let socios: SocioPJ[] = []
  if (leadType === "pj") {
    const { data: sociosData } = await admin
      .from("perfil_socios")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
    socios = (sociosData ?? []) as SocioPJ[]
  }

  // Detecta se já fez ao menos 1 mensagem na entrevista (heurística simples)
  const { count } = await admin
    .from("mensagens")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")

  const fezEntrevista = (count ?? 0) >= 3

  // Etapa ativa: 2 (cadastro) se já fez entrevista, senão 1
  const etapaAtiva = fezEntrevista ? 2 : 1
  const tierLabel = (() => {
    if (plano.plano === "Bronze") return "Bronze" as const
    if (plano.plano === "Prata") return "Prata" as const
    if (plano.plano === "Ouro") return "Ouro" as const
    return "free" as const
  })()

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <Eyebrow>Documentos necessários para o crédito rural</Eyebrow>
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
          Documentos do crédito — passo a passo.
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
          Antes de juntar papel, seu cadastro no banco precisa estar
          atualizado — esse é o maior motivo de reprovação hoje. Comece
          pela etapa abaixo, depois siga pra documentação.
        </p>
      </header>

      <EtapasFluxoCredito etapaAtiva={etapaAtiva} entrevistaConcluida={fezEntrevista} />

      {/* Carrossel educativo — 6 slides com mensagens diretas sobre
          cadastro bancário, valor de mercado, fluxo AgroBridge.
          Posicionado ANTES do bloco detalhado pra prender atenção. */}
      <CarrosselEducativo tier={tierLabel} />

      <CadastroBancarioBlock tier={tierLabel} />

      <ChecklistGenerico
        nome={nome}
        leadType={leadType}
        socios={socios}
        casado={memoriaCasado}
        investimento={investimento}
        pronaf={pronaf}
        fezEntrevista={fezEntrevista}
        isFree={isFree}
      />
    </div>
  )
}
