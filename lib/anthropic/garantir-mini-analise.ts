import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import type { PerfilLead } from '@/types/perfil-lead'
import { gerarMiniAnalise } from './mini-analise'

/**
 * Garante que existe uma mini-análise persistida em
 * `perfis_lead.mini_analise_texto` pro lead. Idempotente:
 *
 *   - Se o cache existe → retorna sem gastar Sonnet.
 *   - Se não existe → gera, persiste, registra audit.
 *
 * Shared entre:
 *   - `/api/chat` (dispara em background na 5ª mensagem pra já deixar cacheado)
 *   - `/api/chat/mini-analise` (GET consultável pelo frontend)
 */
export async function garantirMiniAnalise(
  userId: string,
  perfil: PerfilLead,
): Promise<string | null> {
  if (perfil.mini_analise_texto) return perfil.mini_analise_texto

  const admin = createAdminClient()
  const texto = await gerarMiniAnalise(perfil)
  const agora = new Date().toISOString()

  const { error } = await admin
    .from('perfis_lead')
    .update({ mini_analise_texto: texto, mini_analise_gerada_em: agora })
    .eq('user_id', userId)

  if (error) {
    // A geração aconteceu com sucesso — o lead recebe o texto nessa
    // chamada mesmo sem cache persistir. Log pra investigação.
    capturarErroProducao(error, {
      modulo: 'garantir-mini-analise',
      userId,
      extra: { etapa: 'persistir_mini_analise' },
    })
  }

  await logAuditEvent({
    userId,
    eventType: 'mini_analise_gerada',
    payload: { caracteres: texto.length },
  })

  return texto
}
