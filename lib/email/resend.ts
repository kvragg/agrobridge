// Server-only — nunca importar de client components.
// Envio de email transacional via API HTTP do Resend (usa fetch direto).

interface DadosLead {
  nome: string
  email: string
  whatsapp: string
}

const RESEND_API = 'https://api.resend.com/emails'

function getAuth() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? 'AgroBridge <onboarding@resend.dev>'
  return { apiKey, from }
}

async function enviarEmail(payload: {
  to: string | string[]
  subject: string
  html: string
  reply_to?: string
}): Promise<boolean> {
  const { apiKey, from } = getAuth()
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY ausente — email não enviado:', payload.subject)
    return false
  }
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.reply_to,
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error('[Resend] Falha ao enviar:', res.status, txt)
    return false
  }
  return true
}

function wrap(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2a2a2a; background: #f7f5f0;">
      <div style="background: #fff; border: 1px solid #e3dfd4; border-radius: 14px; padding: 32px;">
        ${content}
      </div>
      <p style="margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center;">
        AgroBridge · consultoria especializada em crédito rural
      </p>
    </div>
  `.trim()
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Templates ───────────────────────────────────────────────────────

export async function enviarLeadNotification(dados: DadosLead): Promise<void> {
  const destino =
    process.env.LEAD_NOTIFICATION_EMAIL ?? 'paulocosta.contato1@gmail.com'

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const html = wrap(`
    <div style="border-left: 4px solid #0f3d2e; padding-left: 16px; margin-bottom: 24px;">
      <h1 style="margin: 0; color: #0f3d2e; font-size: 20px;">Novo lead no AgroBridge</h1>
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
  `)

  await enviarEmail({
    to: destino,
    subject: `[AgroBridge] Novo cadastro: ${dados.nome}`,
    html,
    reply_to: dados.email,
  })
}

export async function enviarDossiePronto(input: {
  to: string
  nome: string
  processoId: string
}): Promise<void> {
  const { nome, processoId, to } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'}/checklist/${processoId}`
  const html = wrap(`
    <h1 style="color:#0f3d2e; font-size:22px; margin:0 0 16px;">Seu dossiê está pronto</h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Concluímos a montagem do seu dossiê técnico de crédito rural. O PDF com a defesa pró-aprovação,
      o checklist personalizado e os documentos anexados já está disponível na sua conta.
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:500; font-size:14px;">
        Abrir meu dossiê
      </a>
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0;">
      Revise antes de entregar ao seu gerente. Qualquer ajuste pode ser solicitado pela plataforma.
    </p>
  `)
  await enviarEmail({
    to,
    subject: 'AgroBridge · seu dossiê de crédito está pronto',
    html,
  })
}

export async function enviarPagamentoConfirmado(input: {
  to: string
  nome: string
  valor: number
  processoId: string
}): Promise<void> {
  const { nome, valor, processoId, to } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'}/checklist/${processoId}`
  const valorFmt = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const html = wrap(`
    <h1 style="color:#0f3d2e; font-size:22px; margin:0 0 16px;">Pagamento confirmado</h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Recebemos seu pagamento de <strong>${valorFmt}</strong>. O download do seu dossiê final está liberado.
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:500; font-size:14px;">
        Baixar dossiê final
      </a>
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0;">
      Guarde este e-mail como comprovante. A nota fiscal, se aplicável, será enviada em até 5 dias úteis.
    </p>
  `)
  await enviarEmail({
    to,
    subject: 'AgroBridge · pagamento confirmado',
    html,
  })
}

export async function enviarLembreteDocumentos(input: {
  to: string
  nome: string
  pendentes: string[]
  processoId: string
}): Promise<void> {
  const { nome, pendentes, processoId, to } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'}/checklist/${processoId}`
  const lista = pendentes
    .slice(0, 12)
    .map((d) => `<li style="margin-bottom:6px;">${escapeHtml(d)}</li>`)
    .join('')
  const html = wrap(`
    <h1 style="color:#0f3d2e; font-size:22px; margin:0 0 16px;">Documentos ainda pendentes</h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Seu dossiê já está em montagem, mas faltam alguns documentos para concluirmos:
    </p>
    <ul style="font-size:14px; line-height:1.55; margin:0 0 20px; padding-left:18px; color:#2a2a2a;">
      ${lista}
    </ul>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:500; font-size:14px;">
        Enviar documentos pendentes
      </a>
    </p>
  `)
  await enviarEmail({
    to,
    subject: 'AgroBridge · documentos pendentes para seu dossiê',
    html,
  })
}
