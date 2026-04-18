// Server-only — nunca importar de client components.
// Envio de email transacional via API HTTP do Resend.
// Usa fetch para evitar dependência extra e erros de bundle.

interface DadosLead {
  nome: string
  email: string
  whatsapp: string
}

const RESEND_API = 'https://api.resend.com/emails'

export async function enviarLeadNotification(dados: DadosLead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const destino =
    process.env.LEAD_NOTIFICATION_EMAIL ?? 'paulocosta.contato1@gmail.com'

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY não configurada — lead não enviado')
    return
  }

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="border-left: 4px solid #166534; padding-left: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #166534; font-size: 20px;">Novo lead no AgroBridge</h1>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${escapeHtml(dataFormatada)}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Nome</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(dados.nome)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">E-mail</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(dados.email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">WhatsApp</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(dados.whatsapp)}</td>
        </tr>
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        Enviado automaticamente pelo AgroBridge.
      </p>
    </div>
  `.trim()

  const from =
    process.env.RESEND_FROM_EMAIL ?? 'AgroBridge <onboarding@resend.dev>'

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [destino],
      subject: `[AgroBridge] Novo cadastro: ${dados.nome}`,
      html,
      reply_to: dados.email,
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error('[Resend] Falha ao enviar lead:', res.status, txt)
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
