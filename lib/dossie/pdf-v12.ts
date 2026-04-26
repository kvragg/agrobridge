/**
 * PDF v12 · Memorando de Análise de Crédito Rural
 *
 * Substitui o pipeline pdfkit (v06) por HTML→PDF via headless Chrome.
 * Mantém a mesma interface de `DossieInput` pra ser drop-in replacement
 * em `/api/dossie` quando o cutover for autorizado.
 *
 * Stack:
 * - puppeteer-core (driver sem chromium bundled)
 * - @sparticuz/chromium-min (chromium otimizado pra Vercel,
 *   download on-demand pra caber no function size limit)
 *
 * Design:
 * - Tipografia premium: Source Serif 4 + Inter + JetBrains Mono
 * - Paleta Oxford Blue (#0A1628) + Burgundy + Gold (#B08A3E)
 * - A4 210×297mm, 4-9 páginas conforme tier
 * - Watermark dinâmica por página (rastreabilidade anti-má-fé)
 *
 * Diferenciação por tier:
 * - diagnostico (Bronze): capa + parecer (2 páginas)
 * - dossie (Prata): capa + sumário + corpo do laudo + parecer (4-6 páginas)
 * - mentoria (Ouro): tudo do Prata + roteiro de comitê (6-9 páginas)
 *
 * Cuidados Vercel:
 * - Cold start ~3-5s pra baixar chromium tarball (cacheado em /tmp)
 * - Função precisa runtime nodejs (não edge)
 * - maxDuration recomendado 30s na rota
 */

// NOTA: este módulo NÃO usa `import 'server-only'` porque o
// chromium-min puxa server-only via dependência transitiva e isso
// quebra `tsx scripts/gerar-pdf-v12-exemplo.ts`. Como pdf-v12 só é
// importado por rotas em `app/api/*` (que são server-only por
// convenção do App Router), o risco de exposição ao cliente é nulo.
import puppeteer, { type Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { brl, dataHojeExtenso } from './_theme'
import type { PerfilEntrevista } from '@/types/entrevista'

function mascararCpfPdf(cpf: string): string {
  const digitos = (cpf ?? '').replace(/\D/g, '')
  if (digitos.length !== 11) return '***.***.***-**'
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9, 11)}`
}

// URL pinada do tarball chromium v131 — atualizar manualmente quando
// quisermos avançar versão (não usar @latest pra evitar breakage).
const CHROMIUM_TARBALL_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

export type DossieTierV12 = 'diagnostico' | 'dossie' | 'mentoria'

export interface DossieInputV12 {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  banco: string | null
  valor: number | null
  perfil: PerfilEntrevista
  laudoMd: string
  tier: DossieTierV12
}

const TIER_LABEL: Record<DossieTierV12, string> = {
  diagnostico: 'Parecer de Viabilidade Preliminar',
  dossie: 'Memorando de Análise de Crédito Rural',
  mentoria: 'Memorando de Análise + Roteiro de Comitê',
}

const TIER_COMERCIAL: Record<DossieTierV12, string> = {
  diagnostico: 'Bronze',
  dossie: 'Prata',
  mentoria: 'Ouro',
}

// ============================================================
// Render
// ============================================================

let _browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (_browserPromise) return _browserPromise
  _browserPromise = (async () => {
    // Em prod (Vercel/serverless) usa chromium-min com tarball download.
    // Em dev local usa system Chrome (PUPPETEER_EXECUTABLE_PATH ou
    // caminho default Windows/macOS) — chromium-min não roda em Windows
    // porque a build é Linux-only.
    const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
    const executablePath = isServerless
      ? await chromium.executablePath(CHROMIUM_TARBALL_URL)
      : process.env.PUPPETEER_EXECUTABLE_PATH || systemChromePath()
    const args = isServerless
      ? [...chromium.args, '--font-render-hinting=none', '--disable-dev-shm-usage']
      : ['--font-render-hinting=none', '--disable-dev-shm-usage']
    return puppeteer.launch({ args, executablePath, headless: true })
  })()
  return _browserPromise
}

function systemChromePath(): string {
  const platform = process.platform
  if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  }
  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  }
  return '/usr/bin/google-chrome'
}

export async function montarDossiePDFv12(input: DossieInputV12): Promise<Buffer> {
  const html = montarHtml(input)
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    })
    return Buffer.from(pdf)
  } finally {
    await page.close().catch(() => {})
  }
}

// ============================================================
// HTML composition
// ============================================================

function montarHtml(input: DossieInputV12): string {
  const { produtor, perfil, processoId, valor, tier, laudoMd } = input
  const cpfMasc = mascararCpfPdf(produtor.cpf)
  const processoLabel = `MAC-${anoCorrente()}-${processoId.slice(0, 8).toUpperCase()}`
  const dataEmissao = dataHojeExtenso()
  const watermarkText = `Cópia personalizada · ${produtor.nome} · CPF ${cpfMasc} · Processo ${processoId.slice(0, 8).toUpperCase()} · ${dataEmissao} · uso pessoal não-transferível`

  const ctx: RenderContext = {
    produtor,
    perfil,
    processoId,
    processoLabel,
    valor,
    tier,
    cpfMasc,
    dataEmissao,
    watermarkText,
    laudoBlocks: parseMarkdownBlocks(laudoMd),
  }

  const paginas: string[] = [paginaCapa(ctx), paginaSumario(ctx)]
  if (tier !== 'diagnostico') {
    paginas.push(paginaApresentacao(ctx))
    paginas.push(paginaViabilidadeGarantias(ctx))
  }
  paginas.push(paginaParecer(ctx))
  if (tier === 'mentoria') {
    paginas.push(paginaRoteiroComite(ctx))
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>AgroBridge · ${TIER_LABEL[tier]} · ${processoLabel}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${SVG_LOGO_DEFS}
${paginas.join('\n')}
</body>
</html>`
}

