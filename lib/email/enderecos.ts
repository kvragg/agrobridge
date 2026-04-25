import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export interface EnderecosUsuario {
  /** Email cadastrado em auth.users — fonte da verdade pra identidade. */
  emailPrincipal: string
  /** Email pessoal alternativo opcional (perfis_lead.email_alternativo).
   *  Quando email principal é corporativo (Sicredi/BB/gov), usar pra envio
   *  duplo automático via enviarComFallbackCorporativo(). */
  emailAlternativo: string | null
  /** Nome curto pra usar em saudações (do perfis_lead.nome ou
   *  user_metadata.nome ou fallback). */
  nome: string
}

/**
 * Carrega endereços de email de um usuário pra uso em templates de email
 * transacional. Centralizado aqui pra evitar copiar `select email_alternativo`
 * em cada route handler.
 *
 * Uso típico:
 *
 *   const enderecos = await getEnderecosUsuario(userId)
 *   if (!enderecos) return // user deletado
 *   await enviarDossiePronto({
 *     emailPrincipal: enderecos.emailPrincipal,
 *     emailAlternativo: enderecos.emailAlternativo,
 *     nome: enderecos.nome,
 *     processoId,
 *   })
 */
export async function getEnderecosUsuario(
  userId: string,
): Promise<EnderecosUsuario | null> {
  const admin = createAdminClient()

  const [{ data: userRes }, { data: perfil }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from('perfis_lead')
      .select('nome, email_alternativo')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const user = userRes?.user
  if (!user || !user.email) return null

  const nomeMeta = (user.user_metadata?.nome as string | undefined) ?? null
  const nome = perfil?.nome ?? nomeMeta ?? user.email.split('@')[0] ?? 'produtor'

  // Sanitização defensiva: não usar alternativo se for igual ao principal
  // (perde a redundância) ou se vier vazio.
  const altRaw = (perfil?.email_alternativo ?? '').trim().toLowerCase()
  const alt =
    altRaw && altRaw !== user.email.toLowerCase() ? altRaw : null

  return {
    emailPrincipal: user.email,
    emailAlternativo: alt,
    nome,
  }
}
