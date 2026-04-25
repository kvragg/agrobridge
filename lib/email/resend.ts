// Server-only — nunca importar de client components.
// Envio de email transacional via API HTTP do Resend (usa fetch direto).
// Visual dark premium alinhado com a landing (tokens: #070809, #4ea884, #c9a86a).

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

// ── Design tokens (hardcoded — email não suporta CSS vars) ─────────
const T = {
  bg: '#070809',
  bg1: '#0b0d0f',
  surface: '#14181c',
  ink: '#f3f4f2',
  ink2: '#c9ccc8',
  muted: '#7e8580',
  faint: '#4a4f4c',
  green: '#4ea884',
  green2: '#2f7a5c',
  greenDim: 'rgba(78,168,132,0.14)',
  gold: '#c9a86a',
  goldDim: 'rgba(201,168,106,0.12)',
  danger: '#d47158',
  line: 'rgba(255,255,255,0.08)',
  line2: 'rgba(255,255,255,0.12)',
  fontStack:
    "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif",
  monoStack: "'Geist Mono',ui-monospace,'SF Mono','Consolas',monospace",
}

// ── Logo inline SVG (arch + wheat keystone) ────────────────────────
const LOGO_SVG = `
<svg width="22" height="22" viewBox="0 0 28 28" fill="none" style="vertical-align: middle;">
  <path d="M4 23 Q14 23 14 6" stroke="${T.ink}" stroke-width="1.9" stroke-linecap="round" fill="none"/>
  <path d="M24 23 Q14 23 14 6" stroke="${T.ink}" stroke-width="1.9" stroke-linecap="round" fill="none"/>
  <path d="M8.5 17 L19.5 17" stroke="${T.ink}" stroke-width="1.9" stroke-linecap="round"/>
  <ellipse cx="14" cy="5.2" rx="1.6" ry="2.6" fill="${T.gold}"/>
</svg>
`.trim()

