// Server-only — nunca importar de client components.
// Envio de email transacional via API HTTP do Resend (usa fetch direto).

interface DadosLead {
  nome: string
  email: string
  whatsapp: string
}

export type EmailResult =
  | { ok: true; resendId: string | null }
  | { ok: false; error: string; status?: number }

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
}): Promise<EmailResult> {
  const { apiKey, from } = getAuth()
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY ausente — email não enviado:', payload.subject)
    return { ok: false, error: 'RESEND_API_KEY ausente no ambiente' }
  }
  let res: Response
  try {
    res = await fetch(RESEND_API, {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Resend] fetch falhou', msg)
    return { ok: false, error: `fetch falhou: ${msg}` }
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error('[Resend] Falha ao enviar:', res.status, txt)
    return {
      ok: false,
      status: res.status,
      error: `Resend ${res.status}: ${txt.slice(0, 240)}`,
    }
  }
  const json = (await res.json().catch(() => null)) as { id?: string } | null
  return { ok: true, resendId: json?.id ?? null }
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

// Template: alerta_admin_novo_signup
// Dispara quando um novo lead se cadastra — vai para o admin monitorar o funil.
export async function enviarLeadNotification(dados: DadosLead): Promise<EmailResult> {
  const destino =
    process.env.LEAD_NOTIFICATION_EMAIL ?? 'paulocosta.contato1@gmail.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const html = wrap(`
    <div style="border-left: 4px solid #0f3d2e; padding-left: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #166534; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
        Novo signup · monitoramento do funil
      </p>
      <h1 style="margin: 4px 0 0; color: #0f3d2e; font-size: 20px;">${escapeHtml(dados.nome)} acabou de criar conta</h1>
      <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${escapeHtml(dataFormatada)}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 6px 0; color: #6b7280; width: 110px;">Nome</td>
        <td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dados.nome)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280;">E-mail</td>
        <td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dados.email)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280;">WhatsApp</td>
        <td style="padding: 6px 0; font-weight: 600;">${escapeHtml(dados.whatsapp)}</td>
      </tr>
    </table>
    <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">
      Ainda não interagiu com a IA. Fila: dashboard admin &rarr; Leads.
    </p>
    <p style="margin: 16px 0 0;">
      <a href="${siteUrl}/admin/leads" style="display:inline-block; background:#0f3d2e; color:#fff; padding:10px 18px; border-radius:999px; text-decoration:none; font-weight:500; font-size:13px;">
        Abrir painel de leads
      </a>
    </p>
  `)

  return enviarEmail({
    to: destino,
    subject: `[AgroBridge] Novo signup: ${dados.nome}`,
    html,
    reply_to: dados.email,
  })
}

// Template: dossie_pronto
// Dispara quando o dossiê final (PDF) é gerado com sucesso.
export async function enviarDossiePronto(input: {
  to: string
  nome: string
  processoId: string
}): Promise<EmailResult> {
  const { nome, processoId, to } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'}/checklist/${processoId}`
  const html = wrap(`
    <p style="margin:0 0 8px; color:#166534; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
      Dossiê pronto · pronto pra gerente
    </p>
    <h1 style="color:#0f3d2e; font-size:24px; margin:0 0 16px; line-height:1.2;">
      ${escapeHtml(nome)}, seu dossiê bancário está pronto.
    </h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      O PDF traz a defesa de crédito em linguagem de comitê, o checklist personalizado
      do seu perfil e todos os documentos anexados — no padrão que o analista do banco
      espera receber. Foi preparado por quem decidiu crédito por 14 anos dentro de um
      banco privado de grande porte.
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:600; font-size:14px;">
        Abrir e baixar o dossiê
      </a>
    </p>
    <div style="border-top: 1px solid #e3dfd4; padding-top: 18px; margin-top: 22px;">
      <p style="font-size:13px; color:#4b5563; line-height:1.55; margin:0 0 6px; font-weight:600;">
        Próximo passo:
      </p>
      <p style="font-size:13px; color:#4b5563; line-height:1.55; margin:0;">
        1. Revise o PDF. &nbsp; 2. Agende horário com o gerente. &nbsp; 3. Entregue o
        dossiê presencialmente ou por e-mail formal. Qualquer ajuste dá pra solicitar
        pela plataforma.
      </p>
    </div>
  `)
  return enviarEmail({
    to,
    subject: `AgroBridge · seu dossiê de crédito está pronto`,
    html,
  })
}

