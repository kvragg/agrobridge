import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { logAuditEvent } from '@/lib/audit'
import {
  enviarLeadNotification,
  enviarDossiePronto,
  enviarPagamentoConfirmado,
  enviarConfirmacaoExclusao,
  type EmailResult,
} from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST /api/debug/template — admin-only
// Envia um dos 4 templates reais com dados sintéticos para validar
// copy, layout e credencial. Inclui retry com backoff em 429/5xx e
// registra tentativa no audit trail para rastreabilidade.

type TemplateId =
  | 'alerta_admin_novo_signup'
  | 'dossie_pronto'
  | 'boas_vindas_apos_compra'
  | 'confirmar_exclusao_lgpd'

const TEMPLATES_VALIDOS: TemplateId[] = [
  'alerta_admin_novo_signup',
  'dossie_pronto',
  'boas_vindas_apos_compra',
  'confirmar_exclusao_lgpd',
]

function isTemplate(v: unknown): v is TemplateId {
  return typeof v === 'string' && (TEMPLATES_VALIDOS as string[]).includes(v)
}

async function comRetry(
  fn: () => Promise<EmailResult>,
  maxTentativas = 3
): Promise<{ result: EmailResult; tentativas: number }> {
  let ultima: EmailResult = { ok: false, error: 'nunca executou' }
  for (let i = 1; i <= maxTentativas; i++) {
    const r = await fn()
    ultima = r
    if (r.ok) return { result: r, tentativas: i }
    const st = r.status ?? 0
    const deveRetry = st === 429 || (st >= 500 && st <= 599)
    if (!deveRetry || i === maxTentativas) {
      return { result: r, tentativas: i }
    }
    // backoff 500ms, 1500ms
    await new Promise((res) => setTimeout(res, i === 1 ? 500 : 1500))
  }
  return { result: ultima, tentativas: maxTentativas }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    template?: unknown
    to?: string
  }
  const template = isTemplate(body.template) ? body.template : null
  if (!template) {
    return NextResponse.json(
      { erro: 'template inválido', validos: TEMPLATES_VALIDOS },
      { status: 400 }
    )
  }
  const destino = body.to?.trim() || admin.email
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'
  const processoFake = '00000000-0000-0000-0000-000000000000'
  const nomeFake = '[TESTE] Produtor Rural'

  const { result, tentativas } = await comRetry(async () => {
    if (template === 'alerta_admin_novo_signup') {
      return enviarLeadNotification({
        nome: nomeFake,
        email: destino,
        whatsapp: '(67) 99999-0000',
      })
    }
    if (template === 'dossie_pronto') {
      return enviarDossiePronto({
        to: destino,
        nome: nomeFake,
        processoId: processoFake,
      })
    }
    if (template === 'boas_vindas_apos_compra') {
      return enviarPagamentoConfirmado({
        to: destino,
        nome: nomeFake,
        valor: 397.0,
        processoId: processoFake,
        tierNome: 'Prata',
      })
    }
    return enviarConfirmacaoExclusao({
      to: destino,
      nome: nomeFake,
      urlConfirmacao: `${siteUrl}/conta/excluir/confirmar?token=teste`,
      expiraEmMinutos: 30,
    })
  })

  void logAuditEvent({
    userId: admin.id,
    eventType: 'admin_debug_email',
    request,
    payload: {
      template,
      destino,
      tentativas,
      ok: result.ok,
      resend_id: result.ok ? result.resendId : null,
      status: !result.ok ? result.status ?? null : null,
      error: !result.ok ? result.error : null,
    },
  })

  return NextResponse.json(
    {
      ok: result.ok,
      template,
      to: destino,
      tentativas,
      resendId: result.ok ? result.resendId : null,
      status: !result.ok ? result.status ?? null : null,
      error: !result.ok ? result.error : null,
    },
    { status: result.ok ? 200 : 502 }
  )
}
