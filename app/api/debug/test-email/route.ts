import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const maxDuration = 20

// POST /api/debug/test-email
// Admin-only — envia um email de teste via Resend e retorna status + id.
// Usado pra diagnosticar credencial/domínio antes de ligar novo canal em prod.
//
// Body: { to: string, subject?: string }
// Resposta: { ok, resendId?, status?, error?, from, has_key }

const RESEND_API = 'https://api.resend.com/emails'

export async function POST(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    to?: string
    subject?: string
  }
  const destino = body.to?.trim() || admin.email
  const subject = body.subject?.slice(0, 120) || 'AgroBridge · Teste Resend'

  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL ?? 'AgroBridge <onboarding@resend.dev>'

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'RESEND_API_KEY ausente',
        from,
        has_key: false,
      },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [destino],
        subject,
        html: `<p>Teste enviado por <strong>${admin.email}</strong> em ${new Date().toISOString()}.</p>
<p>Se você recebeu isso, o Resend está configurado (domínio validado, API key OK, quota disponível).</p>`,
      }),
    })
    const rawTxt = await res.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(rawTxt) as Record<string, unknown>
    } catch {
      data = { _raw: rawTxt.slice(0, 400) }
    }

    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        resendId: typeof data.id === 'string' ? data.id : null,
        error: res.ok
          ? null
          : typeof data.message === 'string'
            ? data.message
            : rawTxt.slice(0, 400),
        from,
        to: destino,
        has_key: true,
      },
      { status: res.ok ? 200 : 502 }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        ok: false,
        error: `fetch falhou: ${msg}`,
        from,
        has_key: true,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }
  return NextResponse.json({
    has_key: !!process.env.RESEND_API_KEY,
    from:
      process.env.RESEND_FROM_EMAIL ??
      'AgroBridge <onboarding@resend.dev>',
    hint:
      'POST com { to?: string } para enviar teste. Se vazio, envia pro próprio admin.',
  })
}
