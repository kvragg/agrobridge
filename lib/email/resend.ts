import 'server-only'

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

// Bloco "dica de valor" — destaca em ouro com borda lateral. Usar pra
// passar 1 informação útil concreta (ex: como tirar CAR, etiqueta
// MCR, próximo passo). É o que diferencia email genérico de email de
// alto valor — sempre entregar 1 coisa útil pro produtor além do CTA.
function dicaValor(titulo: string, corpoHtml: string): string {
  return `<div style="background:${T.goldDim};border-left:3px solid ${T.gold};padding:14px 16px;border-radius:8px;margin:20px 0;">
    <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:12.5px;color:${T.gold};font-weight:500;letter-spacing:-0.005em;">${escapeHtml(titulo)}</p>
    <div style="margin:0;font-family:${T.fontStack};font-size:13.5px;line-height:1.6;color:${T.ink2};">${corpoHtml}</div>
  </div>`
}

// Assinatura institucional padrão — vai no fim do CARD (não no footer).
// Tom: humana mas sem expor pessoa. "Equipe AgroBridge" é tratada como
// time consolidado (decisão de produto 25/04/2026).
function assinaturaEquipe(): string {
  return `<div style="margin-top:28px;padding-top:20px;border-top:1px solid ${T.line};">
    <p style="margin:0 0 4px;font-family:${T.fontStack};font-size:14px;color:${T.ink};font-weight:500;letter-spacing:-0.005em;">— Equipe AgroBridge</p>
    <p style="margin:0;font-family:${T.fontStack};font-size:12.5px;color:${T.muted};line-height:1.5;">
      Dúvida, sugestão ou ajuda em qualquer documento?
      Responda este e-mail ou escreva pra
      <a href="mailto:suporte@agrobridge.space" style="color:${T.green};text-decoration:none;">suporte@agrobridge.space</a>.
    </p>
  </div>`
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Pega só o primeiro nome — pra subjects e saudações ("Carlos, …" vs
// "Carlos da Silva Santos, …"). Se nome vier vazio, devolve fallback.
function primeiroNome(nome: string, fallback = 'produtor'): string {
  const n = (nome ?? '').trim().split(/\s+/)[0]
  return n || fallback
}

// ── Envio multi-destinatário com fallback corporativo ─────────────
//
// Quando o email principal é corporativo (Sicredi, BB, gov etc), envio
// duplo automático pra principal + alternativo. Isso aumenta drasticamente
// taxa de entrega pra leads com email institucional bloqueado.
//
// Detecção: lib/email/dominios-corporativos.ts. Cliente usa esta função
// helper em vez de chamar enviarEmail direto pra ter o duplo automático.
import {
  isEmailCorporativo,
  type TipoDominio,
  tipoDominio,
} from './dominios-corporativos'

interface EnvioMultiInput {
  /** Email principal (cadastrado na conta). */
  emailPrincipal: string
  /** Email alternativo opcional (pessoal) — só usado se principal é corporativo. */
  emailAlternativo?: string | null
  subject: string
  html: string
  reply_to?: string
}

/**
 * Envia pra principal + alternativo (se principal corporativo). Cada
 * envio é uma chamada Resend separada (Resend trata `to` como array como
 * lista de bcc-style — todos veem todos). Pra preservar privacidade entre
 * destinatários e ter rastro independente, fazemos chamadas paralelas.
 *
 * Retorno: success se PELO MENOS UM envio passou. Loga falha do outro.
 */
export async function enviarComFallbackCorporativo(
  input: EnvioMultiInput,
): Promise<EmailResult> {
  const { emailPrincipal, emailAlternativo, subject, html, reply_to } = input
  const corporativo = isEmailCorporativo(emailPrincipal)
  const usarAlternativo =
    corporativo && emailAlternativo && emailAlternativo !== emailPrincipal

  const principalPromise = enviarEmail({ to: emailPrincipal, subject, html, reply_to })
  const alternativaPromise = usarAlternativo
    ? enviarEmail({ to: emailAlternativo, subject, html, reply_to })
    : Promise.resolve<EmailResult>({ ok: true, resendId: null })

  const [principalRes, alternativaRes] = await Promise.all([
    principalPromise,
    alternativaPromise,
  ])

  if (!principalRes.ok && usarAlternativo && alternativaRes.ok) {
    console.warn(
      '[Resend] entrega no principal falhou mas alternativo OK',
      { principal: emailPrincipal, motivo: principalRes.error },
    )
    return alternativaRes
  }
  if (!principalRes.ok && !alternativaRes.ok) {
    console.error('[Resend] AMBOS os envios falharam', {
      principal: principalRes.error,
      alternativo: alternativaRes.ok ? null : alternativaRes.error,
    })
    return principalRes
  }
  return principalRes
}

export type { TipoDominio }
export { tipoDominio, isEmailCorporativo }

// ── Templates ─────────────────────────────────────────────────────

// Template: boas_vindas_apos_cadastro
// Dispara IMEDIATAMENTE depois do signup (mailer_autoconfirm=true desde
// 25/04 — Supabase não envia mais email de confirmação). Função: marcar
// presença, dar contexto, mostrar próximo passo concreto. Não pede pra
// "confirmar email" porque já está confirmado automaticamente.
export async function enviarBoasVindas(input: {
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
}): Promise<EmailResult> {
  const { nome, emailPrincipal, emailAlternativo } = input
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'
  const primeiro = primeiroNome(nome)

  const content = `
    ${eyebrow('Bem-vindo · próximos 7 minutos', T.green)}
    ${h1(`${escapeHtml(primeiro)}, sua conta tá ativa.`)}
    ${p(
      `Você acaba de entrar na AgroBridge — assessoria especializada de crédito rural construída por quem passou 14 anos dentro do Sistema Financeiro Nacional gerindo carteira Agro. O objetivo aqui é simples: <strong style="color:${T.ink};">menos burocracia, mais aprovação</strong>.`,
      true,
    )}
    ${p(
      `Pra começar, recomendo a entrevista com a IA — leva ~10 minutos, é gratuita, e gera um <strong style="color:${T.ink};">parecer técnico personalizado</strong> do seu caso (linha provável, perfil de risco, gargalos prováveis no comitê de crédito).`,
      true,
    )}
    ${button(`${siteUrl}/entrevista`, 'Iniciar entrevista (10 min)')}

    ${dicaValor(
      'Já sabe que precisa do CAR?',
      `Acesse <a href="https://www.car.gov.br" style="color:${T.green};">car.gov.br</a> com seu CPF e número da matrícula em mãos. O demonstrativo do CAR (PDF com mapa e área) é o documento que o banco pede — leva ~3 minutos pra baixar se o imóvel já está cadastrado.`,
    )}

    ${divider()}
    <p style="margin:0 0 10px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">O que você pode fazer agora</p>
    <ul style="margin:0;padding-left:20px;font-family:${T.fontStack};font-size:14px;line-height:1.7;color:${T.ink2};">
      <li><a href="${siteUrl}/entrevista" style="color:${T.green};text-decoration:none;">Iniciar a entrevista com a IA</a> — gratuita, gera parecer técnico</li>
      <li><a href="${siteUrl}/checklist" style="color:${T.green};text-decoration:none;">Ver o checklist de documentos</a> — começar a separar enquanto isso</li>
      <li><a href="${siteUrl}/simulador" style="color:${T.green};text-decoration:none;">Simulador de viabilidade</a> — ver score do seu cenário (Bronze+)</li>
    </ul>

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, sua conta AgroBridge está ativa — próximo passo em 10 min`
  const preheader = `Bem-vindo. Comece pela entrevista de 10 min — gera um parecer técnico personalizado pro seu caso.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}

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
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
  processoId: string
}): Promise<EmailResult> {
  const { nome, processoId, emailPrincipal, emailAlternativo } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const primeiro = primeiroNome(nome)
  const content = `
    ${eyebrow('Dossiê pronto · padrão de comitê', T.green)}
    ${h1(`${escapeHtml(primeiro)}, seu dossiê está pronto pra protocolar.`)}
    ${p(
      `O PDF traz três coisas que o analista de crédito olha primeiro: a <strong style="color:${T.ink};">defesa técnica do seu pedido</strong> em linguagem de comitê, o checklist personalizado do seu perfil, e o índice cruzado com cada documento anexado.`,
      true,
    )}
    ${button(url, 'Abrir e baixar o dossiê em PDF')}

    ${dicaValor(
      'Antes de entregar — leia a página da defesa primeiro',
      `A seção <strong style="color:${T.ink};">"Defesa de Crédito"</strong> (geralmente página 7 ou 8) é o argumento central — ela traduz seus dados em formato que o analista usa pra defender seu pedido internamente. Conferir essa página antes de entregar evita perguntas no comitê.`,
    )}

    ${divider()}
    <p style="margin:0 0 10px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.gold};">Como entregar bem</p>
    <ol style="margin:0;padding-left:20px;font-family:${T.fontStack};font-size:14px;line-height:1.7;color:${T.ink2};">
      <li><strong style="color:${T.ink};">Imprima 2 vias</strong> — uma fica com o gerente, outra com você (o gerente pede assinatura na cópia).</li>
      <li><strong style="color:${T.ink};">Agende horário</strong> com o gerente. Não chegue sem aviso — o crédito rural precisa de 30-60 min de conversa.</li>
      <li><strong style="color:${T.ink};">Entregue presencial</strong> sempre que possível. Se for por email institucional, pergunte antes pra qual endereço enviar.</li>
      <li><strong style="color:${T.ink};">Acompanhe</strong> em até 7 dias úteis — se não houver retorno, peça status do comitê.</li>
    </ol>

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, seu dossiê está pronto — leve isto pro banco`
  const preheader = `PDF do dossiê de crédito rural pronto pra protocolar — defesa técnica + checklist personalizado.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}

// Template: boas_vindas_apos_compra
// Dispara quando o webhook Cakto confirma pagamento. Serve como
// comprovante + onboarding — mostra o próximo passo conforme o tier.
export async function enviarPagamentoConfirmado(input: {
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
  valor: number
  processoId: string
  tierNome?: string // "Bronze" | "Prata" | "Ouro"
}): Promise<EmailResult> {
  const { nome, valor, processoId, emailPrincipal, emailAlternativo, tierNome } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const valorFmt = `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const tierLabel = tierNome ? `plano ${escapeHtml(tierNome)}` : 'plano contratado'
  const primeiro = primeiroNome(nome)

  const proximoPasso = (() => {
    if (tierNome === 'Bronze') {
      return `O próximo passo é abrir sua <strong style="color:${T.ink};">Análise de Viabilidade</strong> — em até 24h indicamos linha de crédito provável, faixa de taxa esperada e os 3 maiores riscos do seu cenário em linguagem de comitê.`
    }
    if (tierNome === 'Ouro') {
      return `O próximo passo é <strong style="color:${T.ink};">agendar sua sessão 1:1 com o fundador</strong> (14 anos no SFN). Em paralelo, seu dossiê completo já começa a ser preparado pelo time. Disponibilidade nas próximas 48h.`
    }
    if (tierNome === 'Prata') {
      return `O próximo passo é <strong style="color:${T.ink};">enviar seus documentos pelo checklist personalizado</strong>. Após receber tudo, o time AgroBridge monta o dossiê completo com defesa técnica em até 5 dias úteis.`
    }
    return `O próximo passo é abrir sua conta, concluir o checklist e acompanhar a montagem do dossiê completo — com a defesa técnica pronta pra entregar ao gerente.`
  })()

  const dicaTier = (() => {
    if (tierNome === 'Ouro') {
      return dicaValor(
        'Sua sessão 1:1 vai render mais se você chegar com 3 coisas',
        `<ol style="margin:0;padding-left:18px;line-height:1.6;"><li>Valor exato pretendido + linha que você imagina</li><li>Garantias que tem disponíveis (imóvel, CPR, alienação fiduciária)</li><li>Histórico bancário recente — qualquer recusa ou restrição que você queira enquadrar</li></ol>`,
      )
    }
    if (tierNome === 'Prata') {
      return dicaValor(
        'Comece pelo CAR — é o documento que mais trava no comitê',
        `Acesse <a href="https://www.car.gov.br" style="color:${T.green};">car.gov.br</a> com CPF + matrícula. O demonstrativo (PDF com mapa) é o que o banco pede. Se houver pendência ambiental, regularize via PRA antes de protocolar.`,
      )
    }
    return dicaValor(
      'Comece a separar 5 documentos antes da análise',
      `CPF + comprovante de residência + ITR dos últimos 5 anos + matrícula atualizada + CAR. Esses 5 cobrem 80% do dossiê — todos têm passo-a-passo no <a href="${url}" style="color:${T.green};">/checklist</a>.`,
    )
  })()

  const content = `
    ${eyebrow('Pagamento confirmado · bem-vindo', T.green)}
    ${h1(`${escapeHtml(primeiro)}, seu ${tierLabel} está ativo.`)}
    ${p(
      `Pagamento de <strong style="color:${T.ink};">${valorFmt}</strong> confirmado. Acesso já liberado.`,
      true,
    )}
    ${p(proximoPasso, true)}
    ${button(url, 'Abrir minha conta')}

    ${dicaTier}

    ${divider()}
    <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">Comprovante</p>
    <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:12.5px;line-height:1.55;color:${T.muted};">
      Guarde este e-mail. Nota fiscal sai em até 5 dias úteis, quando aplicável.
    </p>
    <p style="margin:0;font-family:${T.fontStack};font-size:12.5px;line-height:1.55;color:${T.muted};">
      Se o pagamento não foi você, responda este e-mail imediatamente.
    </p>

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, seu ${tierNome ?? 'plano'} está ativo — próximo passo aqui`
  const preheader = `Pagamento de ${valorFmt} confirmado. Acesso liberado. Veja o próximo passo do seu plano.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}

// Template: lembrete_documentos_pendentes
export async function enviarLembreteDocumentos(input: {
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
  pendentes: string[]
  processoId: string
}): Promise<EmailResult> {
  const { nome, pendentes, processoId, emailPrincipal, emailAlternativo } = input
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/checklist/${processoId}`
  const primeiro = primeiroNome(nome)
  const lista = pendentes
    .slice(0, 12)
    .map(
      (d) =>
        `<li style="margin-bottom:8px;font-family:${T.fontStack};font-size:14px;line-height:1.5;color:${T.ink2};">${escapeHtml(d)}</li>`,
    )
    .join('')

  const qtd = pendentes.length

  const content = `
    ${eyebrow(`${qtd} documento${qtd === 1 ? '' : 's'} pendente${qtd === 1 ? '' : 's'}`, T.gold)}
    ${h1(`${escapeHtml(primeiro)}, falta pouco pro dossiê fechar.`)}
    ${p(
      `A janela do comitê de crédito costuma ser curta — quanto antes você fechar a documentação, mais rápido o time AgroBridge entrega o dossiê pronto pra protocolar.`,
      true,
    )}
    <p style="margin:0 0 8px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">Pendentes</p>
    <ul style="margin:0 0 18px;padding-left:20px;">${lista}</ul>
    ${button(url, 'Abrir checklist e enviar')}

    ${dicaValor(
      'Travou em algum documento?',
      `Cada item do checklist tem o passo-a-passo de onde emitir e o que clicar no portal oficial. Se mesmo assim travar, abre o chat IA no canto inferior do app — ela te guia em tempo real, com link e orientação específica do seu caso.`,
    )}

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, ${qtd} documento${qtd === 1 ? '' : 's'} faltando pro seu dossiê`
  const preheader = `Sem esses documentos o dossiê não fecha — janela do banco costuma ser curta.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}

// ── LGPD — Exclusão de conta (dupla confirmação) ─────────────────
export async function enviarConfirmacaoExclusao(input: {
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
  urlConfirmacao: string
  expiraEmMinutos: number
}): Promise<EmailResult> {
  const { nome, urlConfirmacao, expiraEmMinutos, emailPrincipal, emailAlternativo } =
    input
  const primeiro = primeiroNome(nome)
  const content = `
    ${eyebrow('Ação sensível · LGPD Art. 18', T.danger)}
    ${h1(`${escapeHtml(primeiro)}, confirme a exclusão da sua conta.`)}
    ${p(
      `Recebemos um pedido pra excluir sua conta AgroBridge. Pra garantir que foi você, clique no botão abaixo <strong style="color:${T.ink};">dentro dos próximos ${expiraEmMinutos} minutos</strong>. Depois disso o link expira automaticamente.`,
      true,
    )}
    ${button(urlConfirmacao, 'Confirmar exclusão da conta', 'danger')}

    <div style="background:${T.goldDim};border-left:3px solid ${T.gold};padding:14px 16px;border-radius:8px;margin:24px 0;">
      <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:13px;color:${T.gold};font-weight:500;">Não foi você que pediu?</p>
      <p style="margin:0;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
        Ignore este e-mail — nada acontece sem o clique. Se desconfiar de acesso indevido, troque sua senha em <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'}/resetar-senha" style="color:${T.green};">/resetar-senha</a> imediatamente.
      </p>
    </div>

    ${divider()}
    <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">O que a exclusão apaga</p>
    <p style="margin:0 0 16px;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
      Perfil, entrevistas, checklists, uploads e mensagens ficam invisíveis e bloqueados — seu acesso à plataforma é encerrado.
    </p>
    <p style="margin:0 0 6px;font-family:${T.monoStack};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};">O que fica arquivado (obrigação fiscal)</p>
    <p style="margin:0 0 16px;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
      Registros financeiros (compras, notas fiscais, webhooks de pagamento) ficam em modo arquivado anonimizado por até 5 anos — exigência do CTN, art. 174.
    </p>

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, confirme a exclusão da sua conta — link expira em ${expiraEmMinutos} min`
  const preheader = `Pedido de exclusão recebido. Confirme em ${expiraEmMinutos} minutos ou ignore.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}

// Template: exportacao_pronta (LGPD)
export async function enviarExportacaoPronta(input: {
  emailPrincipal: string
  emailAlternativo?: string | null
  nome: string
}): Promise<EmailResult> {
  const { nome, emailPrincipal, emailAlternativo } = input
  const primeiro = primeiroNome(nome)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'
  const content = `
    ${eyebrow('LGPD Art. 18 · exportação', T.green)}
    ${h1('Exportação de dados concluída.')}
    ${p(
      `${escapeHtml(primeiro)}, sua exportação de dados foi gerada com sucesso e baixada pelo seu navegador.`,
      true,
    )}
    ${p(
      `O arquivo JSON contém todo o histórico de atividade da sua conta — perfil, entrevistas, checklists, mensagens, processos e compras. Mantenha em local seguro.`,
      true,
    )}

    <div style="background:${T.goldDim};border-left:3px solid ${T.gold};padding:14px 16px;border-radius:8px;margin:20px 0;">
      <p style="margin:0 0 6px;font-family:${T.fontStack};font-size:13px;color:${T.gold};font-weight:500;">Não foi você que solicitou?</p>
      <p style="margin:0;font-family:${T.fontStack};font-size:13px;line-height:1.55;color:${T.ink2};">
        Redefina sua senha imediatamente em <a href="${siteUrl}/resetar-senha" style="color:${T.green};">/resetar-senha</a> e responda este email — verificamos junto.
      </p>
    </div>

    ${divider()}
    <p style="margin:0;font-family:${T.fontStack};font-size:12px;line-height:1.55;color:${T.muted};">
      Este e-mail é só uma confirmação — ele não contém o arquivo exportado.
    </p>

    ${assinaturaEquipe()}
  `

  const subject = `${primeiro}, sua exportação de dados está pronta`
  const preheader = `Arquivo JSON com todo o histórico da sua conta foi gerado e baixado.`

  return enviarComFallbackCorporativo({
    emailPrincipal,
    emailAlternativo,
    subject,
    html: wrap(content, preheader),
  })
}
