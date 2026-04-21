import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { extrairIp } from '@/lib/validation'

export type AuditEventType =
  | 'signup'
  | 'login'
  | 'login_falha'
  | 'processo_criado'
  | 'processo_excluido'
  | 'documento_validado'
  | 'dossie_gerado'
  | 'viabilidade_gerada'
  | 'pagamento_confirmado'
  | 'conta_exportada'
  | 'conta_exclusao_solicitada'
  | 'conta_excluida'

interface LogParams {
  userId: string | null
  eventType: AuditEventType
  targetId?: string | null
  request?: Request
  payload?: Record<string, unknown>
}

// Grava um evento na trilha append-only `audit_events`.
// Falha SILENCIOSAMENTE — auditoria nunca pode quebrar o request principal.
// Use fire-and-forget (sem await em caminho crítico) sempre que possível.
export async function logAuditEvent(params: LogParams): Promise<void> {
  try {
    const admin = createAdminClient()
    const ip = params.request ? extrairIp(params.request) : null
    const ua = params.request?.headers.get('user-agent') ?? null
    await admin.from('audit_events').insert({
      user_id: params.userId,
      event_type: params.eventType,
      target_id: params.targetId ?? null,
      ip,
      user_agent: ua,
      payload: params.payload ?? null,
    })
  } catch (err) {
    console.error('[audit] falha ao gravar evento', params.eventType, err)
  }
}