// ── Wrapper dark premium ───────────────────────────────────────────
// Estrutura à prova de cliente de email (Gmail/Outlook/Apple Mail):
//   - Tabelas pra layout (Outlook Desktop exige)
//   - Inline styles (clientes limpam <style>)
//   - meta color-scheme pra dark mode explícito
//   - max-width 600 pra mobile-friendly
//   - Fallback de fonte (Geist → system stack)
function wrap(content: string, preheader = ''): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>AgroBridge</title>
</head>
<body style="margin:0;padding:0;background:${T.bg};color:${T.ink};font-family:${T.fontStack};-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;overflow:hidden;line-height:1;opacity:0;max-height:0;max-width:0;">${preheader}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${T.bg};">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Topo: logo + wordmark -->
          <tr>
            <td style="padding:0 4px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:8px;line-height:0;">${LOGO_SVG}</td>
                  <td style="font-family:${T.fontStack};font-size:17px;font-weight:500;color:${T.ink};letter-spacing:-0.02em;">AgroBridge</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="
              background:linear-gradient(180deg,#16191d 0%,#0d1013 100%);
              border:1px solid ${T.line2};
              border-radius:20px;
              padding:40px 36px;
              box-shadow:0 20px 40px -20px rgba(0,0,0,0.7);
            ">
              ${content}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:32px 4px 0;">
              <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">
                AgroBridge · consultoria sênior em crédito rural
              </p>
              <p style="margin:0;font-family:${T.fontStack};font-size:12px;line-height:1.55;color:${T.faint};">
                Construído por quem viveu aprovações e recusas por dentro do banco.
                14 anos no SFN · Gestor de carteira Agro · Ex-banco privado.
              </p>
              <p style="margin:14px 0 0;font-family:${T.fontStack};font-size:11px;color:${T.faint};">
                Recebeu por engano? Ignore este e-mail — nenhuma ação é executada sem seu clique.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Helpers de composição dentro do card ──────────────────────────
// Todos usam inline styles e cores do tema T.

function eyebrow(text: string, color = T.green): string {
  return `<p style="margin:0 0 12px;font-family:${T.monoStack};font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:${color};">
    <span style="display:inline-block;width:6px;height:6px;background:${color};border-radius:50%;vertical-align:middle;margin-right:8px;"></span>${escapeHtml(text)}
  </p>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${T.fontStack};font-size:26px;font-weight:500;letter-spacing:-0.025em;line-height:1.2;color:${T.ink};">${text}</h1>`
}

function p(text: string, muted = false): string {
  return `<p style="margin:0 0 14px;font-family:${T.fontStack};font-size:15px;line-height:1.6;color:${muted ? T.ink2 : T.ink};">${text}</p>`
}

function button(href: string, label: string, variant: 'accent' | 'danger' | 'ghost' = 'accent'): string {
  const bg =
    variant === 'danger'
      ? `linear-gradient(180deg,${T.danger} 0%,#a04833 100%)`
      : variant === 'ghost'
      ? 'rgba(255,255,255,0.04)'
      : `linear-gradient(180deg,#5cbd95 0%,${T.green2} 100%)`
  const color = variant === 'ghost' ? T.ink : '#07120d'
  const border = variant === 'ghost' ? `1px solid ${T.line2}` : '1px solid transparent'
  const shadow =
    variant === 'accent'
      ? 'box-shadow:0 10px 30px -8px rgba(78,168,132,0.5),0 0 0 3px rgba(78,168,132,0.12);'
      : variant === 'danger'
      ? 'box-shadow:0 10px 30px -8px rgba(212,113,88,0.5);'
      : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:999px;${shadow}">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 26px;background:${bg};color:${color};font-family:${T.fontStack};font-size:15px;font-weight:500;letter-spacing:-0.005em;text-decoration:none;border-radius:999px;border:${border};">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;font-family:${T.monoStack};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};width:130px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;font-family:${T.fontStack};font-size:15px;color:${T.ink};font-weight:500;">${escapeHtml(value)}</td>
  </tr>`
}

function divider(): string {
  return `<div style="height:1px;background:${T.line};margin:24px 0;"></div>`
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Templates ─────────────────────────────────────────────────────

// Template: alerta_admin_novo_signup
// Dispara quando um novo lead se cadastra — vai para o admin monitorar o funil.
export async function enviarLeadNotification(dados: DadosLead): Promise<EmailResult> {
  const destino =
    process.env.LEAD_NOTIFICATION_EMAIL ?? 'comercial@agrobridge.space'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const content = `
    ${eyebrow('Novo lead · monitoramento', T.gold)}
    ${h1(`${escapeHtml(dados.nome)} acabou de criar conta`)}
    ${p(escapeHtml(dataFormatada), true)}
    ${divider()}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;">
      ${infoRow('Nome', dados.nome)}
      ${infoRow('E-mail', dados.email)}
      ${infoRow('WhatsApp', dados.whatsapp)}
    </table>
    ${divider()}
    ${p('Ainda não interagiu com a IA. Fila: dashboard admin → Leads.', true)}
    ${button(`${siteUrl}/admin/leads`, 'Abrir painel de leads')}
  `

  const preheader = `Novo lead: ${dados.nome}`
  return enviarEmail({
    to: destino,
    subject: `[AgroBridge] Novo signup: ${dados.nome}`,
    html: wrap(content, preheader),
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
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const content = `
    ${eyebrow('Dossiê pronto · pronto pro comitê', T.green)}
    ${h1(`${escapeHtml(nome)}, seu dossiê bancário está pronto.`)}
    ${p(
      `O PDF traz a defesa de crédito em linguagem de comitê, o checklist personalizado do seu perfil e todos os documentos anexados — no padrão que o analista de crédito espera receber.`,
      true,
    )}
    ${p(
      `Preparado pela consultoria sênior da AgroBridge: 14 anos no Sistema Financeiro Nacional gerindo carteira Agro em banco privado. Cada linha do MCR conhecida de dentro.`,
      true,
    )}
    ${button(url, 'Abrir e baixar o dossiê')}
    ${divider()}
    <p style="margin:0 0 8px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.gold};">Próximos passos</p>
    <ol style="margin:0;padding-left:20px;font-family:${T.fontStack};font-size:14px;line-height:1.7;color:${T.ink2};">
      <li>Revisar o PDF e conferir se reflete o seu caso.</li>
      <li>Agendar horário com o gerente no banco ou cooperativa.</li>
      <li>Entregar o dossiê presencial ou por e-mail formal.</li>
    </ol>
  `
  return enviarEmail({
    to,
    subject: 'AgroBridge · seu dossiê de crédito está pronto',
    html: wrap(content, 'Dossiê pronto pra protocolar no banco'),
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
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const valorFmt = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const tierLabel = tierNome ? `plano ${escapeHtml(tierNome)}` : 'plano contratado'

  const proximoPasso = (() => {
    if (tierNome === 'Bronze') {
      return 'O próximo passo é abrir sua Análise de Viabilidade — ela indica com qual linha de crédito e faixa de taxa seguir, em linguagem de comitê.'
    }
    if (tierNome === 'Ouro') {
      return 'O próximo passo é abrir sua conta e agendar a tratativa direta com o fundador (14 anos no SFN). Seu dossiê completo também começa a ser preparado agora.'
    }
    return 'O próximo passo é abrir sua conta, concluir o checklist e acompanhar a montagem do dossiê completo — com a defesa técnica pronta pra entregar ao gerente.'
  })()

  const content = `
    ${eyebrow('Pagamento confirmado · bem-vindo', T.green)}
    ${h1(`${escapeHtml(nome)}, sua conta no ${tierLabel} está ativa.`)}
    ${p(
      `Pagamento de <strong style="color:${T.ink};">${valorFmt}</strong> confirmado. Acesso liberado agora.`,
      true,
    )}
    ${p(proximoPasso, true)}
    ${button(url, 'Abrir minha conta')}
    ${divider()}
    <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:12px;line-height:1.55;color:${T.muted};">
      Guarde este e-mail como comprovante. Nota fiscal sai em até 5 dias úteis, quando aplicável.
    </p>
    <p style="margin:0;font-family:${T.fontStack};font-size:12px;line-height:1.55;color:${T.muted};">
      Se o pagamento não foi você, responda este e-mail imediatamente.
    </p>
  `
  return enviarEmail({
    to,
    subject: `AgroBridge · pagamento confirmado${tierNome ? ` · plano ${tierNome}` : ''}`,
    html: wrap(content, `Pagamento de ${valorFmt} confirmado`),
  })
}

// Template: lembrete_documentos_pendentes
export async function enviarLembreteDocumentos(input: {
  to: string
  nome: string
  pendentes: string[]
  processoId: string
}): Promise<EmailResult> {
  const { nome, pendentes, processoId, to } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const lista = pendentes
    .slice(0, 12)
    .map(
      (d) =>
        `<li style="margin-bottom:8px;font-family:${T.fontStack};font-size:14px;line-height:1.5;color:${T.ink2};">${escapeHtml(d)}</li>`,
    )
    .join('')

  const content = `
    ${eyebrow('Documentos pendentes', T.gold)}
    ${h1('Falta pouco pro dossiê fechar.')}
    ${p(`Olá, ${escapeHtml(nome)}.`, true)}
    ${p(
      'Sem esses documentos o dossiê não fecha — e a janela do banco pra decidir costuma ser curta. Envie quando puder:',
      true,
    )}
    <ul style="margin:16px 0;padding-left:20px;">${lista}</ul>
    ${button(url, 'Enviar documentos pendentes')}
  `
  return enviarEmail({
    to,
    subject: 'AgroBridge · documentos pendentes para seu dossiê',
    html: wrap(content, 'Faltam documentos pro dossiê fechar'),
  })
}

// ── LGPD — Exclusão de conta (dupla confirmação) ─────────────────
export async function enviarConfirmacaoExclusao(input: {
  to: string
  nome: string
  urlConfirmacao: string
  expiraEmMinutos: number
}): Promise<EmailResult> {
  const { nome, urlConfirmacao, expiraEmMinutos, to } = input
  const content = `
    ${eyebrow('Ação sensível · LGPD Art. 18', T.danger)}
    ${h1(`${escapeHtml(nome)}, confirme a exclusão da sua conta.`)}
    ${p(
      `Recebemos um pedido para excluir sua conta AgroBridge. Para garantir que foi você, clique no botão abaixo <strong style="color:${T.ink};">dentro dos próximos ${expiraEmMinutos} minutos</strong>. Depois disso o link expira.`,
      true,
    )}
    ${button(urlConfirmacao, 'Confirmar exclusão', 'danger')}

    <div style="background:${T.goldDim};border-left:3px solid ${T.gold};padding:14px 16px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:13px;color:${T.gold};font-weight:500;">Não foi você que pediu?</p>
      <p style="margin:0;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
        Ignore este e-mail — nada acontece sem o clique. Se desconfiar de acesso indevido, troque sua senha em /resetar-senha imediatamente.
      </p>
    </div>

    ${divider()}
    <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">O que a exclusão apaga</p>
    <p style="margin:0 0 16px;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
      Perfil, entrevistas, checklists, uploads e mensagens ficam invisíveis e bloqueados — seu acesso à plataforma é encerrado.
    </p>
    <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">O que fica arquivado (obrigação fiscal)</p>
    <p style="margin:0;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
      Registros financeiros (compras, notas fiscais, webhooks de pagamento) ficam em modo arquivado anonimizado por até 5 anos — exigência do CTN, art. 174.
    </p>
  `
  return enviarEmail({
    to,
    subject: 'AgroBridge · confirme a exclusão da sua conta',
    html: wrap(content, 'Pedido de exclusão de conta precisa de confirmação'),
  })
}

// Template: exportacao_pronta (LGPD)
export async function enviarExportacaoPronta(input: {
  to: string
  nome: string
}): Promise<EmailResult> {
  const { nome, to } = input
  const content = `
    ${eyebrow('LGPD Art. 18 · exportação', T.green)}
    ${h1('Exportação de dados concluída.')}
    ${p(`Olá, ${escapeHtml(nome)}.`, true)}
    ${p(
      'Sua exportação de dados foi gerada com sucesso e baixada pelo seu navegador.',
      true,
    )}
    ${p(
      `Se não foi você que solicitou, redefina sua senha imediatamente em <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/resetar-senha" style="color:${T.green};text-decoration:underline;">/resetar-senha</a>.`,
      true,
    )}
    ${divider()}
    <p style="margin:0;font-family:${T.fontStack};font-size:12px;line-height:1.55;color:${T.muted};">
      Este e-mail é só uma confirmação — ele não contém o arquivo exportado.
    </p>
  `
  return enviarEmail({
    to,
    subject: 'AgroBridge · exportação de dados concluída',
    html: wrap(content, 'Exportação LGPD concluída'),
  })
}
