import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanoAtual } from "@/lib/plano"
import { Eyebrow } from "@/components/landing/primitives"
import { ChecklistTabs } from "@/components/checklist/ChecklistTabs"
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
 *  2. Senão (sem processo ou só free): mostra a versão genérica em 3
 *     abas (Cadastro / Crédito Rural / Dossiê). Cada aba é uma view
 *     focada — anti-overwhelm pra lead com TDAH no celular no trator.
 *
 * Carrega contexto (nome, lead_type, finalidade, sócios) pra:
 *   - Personalizar greeting e gate PF/PJ
 *   - Pré-marcar refinos de investimento/Pronaf da finalidade
 *   - Pré-marcar refino "casado" da memoria_ia
 *   - Listar sócios já cadastrados (PJ)
 */
export default async function ChecklistIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/checklist")

  const admin = createAdminClient()
  const { data: processoPago } = await admin
    .from("processos")
    .select("id")
    .eq("user_id", user.id)
    .eq("pagamento_confirmado", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (processoPago?.id) {
    redirect(`/checklist/${processoPago.id}`)
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

  // Heurística pra inferir investimento/Pronaf da finalidade
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

  // Estado civil pode estar em memoria_ia (entrevista grava lá)
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

  // Heurística simples: já fez ao menos 3 mensagens de user na entrevista
  const { count } = await admin
    .from("mensagens")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")

  const fezEntrevista = (count ?? 0) >= 3

  return (
    <div>
      <header style={{ marginBottom: 22 }}>
        <Eyebrow>Documentos para o crédito rural</Eyebrow>
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
          Tudo que o banco vai pedir, em 3 passos.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--ink-2)",
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Cada aba é um foco — termina uma, segue pra próxima. No fim, a IA
          monta seu dossiê de defesa pronto pro comitê do banco.
        </p>
      </header>

      <ChecklistTabs
        nome={nome}
        leadType={leadType}
        socios={socios}
        casado={memoriaCasado}
        investimento={investimento}
        pronaf={pronaf}
        fezEntrevista={fezEntrevista}
        isFree={isFree}
        temProcessoPago={false /* já redirecionou se fosse true */}
        processoId={null}
      />
    </div>
  )
}
