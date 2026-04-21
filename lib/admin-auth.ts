import 'server-only'
import { createClient } from '@/lib/supabase/server'

// Admins autorizados a ver `/admin/*` e chamar `/api/admin/*`.
// Controlado por env var ADMIN_EMAILS (CSV). Fallback: email do fundador.
const FALLBACK = 'paulocosta.contato1@gmail.com'

export function listarEmailsAdmin(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? FALLBACK
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return listarEmailsAdmin().includes(email.toLowerCase())
}

// Retorna o user autenticado se for admin; null caso contrário.
// Pensado para páginas server + endpoints de API: quem chama decide
// redirect/403.
export async function getAdminUser(): Promise<{
  id: string
  email: string
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  if (!isEmailAdmin(user.email)) return null
  return { id: user.id, email: user.email }
}