interface RenderContext {
  produtor: { nome: string; cpf: string; email?: string | null }
  perfil: PerfilEntrevista
  processoId: string
  processoLabel: string
  valor: number | null
  tier: DossieTierV12
  cpfMasc: string
  dataEmissao: string
  watermarkText: string
  laudoBlocks: MdBlock[]
}

// ── Página 1: Capa ────────────────────────────────────────────────
function paginaCapa(ctx: RenderContext): string {
  const { perfil, produtor, processoLabel, dataEmissao, valor, tier } = ctx
  const fazendaNome = inferirFazendaNome(perfil)
  const local = `${perfil.perfil.municipio || '—'}/${perfil.perfil.estado || ''}`
  const area = perfil.propriedade.area_hectares
    ? `${perfil.propriedade.area_hectares} ha`
    : '—'
  return `
<section class="page">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="cover">
    <div class="cover-top">
      <div class="brand-lock">
        <svg width="56" height="56" viewBox="0 0 28 28" style="color:#1A4D3A; --logo-keystone:#B08A3E;"><use href="#ag-logo"/></svg>
        <div>
          <div class="name">AgroBridge</div>
          <span class="sub">Consultoria em Crédito Rural</span>
        </div>
      </div>
      <div class="cover-id">
        Documento &nbsp; <b>${TIER_COMERCIAL[tier]}</b><br>
        Processo &nbsp;&nbsp;&nbsp; <b>${processoLabel}</b><br>
        Emissão &nbsp;&nbsp;&nbsp;&nbsp; <b>${dataEmissao}</b><br>
        Validade &nbsp;&nbsp;&nbsp; <b>120 dias corridos</b>
      </div>
    </div>

    <div class="cover-hero">
      <div class="kicker">${TIER_LABEL[tier]}</div>
      <h1>Análise técnica<br>de operação<br>de crédito <em>rural.</em></h1>
      <p class="lede">Análise técnica e econômico-financeira da operação pleiteada por <b>${esc(produtor.nome)}</b>${fazendaNome ? `, referente ao imóvel <b>${esc(fazendaNome)}</b> em ${esc(local)}` : ''}, com verificação de aderência ao Manual de Crédito Rural publicado pelo Banco Central do Brasil.</p>
    </div>

    <div class="cover-stats">
      <div><div class="lbl">Produtor</div><div class="val">${esc(produtor.nome)}</div></div>
      <div><div class="lbl">Local</div><div class="val">${esc(local)}</div></div>
      <div><div class="lbl">Área</div><div class="val">${esc(area)}</div></div>
      <div><div class="lbl">Pleito</div><div class="val">${valor ? brl(valor) : '—'}</div></div>
    </div>

    <div class="cover-foot">
      <div class="meta">
        Analista responsável &nbsp; <b>Paulo A. Costa</b><br>
        Gerente de Agronegócios &nbsp; <b>FEBRABAN FBB-420 · ANBIMA CPA-20</b><br>
        AgroBridge &middot; Consultoria em Crédito Rural &middot; <b>14 anos</b> de mercado
      </div>
    </div>

    <div class="cover-status">
      Documento técnico emitido pela AgroBridge &middot; ${esc(ctx.watermarkText)}
    </div>
  </div>
</section>`
}