// Template: boas_vindas_apos_compra
// Dispara quando o webhook Cakto confirma pagamento. Serve como
// comprovante + onboarding — mostra o próximo passo conforme o tier.
export async function enviarPagamentoConfirmado(input: {
  to: string
  nome: string
  valor: number
  processoId: string
  tierNome?: string // "Bronze" | "Prata" | "Ouro"
}): Promise<EmailResult> {
  const { nome, valor, processoId, to, tierNome } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'}/checklist/${processoId}`
  const valorFmt = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const tierLabel = tierNome ? `plano ${escapeHtml(tierNome)}` : 'plano contratado'

  const proximoPasso = (() => {
    if (tierNome === 'Bronze') {
      return 'O próximo passo é abrir sua Análise de Viabilidade — ela te diz com qual linha de crédito e faixa de taxa seguir.'
    }
    if (tierNome === 'Ouro') {
      return 'O próximo passo é abrir sua conta e agendar os 30min de mentoria com o fundador (ex-bancário, 14 anos de mesa de crédito). Também já gero seu dossiê completo.'
    }
    return 'O próximo passo é abrir sua conta, concluir o checklist e gerar o dossiê completo — com a defesa técnica pronta pra entregar ao gerente.'
  })()

  const html = wrap(`
    <p style="margin:0 0 8px; color:#166534; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
      Pagamento confirmado · bem-vindo
    </p>
    <h1 style="color:#0f3d2e; font-size:24px; margin:0 0 16px; line-height:1.2;">
      ${escapeHtml(nome)}, sua conta no ${tierLabel} está ativa.
    </h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Pagamento de <strong>${valorFmt}</strong> confirmado com sucesso. Acesso liberado
      agora mesmo — é só entrar na conta.
    </p>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      ${proximoPasso}
    </p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#0f3d2e; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:600; font-size:14px;">
        Abrir minha conta
      </a>
    </p>
    <div style="border-top: 1px solid #e3dfd4; padding-top: 16px; margin-top: 20px;">
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0 0 4px;">
        Guarde este e-mail como comprovante. A nota fiscal, quando aplicável, sai em até 5 dias úteis.
      </p>
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0;">
        Se o pagamento não foi você, responda este e-mail imediatamente.
      </p>
    </div>
  `)
  return enviarEmail({
    to,
    subject: `AgroBridge · pagamento confirmado${tierNome ? ` · plano ${tierNome}` : ''}`,
    html,
  })
}

export async function enviarLembreteDocumentos(input: {
  to: string
  nome: string
  pendentes: string[]
  processoId: string
}): Promise<EmailResult> {
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
  return enviarEmail({
    to,
    subject: 'AgroBridge · documentos pendentes para seu dossiê',
    html,
  })
}

// ── LGPD — Exclusão de conta (dupla confirmação) ───────────────────

// Template: confirmar_exclusao_lgpd
// Dispara quando o lead pede exclusão da conta em /conta/dados. Dupla
// confirmação por e-mail (anti-acidente e anti-acesso-indevido).
export async function enviarConfirmacaoExclusao(input: {
  to: string
  nome: string
  urlConfirmacao: string
  expiraEmMinutos: number
}): Promise<EmailResult> {
  const { nome, urlConfirmacao, expiraEmMinutos, to } = input
  const html = wrap(`
    <p style="margin:0 0 8px; color:#991b1b; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
      Ação sensível · LGPD Art. 18
    </p>
    <h1 style="color:#991b1b; font-size:22px; margin:0 0 16px; line-height:1.25;">
      ${escapeHtml(nome)}, confirme a exclusão da sua conta
    </h1>
    <p style="font-size:15px; line-height:1.55; margin:0 0 14px;">
      Recebemos um pedido para excluir sua conta AgroBridge. Para ter certeza de
      que foi você, clique no botão abaixo <strong>dentro dos próximos
      ${expiraEmMinutos} minutos</strong>. Depois disso o link expira e você precisa
      pedir de novo.
    </p>
    <p style="margin:24px 0;">
      <a href="${urlConfirmacao}" style="display:inline-block; background:#991b1b; color:#fff; padding:13px 22px; border-radius:999px; text-decoration:none; font-weight:600; font-size:14px;">
        Confirmar exclusão
      </a>
    </p>

    <div style="border-left: 3px solid #e3dfd4; padding-left: 14px; margin: 22px 0;">
      <p style="font-size:13px; color:#4b5563; line-height:1.55; margin:0 0 8px; font-weight:600;">
        Não foi você que pediu?
      </p>
      <p style="font-size:13px; color:#4b5563; line-height:1.55; margin:0;">
        Ignore este e-mail — nada acontece sem o clique. Se desconfiar de acesso
        indevido, troque sua senha em <code>/resetar-senha</code> imediatamente.
      </p>
    </div>

    <div style="border-top: 1px solid #e3dfd4; padding-top: 18px; margin-top: 20px;">
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0 0 6px; font-weight:600;">
        O que a exclusão apaga:
      </p>
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0 0 10px;">
        Perfil, entrevistas, checklists, uploads e mensagens ficam invisíveis e
        bloqueados — seu acesso à plataforma é encerrado.
      </p>
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0 0 6px; font-weight:600;">
        O que permanece arquivado (obrigação fiscal):
      </p>
      <p style="font-size:12px; color:#6b6b64; line-height:1.55; margin:0;">
        Registros financeiros (compras, notas, webhooks de pagamento) ficam em
        modo arquivado por até 5 anos — exigência do CTN, art. 174. Detalhes
        na seção 7 da Política de Privacidade.
      </p>
    </div>
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
}): Promise<EmailResult> {
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
