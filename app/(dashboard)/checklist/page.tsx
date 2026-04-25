import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlanoAtual } from "@/lib/plano"
import { Eyebrow } from "@/components/landing/primitives"
import { ChecklistGenerico } from "@/components/checklist/ChecklistGenerico"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Checklist · AgroBridge",
  robots: { index: false, follow: false },
}

/**
 * /checklist (sem id) — comportamento:
 *  1. Se user tem processo com pagamento confirmado: redireciona pro
 *     checklist personalizado em /checklist/[id]
 *  2. Senão (sem processo ou só free): mostra o checklist GENÉRICO
 *     com 9 docs core do crédito rural + banner pra entrevista
 *
 * Decisão de produto (2026-04-25): remoção do gating. Antes essa rota
 * fazia redirect("/dashboard") quando sem processo, escondendo o
 * conteúdo justamente do lead que mais precisa dele.
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

  // Detecta se já fez ao menos 1 mensagem na entrevista (heurística simples)
  const { count } = await admin
    .from("mensagens")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")

  const fezEntrevista = (count ?? 0) >= 3

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <Eyebrow>Checklist</Eyebrow>
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
          Os documentos que o banco precisa ver.
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
          Lista padrão de crédito rural — válida pra qualquer modalidade
          (custeio, investimento, Pronaf). Cada item tem o passo-a-passo de
          onde emitir e o que evitar pra não perder tempo.
        </p>
      </header>

      <ChecklistGenerico fezEntrevista={fezEntrevista} isFree={isFree} />
    </div>
  )
}
