import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * /checklist (sem id) — redireciona pro checklist do último processo
 * ativo do usuário. Se não tiver, manda pro /dashboard.
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
  redirect("/dashboard")
}