// ── Página 2: Sumário executivo (KPIs) ────────────────────────────
function paginaSumario(ctx: RenderContext): string {
  const { perfil, valor, processoLabel } = ctx
  const fazendaNome = inferirFazendaNome(perfil) ?? 'Imóvel rural a confirmar'
  const local = `${perfil.perfil.municipio || ''}${perfil.perfil.estado ? '/' + perfil.perfil.estado : ''}`
  const tipoOperacao = perfil.necessidade_credito.tipo
  const finalidade = perfil.necessidade_credito.finalidade

  const fortes = listarPontosFortes(perfil)
  const tratar = listarPontosATratar(perfil)

  return `
<section class="page">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="p-pad">
    ${headerPadrao(ctx, fazendaNome, local)}
    <div style="margin-top: 18pt;">
      <div class="eyebrow">01 &middot; Síntese da operação</div>
      <div class="h2" style="margin-top: 4pt;">Operação <em>analisada</em>, com lastro técnico estruturado.</div>
    </div>

    <p class="body body--j" style="margin-top: 12pt; max-width: 480pt;">
      Síntese técnica do pleito. Os indicadores abaixo consolidam capacidade de pagamento, aderência cadastral e regularidade documental verificada nos pontos críticos do Manual de Crédito Rural. Itens em curso são sinalizados explicitamente para tratativa prévia à formalização da operação junto à instituição financeira destinatária.
    </p>

    <div class="kpi-row" style="margin-top: 16pt;">
      <div class="kpi"><div class="lbl">Pleito</div><div class="v" style="font-size:18pt;">${valor ? brl(valor) : '—'}</div><div class="s">${esc(tipoOperacao || 'finalidade a confirmar')}</div></div>
      <div class="kpi"><div class="lbl">Finalidade</div><div class="v" style="font-size:14pt;">${esc(truncate(finalidade || '—', 22))}</div><div class="s">conforme entrevista</div></div>
      <div class="kpi"><div class="lbl">Regime fundiário</div><div class="v" style="font-size:14pt;">${regimeLabel(perfil.propriedade.regime)}</div><div class="s">${perfil.propriedade.area_hectares ? `${perfil.propriedade.area_hectares} ha` : 'área a confirmar'}</div></div>
      <div class="kpi"><div class="lbl">CAR</div><div class="v" style="font-size:14pt;">${carLabel(perfil.propriedade.car_situacao)}</div><div class="s">aderência ambiental</div></div>
    </div>

    <div class="two-col" style="margin-top: 16pt;">
      <div>
        <div class="h3" style="color:var(--accent);">Pontos fortes</div>
        <div style="height:0.5pt; background:var(--line); margin: 4pt 0 6pt;"></div>
        <ul style="list-style: none; padding: 0; font-size: 9pt; line-height: 1.7; color: var(--ink-2); font-weight: 300;">
          ${fortes.map((f) => `<li>— ${esc(f)}</li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <div class="h3" style="color:var(--accent);">Pontos a tratar</div>
        <div style="height:0.5pt; background:var(--line); margin: 4pt 0 6pt;"></div>
        <ul style="list-style: none; padding: 0; font-size: 9pt; line-height: 1.7; color: var(--ink-2); font-weight: 300;">
          ${tratar.map((t) => `<li>— ${esc(t)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>

    ${footerPadrao(ctx, '01 · Síntese', processoLabel)}
  </div>
</section>`
}

// ── Página 3: Apresentação narrativa (laudo body) ─────────────────
function paginaApresentacao(ctx: RenderContext): string {
  const { processoLabel, perfil } = ctx
  const local = `${perfil.perfil.municipio || ''}${perfil.perfil.estado ? '/' + perfil.perfil.estado : ''}`
  const fazendaNome = inferirFazendaNome(perfil) ?? 'Imóvel rural'
  const conteudoHtml = blocosToHtml(ctx.laudoBlocks)

  return `
<section class="page page--cream">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="p-pad">
    ${headerPadrao(ctx, fazendaNome, local)}
    <div style="margin-top: 18pt;">
      <div class="eyebrow">02 &middot; Análise técnica</div>
      <div class="h2" style="margin-top: 4pt;">Defesa técnica <em>do pleito.</em></div>
    </div>

    <div class="laudo-prose" style="margin-top: 14pt;">
      ${conteudoHtml}
    </div>

    ${footerPadrao(ctx, '02 · Análise', processoLabel)}
  </div>
</section>`
}

// ── Página 4: Viabilidade + Garantias ─────────────────────────────
function paginaViabilidadeGarantias(ctx: RenderContext): string {
  const { processoLabel, perfil, valor } = ctx
  const local = `${perfil.perfil.municipio || ''}${perfil.perfil.estado ? '/' + perfil.perfil.estado : ''}`
  const fazendaNome = inferirFazendaNome(perfil) ?? 'Imóvel rural'

  return `
<section class="page">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="p-pad">
    ${headerPadrao(ctx, fazendaNome, local)}
    <div style="margin-top: 18pt;">
      <div class="eyebrow">03 &middot; Viabilidade e garantias</div>
      <div class="h2" style="margin-top: 4pt;">Lastro patrimonial e <em>capacidade de pagamento.</em></div>
    </div>

    <div style="margin-top: 16pt;">
      <div class="h3">Estrutura da operação</div>
      <table class="tbl" style="margin-top: 8pt;">
        <thead>
          <tr><th>Item</th><th style="text-align:right;">Valor</th></tr>
        </thead>
        <tbody>
          <tr><td><b>Valor do pleito</b></td><td class="num" style="text-align:right;">${valor ? brl(valor) : '—'}</td></tr>
          <tr><td><b>Tipo de operação</b></td><td class="num" style="text-align:right;">${esc(perfil.necessidade_credito.tipo || '—')}</td></tr>
          <tr><td><b>Linha preferida (lead)</b></td><td class="num" style="text-align:right;">${esc(perfil.necessidade_credito.linha_preferida || 'a definir')}</td></tr>
          <tr><td><b>Faturamento médio anual</b></td><td class="num" style="text-align:right;">${perfil.financeiro.faturamento_medio_anual ? brl(perfil.financeiro.faturamento_medio_anual) : faixaFaturamentoLabel(perfil.financeiro.faixa_faturamento)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="callout" style="margin-top: 16pt;">
      <div class="h">Hierarquia de garantias preferidas em 2026</div>
      <div class="b">
        Comitês de crédito em 2026 priorizam três modalidades de garantia: <b>alienação fiduciária guarda-chuva</b> (múltiplos imóveis sob 1 estrutura), <b>alienação fiduciária simples</b> (1 imóvel rural ou urbano) e <b>investimento dado em garantia</b> (CDB/LCA/poupança vinculada). Hipoteca rural 1º grau ainda passa com defesa técnica. Penhor sem seguro e aval puro estão muito difíceis no cenário atual de alta da Selic e onda de recuperações judiciais.
      </div>
    </div>

    ${blocoGarantiaPerfil(perfil)}

    ${footerPadrao(ctx, '03 · Viabilidade', processoLabel)}
  </div>
</section>`
}

// ── Página: Parecer conclusivo ────────────────────────────────────
function paginaParecer(ctx: RenderContext): string {
  const { processoLabel, perfil, tier } = ctx
  const local = `${perfil.perfil.municipio || ''}${perfil.perfil.estado ? '/' + perfil.perfil.estado : ''}`
  const fazendaNome = inferirFazendaNome(perfil) ?? 'Imóvel rural'

  return `
<section class="page">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="p-pad">
    ${headerPadrao(ctx, fazendaNome, local)}
    <div style="margin-top: 18pt;">
      <div class="eyebrow">${tier === 'diagnostico' ? '02' : '04'} &middot; Parecer conclusivo</div>
      <div class="h2" style="margin-top: 4pt;">Recomendação <em>técnica.</em></div>
    </div>

    <div class="signoff" style="margin-top: 18pt;">
      <p class="body-l">
        ${textoParecer(ctx)}
      </p>
      <div class="sig-l">
        <div class="name">Paulo A. Costa</div>
        <span class="role">Analista de Crédito Rural · AgroBridge</span>
      </div>
    </div>

    <div class="glossary" style="margin-top: 24pt;">
      <b>Disclaimer:</b> Este documento é uma análise técnica de assessoria e não constitui garantia de aprovação de crédito. A decisão final cabe exclusivamente à instituição financeira analisada.
    </div>

    ${footerPadrao(ctx, tier === 'diagnostico' ? '02 · Parecer' : '04 · Parecer', processoLabel)}
  </div>
</section>`
}

// ── Página extra (Ouro): Roteiro de comitê ────────────────────────
function paginaRoteiroComite(ctx: RenderContext): string {
  const { processoLabel, perfil } = ctx
  const local = `${perfil.perfil.municipio || ''}${perfil.perfil.estado ? '/' + perfil.perfil.estado : ''}`
  const fazendaNome = inferirFazendaNome(perfil) ?? 'Imóvel rural'

  return `
<section class="page page--cream">
  <div class="watermark"><span>AGROBRIDGE</span></div>
  <div class="p-pad">
    ${headerPadrao(ctx, fazendaNome, local)}
    <div style="margin-top: 18pt;">
      <div class="eyebrow">05 &middot; Roteiro de comitê (Ouro)</div>
      <div class="h2" style="margin-top: 4pt;">Como <em>defender</em> esta operação.</div>
    </div>

    <div class="steps">
      <div class="step">
        <div class="n">01 · Abertura</div>
        <div class="t">Apresentar o produtor</div>
        <div class="d">Tempo de atividade (${perfil.perfil.tempo_atividade_anos ?? '—'} anos), histórico em ${esc(perfil.perfil.atividade_principal || 'agricultura')}, regime fundiário ${regimeLabel(perfil.propriedade.regime).toLowerCase()}.</div>
      </div>
      <div class="step">
        <div class="n">02 · Capacidade</div>
        <div class="t">Defender o fluxo</div>
        <div class="d">Faturamento médio: ${perfil.financeiro.faturamento_medio_anual ? brl(perfil.financeiro.faturamento_medio_anual) : faixaFaturamentoLabel(perfil.financeiro.faixa_faturamento)}. Endividamento atual ${perfil.financeiro.credito_rural_ativo ? 'ativo' : 'limpo'}.</div>
      </div>
      <div class="step">
        <div class="n">03 · Garantia</div>
        <div class="t">Posicionar o lastro</div>
        <div class="d">${perfil.propriedade.disponivel_como_garantia ? 'Imóvel disponível como garantia — viabilizar alienação fiduciária ou hipoteca 1º grau.' : 'Garantia oferecida pelo lead. Verificar aderência à hierarquia de aceitação 2026.'}</div>
      </div>
      <div class="step">
        <div class="n">04 · Fechamento</div>
        <div class="t">Endereçar pendências</div>
        <div class="d">CAR ${carLabel(perfil.propriedade.car_situacao).toLowerCase()}. ITR ${perfil.propriedade.itr_em_dia === false ? 'em atraso (regularizar)' : 'em dia'}. CCIR ${perfil.propriedade.ccir_em_dia === false ? 'pendente (renovar)' : 'em dia'}.</div>
      </div>
    </div>

    <div class="callout" style="margin-top: 24pt;">
      <div class="h">Premissa estratégica do dossiê Ouro</div>
      <div class="b">
        Operação apresentada com <b>dossiê estruturado</b> tem 3-5× mais chance de aprovação que apresentação direta. Ordem dos itens, tom da linguagem e ancoragem técnica fazem diferença real no comitê. Este roteiro foi calibrado por 14 anos de SFN no agronegócio.
      </div>
    </div>

    ${footerPadrao(ctx, '05 · Roteiro', processoLabel)}
  </div>
</section>`
}

// ============================================================
// Helpers visuais
// ============================================================

function headerPadrao(_ctx: RenderContext, fazendaNome: string, local: string): string {
  return `
    <div class="header">
      <div class="brand-mark">
        <span class="logo-mark"><svg width="14" height="14" viewBox="0 0 28 28" style="color:#1A4D3A; --logo-keystone:#B08A3E;"><use href="#ag-logo"/></svg></span>
        <b>AgroBridge</b> &middot; ${esc(_ctx.processoLabel)}
      </div>
      <div>${esc(fazendaNome)} &middot; ${esc(local)}</div>
    </div>`
}

function footerPadrao(ctx: RenderContext, secao: string, processoLabel: string): string {
  const watermarkShort = `${esc(ctx.produtor.nome)} · CPF ${ctx.cpfMasc} · Cópia rastreada`
  return `
    <div class="footer">
      <div>${esc(secao)} &middot; ${esc(processoLabel)}</div>
      <div class="hash">${watermarkShort}</div>
    </div>`
}

function blocoGarantiaPerfil(perfil: PerfilEntrevista): string {
  if (!perfil.propriedade.disponivel_como_garantia) {
    return `
    <div class="callout" style="margin-top: 14pt; border-color: var(--accent);">
      <div class="h" style="color: var(--accent);">Atenção sobre garantia</div>
      <div class="b">Imóvel não disponível como garantia neste pleito${perfil.propriedade.impedimento_garantia ? ` (motivo: ${esc(perfil.propriedade.impedimento_garantia)})` : ''}. Recomenda-se estruturar uma das três modalidades preferidas em 2026: alienação fiduciária guarda-chuva, alienação fiduciária simples ou investimento dado em garantia (CDB/LCA).</div>
    </div>`
  }
  return `
    <div class="callout" style="margin-top: 14pt;">
      <div class="h">Garantia disponível</div>
      <div class="b">Imóvel rural disponível como garantia${perfil.propriedade.matricula_em_nome_proprio === true ? ' com matrícula em nome do titular' : ''}${perfil.propriedade.matricula_em_nome_proprio === false ? ' (matrícula em nome de terceiro — viabilizar transferência ou anuência)' : ''}. Estrutura preferencial: <b>alienação fiduciária</b> (execução extrajudicial) ou hipoteca de 1º grau como alternativa.</div>
    </div>`
}

function textoParecer(ctx: RenderContext): string {
  const { perfil, tier } = ctx
  const valor = ctx.valor
  const valorTxt = valor ? brl(valor) : 'a confirmar'
  const finalidade = perfil.necessidade_credito.finalidade || 'finalidade a confirmar'
  const tierTxt =
    tier === 'diagnostico'
      ? 'Parecer Bronze (preliminar)'
      : tier === 'dossie'
        ? 'Dossiê Prata (completo)'
        : 'Mentoria Ouro (com roteiro de comitê)'
  const carTxt =
    perfil.propriedade.car_situacao === 'ativo'
      ? 'CAR ativo'
      : 'CAR pendente (regularizar antes do protocolo)'
  return `${tierTxt} relativa ao pleito de <b>${valorTxt}</b> destinado a <b>${esc(finalidade)}</b>. Aderência cadastral verificada — ${esc(carTxt)}, ITR ${perfil.propriedade.itr_em_dia === false ? '<b>em atraso (regularizar)</b>' : 'em dia'}. Recomenda-se que a operação seja apresentada à instituição financeira destinatária com <b>defesa técnica estruturada</b>, observando a hierarquia de garantias do cenário 2026 e a régua de alavancagem patrimonial usual no setor.`
}

// ============================================================
// Markdown parser (simples — só headings, bold, parágrafos, listas)
// ============================================================

type MdBlock =
  | { tipo: 'h2'; texto: string }
  | { tipo: 'h3'; texto: string }
  | { tipo: 'p'; texto: string }
  | { tipo: 'lista'; itens: string[] }

function parseMarkdownBlocks(md: string): MdBlock[] {
  const linhas = (md ?? '').split(/\r?\n/)
  const blocks: MdBlock[] = []
  let buffer: string[] = []
  let listBuffer: string[] = []

  function flushParagrafo() {
    if (buffer.length) {
      blocks.push({ tipo: 'p', texto: buffer.join(' ').trim() })
      buffer = []
    }
  }
  function flushLista() {
    if (listBuffer.length) {
      blocks.push({ tipo: 'lista', itens: [...listBuffer] })
      listBuffer = []
    }
  }

  for (const linha of linhas) {
    const t = linha.trim()
    if (t.startsWith('## ')) {
      flushParagrafo()
      flushLista()
      blocks.push({ tipo: 'h2', texto: t.slice(3) })
    } else if (t.startsWith('### ')) {
      flushParagrafo()
      flushLista()
      blocks.push({ tipo: 'h3', texto: t.slice(4) })
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      flushParagrafo()
      listBuffer.push(t.slice(2))
    } else if (t === '') {
      flushParagrafo()
      flushLista()
    } else {
      flushLista()
      buffer.push(t)
    }
  }
  flushParagrafo()
  flushLista()
  return blocks
}

function blocosToHtml(blocks: MdBlock[]): string {
  if (!blocks.length) {
    return '<p class="body body--j">Conteúdo do laudo não disponível.</p>'
  }
  return blocks
    .map((b) => {
      switch (b.tipo) {
        case 'h2':
          return `<div class="h3" style="color:var(--accent); margin-top: 14pt;">${esc(b.texto)}</div><div style="height:0.5pt; background:var(--line); margin: 4pt 0 8pt;"></div>`
        case 'h3':
          return `<div class="h3" style="margin-top: 10pt;">${esc(b.texto)}</div>`
        case 'p':
          return `<p class="body body--j" style="margin-top: 6pt;">${renderInline(b.texto)}</p>`
        case 'lista':
          return `<ul style="list-style: none; padding: 0; margin-top: 6pt; font-size: 9pt; line-height: 1.7; color: var(--ink-2); font-weight: 300;">${b.itens.map((i) => `<li>— ${renderInline(i)}</li>`).join('')}</ul>`
      }
    })
    .join('\n')
}

function renderInline(s: string): string {
  // Escape primeiro, depois aplica bold via marcadores.
  const escaped = esc(s)
  return escaped.replace(
    /\*\*([^*]+)\*\*/g,
    '<b>$1</b>',
  )
}

// ============================================================
// Helpers de domínio / format
// ============================================================

function inferirFazendaNome(perfil: PerfilEntrevista): string | null {
  // PerfilEntrevista não tem fazenda_nome explícito; usar atividade
  // como hint quando municipio existe. Caso contrário, retorna null.
  if (perfil.perfil.municipio) {
    return null // o cabeçalho usa município/UF; nome da fazenda fica omitido
  }
  return null
}

function regimeLabel(r: PerfilEntrevista['propriedade']['regime']): string {
  switch (r) {
    case 'propria':
      return 'Própria'
    case 'arrendada':
      return 'Arrendada'
    case 'parceria':
      return 'Parceria'
  }
}

function carLabel(c: PerfilEntrevista['propriedade']['car_situacao']): string {
  switch (c) {
    case 'ativo':
      return 'Ativo'
    case 'pendente':
      return 'Pendente'
    case 'nao_feito':
      return 'Não feito'
  }
}

function faixaFaturamentoLabel(f: PerfilEntrevista['financeiro']['faixa_faturamento']): string {
  switch (f) {
    case 'abaixo_500k':
      return 'Até R$ 500 mil'
    case '500k_1M':
      return 'R$ 500 mil – R$ 1 mi'
    case '1M_5M':
      return 'R$ 1 mi – R$ 5 mi'
    case 'acima_5M':
      return 'Acima de R$ 5 mi'
  }
}

function listarPontosFortes(perfil: PerfilEntrevista): string[] {
  const out: string[] = []
  if (perfil.propriedade.regime === 'propria') {
    out.push('Imóvel próprio — base patrimonial sólida.')
  }
  if (perfil.propriedade.car_situacao === 'ativo') {
    out.push('CAR ativo — conformidade ambiental verificada.')
  }
  if (perfil.propriedade.itr_em_dia === true) {
    out.push('ITR em dia (último exercício).')
  }
  if (perfil.propriedade.disponivel_como_garantia) {
    out.push('Imóvel disponível como garantia.')
  }
  if (perfil.financeiro.parcelas_em_atraso === false) {
    out.push('Sem parcelas em atraso no histórico declarado.')
  }
  if (perfil.perfil.tempo_atividade_anos && perfil.perfil.tempo_atividade_anos >= 5) {
    out.push(`${perfil.perfil.tempo_atividade_anos} anos de atividade rural contínua.`)
  }
  if (out.length === 0) {
    out.push('Pleito apresentado para análise técnica.')
  }
  return out.slice(0, 5)
}

function listarPontosATratar(perfil: PerfilEntrevista): string[] {
  const out: string[] = []
  if (perfil.propriedade.car_situacao === 'pendente') {
    out.push('CAR pendente — regularizar antes do protocolo.')
  }
  if (perfil.propriedade.car_situacao === 'nao_feito') {
    out.push('CAR não feito — bloqueador ambiental, inscrever no SICAR.')
  }
  if (perfil.propriedade.itr_em_dia === false) {
    out.push('ITR em atraso — quitar no e-CAC antes do pedido.')
  }
  if (perfil.propriedade.ccir_em_dia === false) {
    out.push('CCIR em atraso — renovar no SNCR/INCRA.')
  }
  if (perfil.propriedade.matricula_em_nome_proprio === false) {
    out.push('Matrícula em nome de terceiro — viabilizar transferência ou anuência.')
  }
  if (perfil.financeiro.parcelas_em_atraso) {
    out.push('Parcelas em atraso — regularizar SCR antes da apresentação.')
  }
  if (perfil.documentacao_pf.cnd_federal === false) {
    out.push('CND Federal pendente — emitir antes da formalização.')
  }
  if (perfil.pendencias.ambiental.tem_pendencia) {
    out.push('Pendência ambiental sinalizada — endereçar no laudo.')
  }
  if (perfil.pendencias.judicial.tem_pendencia) {
    out.push('Pendência judicial sinalizada — analisar impacto.')
  }
  if (out.length === 0) {
    out.push('Confirmação cadastral usual antes do protocolo bancário.')
  }
  return out.slice(0, 5)
}

function anoCorrente(): number {
  return new Date().getFullYear()
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ============================================================
// SVG + CSS (extraídos do v12-base.html)
// ============================================================

const SVG_LOGO_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="ag-logo" viewBox="0 0 28 28">
      <path d="M4 23 Q14 23 14 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"/>
      <path d="M24 23 Q14 23 14 6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"/>
      <path d="M8.5 17 L19.5 17" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M8.5 17 L14 9 M19.5 17 L14 9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
      <ellipse cx="14" cy="5.2" rx="1.6" ry="2.6" fill="var(--logo-keystone, #B08A3E)"/>
      <path d="M14 3 L14 7.4" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
    </symbol>
  </defs>
</svg>`

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ink: #0A1628;
  --ink-2: #1F2D44;
  --paper: #FAFAF7;
  --paper-2: #F2EDE0;
  --accent: #B08A3E;
  --accent-2: #1A4D3A;
  --muted: #6B7A8F;
  --line: #D9D2C2;
  --line-soft: #ECE6D6;
  --serif: 'Source Serif 4', Georgia, serif;
  --sans: 'Inter', -apple-system, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}
html, body { background: #fff; color: #1f1f1f; }
.page {
  width: 210mm; min-height: 297mm; position: relative; overflow: hidden;
  background: var(--paper); color: var(--ink); font-family: var(--sans);
  display: flex; flex-direction: column; page-break-after: always;
}
.page:last-child { page-break-after: auto; }
.page--cream { background: var(--paper-2); }
.watermark {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  display: flex; align-items: center; justify-content: center; z-index: 0;
}
.watermark span {
  font-family: var(--serif); font-style: italic; font-weight: 600;
  font-size: 130pt; letter-spacing: 0.06em; color: var(--ink);
  opacity: 0.035; transform: rotate(-32deg); white-space: nowrap;
}
.p-pad { padding: 18mm 22mm 14mm; flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; }
.h2 { font-family: var(--serif); font-weight: 500; font-size: 24pt; line-height: 1.05; letter-spacing: -0.005em; color: var(--ink); }
.h2 em { font-style: italic; color: var(--accent); }
.h3 { font-family: var(--sans); font-weight: 600; font-size: 9pt; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink); }
.eyebrow { font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); font-weight: 500; }
.lbl { font-family: var(--mono); font-size: 7pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.body { font-family: var(--sans); font-weight: 300; font-size: 10pt; line-height: 1.65; color: var(--ink-2); }
.body b { font-weight: 500; color: var(--ink); }
.body--j { text-align: justify; text-wrap: pretty; hyphens: auto; }
.mono { font-family: var(--mono); font-size: 9pt; font-variant-numeric: tabular-nums; }
.header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 7pt; border-bottom: 0.5pt solid var(--line);
  font-family: var(--mono); font-size: 7pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);
}
.header .brand-mark { display: flex; align-items: center; gap: 6pt; color: var(--ink); }
.header .brand-mark b { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: 11pt; letter-spacing: 0; text-transform: none; color: var(--ink); }
.footer {
  margin-top: auto; padding-top: 7pt; border-top: 0.5pt solid var(--line);
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);
}
.footer .hash { font-size: 6pt; letter-spacing: 0.04em; text-transform: none; }
.cover { padding: 24mm 22mm 18mm; flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; }
.cover-top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14pt; border-bottom: 0.5pt solid var(--line); }
.brand-lock { display: flex; align-items: center; gap: 10pt; }
.brand-lock .name { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: 28pt; letter-spacing: -0.005em; color: var(--ink); line-height: 1; }
.brand-lock .sub { font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); display: block; margin-top: 4pt; }
.cover-id { text-align: right; font-family: var(--mono); font-size: 7.5pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); line-height: 1.7; }
.cover-id b { color: var(--ink); font-weight: 500; }
.cover-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 28pt 0; max-width: 510pt; }
.cover-hero .kicker { font-family: var(--mono); font-size: 8.5pt; letter-spacing: 0.32em; text-transform: uppercase; color: var(--accent); margin-bottom: 16pt; }
.cover-hero h1 { font-family: var(--serif); font-weight: 500; font-size: 56pt; line-height: 0.96; letter-spacing: -0.022em; color: var(--ink); }
.cover-hero h1 em { font-style: italic; color: var(--accent); }
.cover-hero .lede { font-family: var(--sans); font-weight: 300; font-size: 10.5pt; color: var(--ink-2); margin-top: 18pt; max-width: 380pt; line-height: 1.6; }
.cover-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.5pt solid var(--line); border-bottom: 0.5pt solid var(--line); }
.cover-stats > div { padding: 10pt 14pt; border-right: 0.3pt solid var(--line); }
.cover-stats > div:last-child { border-right: 0; }
.cover-stats .lbl { font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
.cover-stats .val { font-family: var(--serif); font-weight: 500; font-size: 14pt; color: var(--ink); margin-top: 4pt; line-height: 1.05; letter-spacing: -0.005em; }
.cover-foot { margin-top: 16pt; display: flex; justify-content: space-between; align-items: flex-end; gap: 18pt; }
.cover-foot .meta { font-family: var(--mono); font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); line-height: 1.7; }
.cover-foot .meta b { color: var(--ink); font-weight: 500; }
.cover-status { margin-top: 10pt; padding-top: 8pt; border-top: 0.3pt solid var(--line-soft); font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.tbl { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.tbl th { text-align: left; font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); font-weight: 600; padding: 5pt 6pt 6pt 0; border-bottom: 0.7pt solid var(--accent); }
.tbl td { padding: 5pt 6pt 5pt 0; border-bottom: 0.3pt solid var(--line-soft); font-size: 9pt; color: var(--ink-2); vertical-align: top; line-height: 1.4; }
.tbl td.num { font-family: var(--mono); }
.tbl td b { font-weight: 500; color: var(--ink); }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); border: 0.5pt solid var(--line); }
.kpi { padding: 11pt 13pt; border-right: 0.3pt solid var(--line); }
.kpi:last-child { border-right: 0; }
.kpi .lbl { font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.kpi .v { font-family: var(--serif); font-weight: 500; font-size: 22pt; color: var(--ink); line-height: 1; margin-top: 7pt; letter-spacing: -0.018em; }
.kpi .s { font-size: 8pt; color: var(--muted); margin-top: 5pt; font-weight: 300; }
.callout { border: 0.5pt solid var(--accent-2); padding: 12pt 14pt; background: rgba(26,77,58,0.03); }
.callout .h { font-family: var(--mono); font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-2); font-weight: 600; }
.callout .b { font-family: var(--sans); font-weight: 300; font-size: 9pt; line-height: 1.55; color: var(--ink-2); margin-top: 6pt; }
.callout .b b { font-weight: 500; color: var(--ink); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 22pt; }
.signoff { padding: 8pt 12pt; border-top: 0.7pt solid var(--accent); background: rgba(176, 138, 62, 0.03); }
.signoff .body-l { font-family: var(--sans); font-weight: 300; font-size: 10pt; line-height: 1.65; color: var(--ink-2); text-align: justify; text-wrap: pretty; hyphens: auto; max-width: 460pt; }
.signoff .body-l b { font-weight: 500; color: var(--ink); }
.signoff .sig-l { margin-top: 14pt; font-family: var(--sans); font-size: 9pt; color: var(--ink); }
.signoff .sig-l .name { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: 13pt; color: var(--ink); }
.signoff .sig-l .role { font-family: var(--mono); font-size: 7pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-top: 2pt; display: block; }
.steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18pt; margin-top: 18pt; }
.steps .step { padding: 14pt 0; border-top: 0.5pt solid var(--line); }
.steps .step .n { font-family: var(--mono); font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 500; }
.steps .step .t { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: 13pt; color: var(--ink); margin-top: 6pt; line-height: 1.15; }
.steps .step .d { font-family: var(--sans); font-weight: 300; font-size: 8.5pt; color: var(--ink-2); line-height: 1.55; margin-top: 5pt; }
.glossary { font-family: var(--mono); font-size: 6.5pt; letter-spacing: 0.06em; line-height: 1.7; color: var(--muted); padding: 10pt 0; border-top: 0.3pt solid var(--line-soft); }
.glossary b { color: var(--ink); font-weight: 500; }
.laudo-prose { max-width: 510pt; }
@page { size: A4; margin: 0; }
`
