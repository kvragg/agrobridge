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
        AgroBridge · feito por quem decidiu crédito por 14 anos dentro do banco
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
      O PDF já traz a defesa de crédito em linguagem de comitê, o checklist ordenado e os
      documentos anexados no padrão que o analista do banco espera receber. Foi preparado por
      quem decidiu crédito por 14 anos dentro de um banco privado de grande porte.
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:500; font-size:14px;">
        Abrir meu dossiê
      </a>
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0;">
      Revise antes de entregar. Qualquer ajuste pode ser solicitado pela plataforma.
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
      Pagamento de <strong>${valorFmt}</strong> confirmado. Liberação imediata — seu dossiê
      final já está na conta, no padrão que o analista do banco usa pra defender o pedido.
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
    <h1 style="color:#0f3d2e; font-size:22px; margin:0 0 16px;">Falta pouco pro dossiê fechar</h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Sem esses documentos o dossiê não fecha — e a janela do banco pra decidir costuma ser
      curta. Envie quando puder, leva só alguns minutos:
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

// ── LGPD — Exclusão de conta (dupla confirmação) ───────────────────

export async function enviarConfirmacaoExclusao(input: {
  to: string
  nome: string
  urlConfirmacao: string
  expiraEmMinutos: number
}): Promise<boolean> {
  const { nome, urlConfirmacao, expiraEmMinutos, to } = input
  const html = wrap(`
    <h1 style="color:#991b1b; font-size:22px; margin:0 0 16px;">
      Confirme a exclusão da sua conta
    </h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Recebemos um pedido de exclusão da sua conta AgroBridge. Para confirmar,
      clique no botão abaixo em até <strong>${expiraEmMinutos} minutos</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${urlConfirmacao}" style="display:inline-block; background:#991b1b; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:500; font-size:14px;">
        Confirmar exclusão da conta
      </a>
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0 0 8px;">
      Você NÃO iniciou esse pedido? Ignore este e-mail — nada acontece sem
      confirmação. Se desconfiar de acesso indevido, troque sua senha em /resetar-senha.
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0;">
      A exclusão é imediata: seus processos, entrevistas, checklists e uploads ficam
      invisíveis e bloqueados para uso. Por obrigação fiscal, os registros financeiros
      são mantidos em modo arquivado conforme a Política de Privacidade (seção 7).
    </p>
  `)
  return enviarEmail({
    to,
    subject: 'AgroBridge · confirme a exclusão da sua conta',
    html,
  })
}

export async function enviarExportacaoPronta(input: {
  to: string
  nome: string
}): Promise<boolean> {
  const { nome, to } = input
  const html = wrap(`
    <h1 style="color:#0f3d2e; font-size:22px; margin:0 0 16px;">
      Exportação de dados concluída
    </h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">Olá, ${escapeHtml(nome)}.</p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Sua exportação de dados (LGPD Art. 18) foi gerada com sucesso e baixada
      pelo seu navegador. Se você não solicitou, redefina sua senha imediatamente
      em /resetar-senha e fale conosco.
    </p>
    <p style="font-size:13px; color:#6b6b64; margin:0;">
      Este e-mail é apenas uma confirmação — ele não contém o arquivo exportado.
    </p>
  `)
  return enviarEmail({
    to,
    subject: 'AgroBridge · exportação de dados concluída',
    html,
  })
}
