/**
 * PDF v06 · Verde Agro Premium — template único pra 3 tiers.
 *
 * Identidade: paleta `#2d5233` + `#6b8d4a` + paper `#f5f1e6` (verde
 * floresta cerrado sobre off-white). Espelha o DNA verde/ouro do site
 * em versão light print-safe. Fonte display: Times-Bold (substituindo
 * Fraunces pra manter pdfkit built-in — upgrade pra Fraunces via
 * registerFont() quando quisermos 100% fidelidade).
 *
 * 6 páginas base + 3 extras pro Ouro:
 *   P1 capa (todos)
 *   P2 sumário executivo (todos)
 *   P3 caracterização do imóvel (Prata/Ouro)
 *   P4 objeto & viabilidade (Prata/Ouro)
 *   P5 garantias (Prata/Ouro)
 *   P6 parecer conclusivo (todos)
 *   + Ouro: gargalos ocultos, parecer do fundador, roteiro de comitê
 *
 * Compromisso editorial:
 * - Nunca cita marca de banco/cooperativa específica (CLAUDE.md)
 * - PT-BR 100% · valores R$ formato pt-BR · datas por extenso
 * - Helpers de render em _primitives.ts (reuso com legacy)
 * - Helpers de domínio em _domain.ts (PT-BR de enums do perfil)
 */

import PDFDocument from 'pdfkit'
import type { PerfilEntrevista } from '@/types/entrevista'
import { finalizePageChrome } from './_primitives'
import {
  boolToStatus,
  carSituacaoParaTexto,
  faixaParaTexto,
  regimeParaTexto,
} from './_domain'
import { dataHojeExtenso, brl } from './_theme'

type PDFDoc = InstanceType<typeof PDFDocument>

// ── Tokens visuais v06 (autocontidos) ────────────────────────────────────
const V06 = {
  paper: '#f5f1e6',
  paper2: '#ece6d2',
  paper3: '#fbf8ee',
  ink: '#12261a',
  ink2: '#2a3d2d',
  ink3: '#4a5a4e',
  muted: '#6b7560',
  line: '#a8b09a',
  lineSoft: '#c9ceb8',
  accent: '#2d5233', // verde floresta
  accent2: '#6b8d4a', // verde médio
  accentGold: '#a8893f', // ouro discreto pra Ouro
  success: '#2d5233',
  warning: '#c47a3f',
  danger: '#b84a3a',
} as const

// Fontes — built-in pdfkit. Serif como display (substitui Fraunces),
// Helvetica como sans body, Courier-Bold como mono uppercase.
const F = {
  display: 'Times-Bold',
  displayItalic: 'Times-Italic',
  serif: 'Times-Roman',
  sans: 'Helvetica',
  sansBold: 'Helvetica-Bold',
  sansItalic: 'Helvetica-Oblique',
  mono: 'Courier-Bold',
} as const

const MARGIN = 56 // ~20mm
const MARGIN_BOTTOM = 80 // mais folga pra não sobrepor footer chrome (em h-40)
const PAGE_W_A4 = 595
const PAGE_H_A4 = 842
const CONTENT_W = PAGE_W_A4 - MARGIN * 2
// Limite vertical pra detectar necessidade de page-break.
const Y_SAFE_BOTTOM = PAGE_H_A4 - MARGIN_BOTTOM

export type TierLaudo = 'diagnostico' | 'dossie' | 'mentoria'

export interface LaudoInput {
  tier: TierLaudo
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  banco?: string | null // ignorado — jamais sai no PDF
  valor: number | null
  perfil: PerfilEntrevista
  /** Markdown do parecer (Bronze curto) ou laudo (Prata/Ouro completo). */
  conteudoMd: string
  /** Ouro: observações estratégicas do fundador. */
  observacoesFundadorMd?: string
  /** Ouro: número da vaga (1-6). */
  numeroVaga?: number | null
}

export async function montarLaudoPDF(input: LaudoInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: MARGIN,
          bottom: MARGIN_BOTTOM,
          left: MARGIN,
          right: MARGIN,
        },
        bufferPages: true,
        info: {
          Title: `Laudo AgroBridge — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Laudo de Crédito Rural',
          Creator: `AgroBridge · ${tierLabel(input.tier)}`,
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const ctx = {
        theme: tierTheme(input.tier),
        produtor: { nome: input.produtor.nome, cpf: input.produtor.cpf },
        processoId: input.processoId,
      }

      // ── P1 CAPA (sempre) ──────────────────────────────────────────
      renderCapa(doc, input)

      // ── P2 SUMÁRIO EXECUTIVO (sempre) ─────────────────────────────
      doc.addPage()
      renderSumarioExecutivo(doc, input)

      // ── P3-P5 DETALHES (Prata/Ouro apenas; Bronze pula) ───────────
      if (input.tier !== 'diagnostico') {
        doc.addPage()
        renderCaracterizacao(doc, input)

        doc.addPage()
        renderViabilidade(doc, input)

        doc.addPage()
        renderGarantias(doc, input)
      }

      // ── P6 PARECER CONCLUSIVO (sempre) ────────────────────────────
      doc.addPage()
      renderParecer(doc, input)

      // ── P7+ EXCLUSIVAS OURO ───────────────────────────────────────
      if (input.tier === 'mentoria') {
        doc.addPage()
        renderGargalos(doc, input)

        if (input.observacoesFundadorMd) {
          doc.addPage()
          renderParecerFundador(doc, input)
        }

        doc.addPage()
        renderRoteiroComite(doc, input)
      }

      finalizePageChrome(doc, ctx)
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

// ── Theme por tier (pra chrome e header compartilhado) ───────────────────
function tierTheme(tier: TierLaudo) {
  // Brand sempre verde. Ouro ganha accent dourado sutil no footer/selo.
  const nomeComercial = tierLabel(tier)
  return {
    tier,
    nome: nomeProduto(tier),
    nomeComercial,
    accent: V06.accent,
    accentSoft: V06.accent2,
    accentInk: V06.ink,
    preco: precoTier(tier),
    tagline: taglineTier(tier),
    nomeProduto: `${nomeProduto(tier)} · Laudo de crédito rural`,
    eyebrowHeader: `AGROBRIDGE · ${nomeProduto(tier).toUpperCase()}`,
  }
}

function tierLabel(tier: TierLaudo): 'Bronze' | 'Prata' | 'Ouro' {
  return tier === 'diagnostico' ? 'Bronze' : tier === 'dossie' ? 'Prata' : 'Ouro'
}

function nomeProduto(tier: TierLaudo): string {
  switch (tier) {
    case 'diagnostico':
      return 'Diagnóstico Rápido'
    case 'dossie':
      return 'Dossiê Bancário Completo'
    case 'mentoria':
      return 'Assessoria Premium 1:1'
  }
}

function precoTier(tier: TierLaudo): string {
  switch (tier) {
    case 'diagnostico':
      return 'R$ 79,99'
    case 'dossie':
      return 'R$ 397,00'
    case 'mentoria':
      return 'R$ 1.497,00'
  }
}

function taglineTier(tier: TierLaudo): string {
  switch (tier) {
    case 'diagnostico':
      return 'Pra chegar na agência sabendo exatamente o que falar.'
    case 'dossie':
      return 'O pedido pronto pra entregar ao comitê de crédito.'
    case 'mentoria':
      return 'Acompanhamento pessoal direto com o fundador.'
  }
}

// ══════════════════════════════════════════════════════════════════════════
// P1 — CAPA
// ══════════════════════════════════════════════════════════════════════════
function renderCapa(doc: PDFDoc, input: LaudoInput): void {
  const { width, height } = doc.page

  // Fundo creme
  doc.rect(0, 0, width, height).fill(V06.paper)

  // Banda accent vertical à esquerda
  doc.rect(0, 0, 5, height).fill(V06.accent)

  // Top bar com brand-lock (logo "A" + AgroBridge) à esquerda e meta à direita
  const topY = 70
  // Mark
  doc.rect(MARGIN, topY - 4, 20, 20).fill(V06.accent2)
  doc
    .font(F.display)
    .fontSize(13)
    .fillColor(V06.paper)
    .text('A', MARGIN, topY - 1, { width: 20, align: 'center', lineBreak: false })
  // Nome
  doc
    .font(F.display)
    .fontSize(15)
    .fillColor(V06.ink)
    .text('AgroBridge', MARGIN + 30, topY, { lineBreak: false })

  // Meta à direita
  const metaX = width - MARGIN - 180
  doc
    .font(F.mono)
    .fontSize(7.5)
    .fillColor(V06.muted)
    .text(
      `Processo ${shortProc(input.processoId)}`,
      metaX,
      topY,
      { width: 180, align: 'right', characterSpacing: 1.4, lineBreak: false },
    )
  doc
    .font(F.mono)
    .fontSize(7.5)
    .fillColor(V06.muted)
    .text(`Emissão ${dataHojeExtenso()}`, metaX, topY + 12, {
      width: 180,
      align: 'right',
      characterSpacing: 1.4,
      lineBreak: false,
    })

  // Fio horizontal abaixo do topo
  doc
    .moveTo(MARGIN, topY + 30)
    .lineTo(width - MARGIN, topY + 30)
    .lineWidth(0.5)
    .strokeColor(V06.line)
    .stroke()

  // Hero block — kicker + h1 multi-linha + lede
  const heroY = 200
  doc
    .font(F.mono)
    .fontSize(9)
    .fillColor(V06.accent2)
    .text(
      `${kickerTier(input.tier)} · Safra ${safraAtual()}`,
      MARGIN,
      heroY,
      { characterSpacing: 1.8, width: CONTENT_W, lineBreak: false },
    )

  // H1 — display grande em até 4 linhas editoriais.
  // Cada linha renderiza com width fixo e lineGap controlado; altura
  // real vem do doc.y depois do render (não usar yCursor += hardcoded,
  // que causa overlap quando a fonte mede diferente do previsto).
  const h1FontSize = 48
  const h1LineHeight = 46
  let y1 = heroY + 28
  const linhas = tituloCapa(input.tier).split('\n')
  for (const l of linhas) {
    if (l.includes('{{em}}')) {
      const [pre, emTxt] = l.split('{{em}}')
      // Renderiza as duas partes como fragmentos contínuos na MESMA
      // linha — text com continued, sem wrap (a linha toda cabe na
      // coluna porque cada linha do título é curta por design).
      doc
        .font(F.display)
        .fontSize(h1FontSize)
        .fillColor(V06.ink)
        .text(pre, MARGIN, y1, {
          continued: true,
          lineBreak: false,
          width: CONTENT_W,
        })
      doc
        .font(F.displayItalic)
        .fontSize(h1FontSize)
        .fillColor(V06.accent2)
        .text(emTxt, {
          continued: false,
          lineBreak: false,
          width: CONTENT_W,
        })
    } else {
      doc
        .font(F.display)
        .fontSize(h1FontSize)
        .fillColor(V06.ink)
        .text(l, MARGIN, y1, { lineBreak: false, width: CONTENT_W })
    }
    y1 += h1LineHeight
  }

  // Lede — com width, sem lineBreak: false, pode quebrar naturalmente
  doc
    .font(F.sans)
    .fontSize(11)
    .fillColor(V06.ink2)
    .text(ledeCapa(input), MARGIN, y1 + 10, {
      width: CONTENT_W * 0.82,
      lineGap: 3,
    })

  // Stats row no rodapé da capa (4 cols: produtor, localização, área, operação).
  // Dimensionamento: col = 120pt, com padding horizontal 10pt sobra ~100pt
  // úteis pra o VAL. Valores longos (ex. "Cocalzinho de Goiás / GO") precisam
  // de fonte menor + wrap em 2 linhas pra não saírem do box.
  const statsY = height - 190
  doc
    .moveTo(MARGIN, statsY - 10)
    .lineTo(width - MARGIN, statsY - 10)
    .lineWidth(0.5)
    .strokeColor(V06.line)
    .stroke()

  const perfil = input.perfil.perfil ?? ({} as { nome?: string; municipio?: string; estado?: string })
  const prop = input.perfil.propriedade ?? ({} as { area_hectares?: number | null })
  const statsTotalW = width - MARGIN * 2
  const statsColW = statsTotalW / 4
  const statsColGap = 10 // padding interno da célula
  const cols = [
    {
      lbl: 'Produtor',
      val: primeirosDoisNomes(perfil.nome || input.produtor.nome),
    },
    {
      lbl: 'Localização',
      val: `${perfil.municipio || '—'} / ${perfil.estado || '—'}`,
    },
    {
      lbl: 'Área',
      val: prop.area_hectares ? `${Number(prop.area_hectares).toLocaleString('pt-BR')} ha` : '—',
    },
    { lbl: 'Operação', val: input.valor ? brl(input.valor) : '—' },
  ]
  const rowH = 64
  for (let i = 0; i < cols.length; i++) {
    const cx = MARGIN + i * statsColW
    // Label mono 7pt com ellipsis na largura útil
    doc
      .font(F.mono)
      .fontSize(7)
      .fillColor(V06.muted)
      .text(cols[i].lbl.toUpperCase(), cx + statsColGap, statsY + 8, {
        characterSpacing: 1.4,
        width: statsColW - statsColGap * 2,
        lineBreak: false,
        ellipsis: true,
      })
    // Valor — tamanho adaptativo pra caber, com wrap em 2 linhas máx
    doc
      .font(F.display)
      .fontSize(13)
      .fillColor(V06.ink)
      .text(cols[i].val, cx + statsColGap, statsY + 24, {
        width: statsColW - statsColGap * 2,
        height: rowH - 28,
        lineBreak: true,
        ellipsis: true,
        lineGap: 1,
      })
    if (i < cols.length - 1) {
      doc
        .moveTo(cx + statsColW, statsY)
        .lineTo(cx + statsColW, statsY + rowH)
        .lineWidth(0.3)
        .strokeColor(V06.line)
        .stroke()
    }
  }
  doc
    .moveTo(MARGIN, statsY + rowH + 6)
    .lineTo(width - MARGIN, statsY + rowH + 6)
    .lineWidth(0.5)
    .strokeColor(V06.line)
    .stroke()

  // Cover foot — sempre à esquerda, selo da vaga (Ouro) à direita
  const fy = height - 60
  doc
    .font(F.mono)
    .fontSize(7)
    .fillColor(V06.muted)
    .text(
      `Documento ${numeroDoc(input.tier)} · Validade 120 dias`,
      MARGIN,
      fy,
      { characterSpacing: 1.4, width: CONTENT_W * 0.55, lineBreak: false },
    )

  if (input.tier === 'mentoria' && input.numeroVaga) {
    const seloW = 150
    const seloH = 32
    const seloX = width - MARGIN - seloW
    const seloY = fy - 10
    doc
      .rect(seloX, seloY, seloW, seloH)
      .lineWidth(0.8)
      .strokeColor(V06.accentGold)
      .stroke()
    doc
      .font(F.mono)
      .fontSize(6.5)
      .fillColor(V06.accentGold)
      .text('MESA DE CRÉDITO · VAGA', seloX, seloY + 4, {
        characterSpacing: 1.3,
        width: seloW,
        align: 'center',
        lineBreak: false,
      })
    doc
      .font(F.display)
      .fontSize(13)
      .fillColor(V06.ink)
      .text(
        `Nº ${String(input.numeroVaga).padStart(2, '0')} / 06`,
        seloX,
        seloY + 15,
        { width: seloW, align: 'center', lineBreak: false },
      )
  }
}

// ══════════════════════════════════════════════════════════════════════════
// P2 — SUMÁRIO EXECUTIVO
// ══════════════════════════════════════════════════════════════════════════
function renderSumarioExecutivo(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  const ga = avaliarPerfil(input.perfil)
  startSecao(doc, '01 · Sumário executivo', tituloSumario(ga.parecer))

  // Parágrafo introdutório
  doc
    .font(F.sans)
    .fontSize(10.5)
    .fillColor(V06.ink2)
    .text(
      resumoSumario(input, ga),
      MARGIN,
      doc.y + 14,
      {
        width: CONTENT_W,
        align: 'justify',
        lineGap: 3,
      },
    )

  doc.moveDown(0.8)

  // KPI row — 4 cards com indicadores
  const valor = input.valor || 0
  const fat = input.perfil.financeiro?.faturamento_medio_anual || 0
  const kpis = [
    { lbl: 'Valor pleiteado', val: valor > 0 ? brl(valor) : '—', sub: tituloFinalidade(input) },
    { lbl: 'Faturamento anual', val: fat > 0 ? brl(fat) : faixaParaTexto(input.perfil.financeiro?.faixa_faturamento), sub: 'autodeclarado' },
    {
      lbl: 'Alavancagem',
      val: fat > 0 && valor > 0 ? `${Math.round((valor / fat) * 100)}%` : '—',
      sub: 'valor / receita anual',
    },
    {
      lbl: 'Tempo na atividade',
      val: input.perfil.perfil?.tempo_atividade_anos
        ? `${input.perfil.perfil.tempo_atividade_anos} anos`
        : '—',
      sub: 'histórico rural',
    },
  ]
  renderKpiRow(doc, kpis)

  doc.moveDown(0.8)

  // Pull quote com parecer da consultoria
  renderPullQuote(
    doc,
    `"${pullQuoteSumario(ga.parecer)}"`,
    'Consultoria Especializada AgroBridge · Parecer preliminar',
  )

  doc.moveDown(0.8)

  // Two-col: pontos fortes × pontos de atenção
  renderTwoColLists(doc, {
    leftTitle: 'Pontos fortes',
    leftItems: ga.fortes,
    rightTitle: 'Pontos de atenção',
    rightItems: ga.atencao,
  })
}

// ══════════════════════════════════════════════════════════════════════════
// P3 — CARACTERIZAÇÃO DO IMÓVEL
// ══════════════════════════════════════════════════════════════════════════
function renderCaracterizacao(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(doc, '02 · Caracterização do imóvel', 'Identificação, domínio e uso')

  const perfil = input.perfil.perfil ?? ({} as Record<string, string | undefined>)
  const prop = input.perfil.propriedade ?? ({} as Record<string, unknown>)

  // Two-col: KV proprietário × KV imóvel
  const y0 = doc.y + 10
  const colW = (doc.page.width - MARGIN * 2 - 20) / 2
  const leftKV: Array<[string, string]> = [
    ['Produtor', perfil.nome || input.produtor.nome || '—'],
    ['CPF', perfil.cpf || input.produtor.cpf || '—'],
    ['Tipo', perfil.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'],
    ['Atividade', perfil.atividade_principal || '—'],
    ['Tempo na atividade', perfil.tempo_atividade_anos ? `${perfil.tempo_atividade_anos} anos` : '—'],
  ]
  const rightKV: Array<[string, string]> = [
    ['Município', `${perfil.municipio || '—'} / ${perfil.estado || '—'}`],
    ['Regime de detenção', regimeParaTexto(prop.regime as string | undefined)],
    [
      'Área declarada',
      prop.area_hectares
        ? `${Number(prop.area_hectares).toLocaleString('pt-BR')} ha`
        : '—',
    ],
    ['Situação do CAR', carSituacaoParaTexto(prop.car_situacao as string | undefined)],
    ['CCIR', prop.ccir_em_dia ? 'Quitado e em dia' : 'Pendente'],
  ]
  renderKvCol(doc, MARGIN, y0, colW, leftKV)
  renderKvCol(doc, MARGIN + colW + 20, y0, colW, rightKV)
  doc.y = Math.max(doc.y, y0 + leftKV.length * 18 + 10)

  doc.moveDown(0.8)

  // Status documental resumido
  miniH3(doc, 'Status documental')
  const docs = input.perfil.documentacao_pf ?? ({} as Record<string, unknown>)
  const rows: Array<[string, string]> = [
    ['CAR (Cadastro Ambiental Rural)', boolToStatus(prop.car_situacao === 'ativo')],
    ['CCIR (INCRA)', boolToStatus(prop.ccir_em_dia as boolean | null)],
    ['ITR (Receita Federal)', boolToStatus(prop.itr_em_dia as boolean | null)],
    ['CND Federal', boolToStatus(docs.cnd_federal as boolean | null)],
    ['CND Estadual', boolToStatus(docs.cnd_estadual as boolean | null)],
    ['CND Municipal', boolToStatus(docs.cnd_municipal as boolean | null)],
    [
      'Licença Ambiental / Dispensa',
      boolToStatus(docs.dispensa_ou_licenca_ambiental as boolean | null),
    ],
  ]
  renderTableSimple(
    doc,
    [
      { header: 'Documento', widthPct: 70 },
      { header: 'Situação', widthPct: 30, align: 'right' },
    ],
    rows.map(([a, b]) => [a, b]),
  )
}

// ══════════════════════════════════════════════════════════════════════════
// P4 — OBJETO & VIABILIDADE
// ══════════════════════════════════════════════════════════════════════════
function renderViabilidade(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(doc, '03 · Objeto & viabilidade', tituloViabilidade(input))

  doc
    .font(F.sans)
    .fontSize(10.5)
    .fillColor(V06.ink2)
    .text(descricaoViabilidade(input), MARGIN, doc.y + 14, {
      width: CONTENT_W,
      align: 'justify',
      lineGap: 3,
    })

  doc.moveDown(0.8)

  // Renderizar conteúdoMd (laudo gerado pela IA) — markdown simplificado
  renderMarkdownInline(doc, input.conteudoMd)
}

// ══════════════════════════════════════════════════════════════════════════
// P5 — ESTRUTURA DE GARANTIAS
// ══════════════════════════════════════════════════════════════════════════
function renderGarantias(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(doc, '04 · Estrutura de garantias', 'Instrumentos ofertados e lastro')

  const prop = input.perfil.propriedade
  const tem = prop?.disponivel_como_garantia === true

  doc
    .font(F.sans)
    .fontSize(10.5)
    .fillColor(V06.ink2)
    .text(
      tem
        ? `O produtor oferta hipoteca de 1º grau sobre o imóvel rural como garantia principal, complementada por cédula de produto rural e/ou aval solidário do cônjuge (quando aplicável). A liquidez da garantia depende de laudo de avaliação do imóvel emitido por profissional habilitado (CREA/CAU) próximo ao protocolo.`
        : `O produtor reporta restrição à oferta de hipoteca: ${
            prop?.impedimento_garantia || 'impedimento não detalhado'
          }. Nesses casos, a estrutura de garantias típica combina cédula de produto rural, penhor de rebanho/maquinário, aval de terceiros e seguro rural como reforço.`,
      MARGIN,
      doc.y + 14,
      {
        width: CONTENT_W,
        align: 'justify',
        lineGap: 3,
      },
    )

  doc.moveDown(0.8)

  miniH3(doc, 'Instrumentos habituais pra este perfil')
  const instrumentos: Array<[string, string]> = tem
    ? [
        ['G.01 · Hipoteca 1º grau', 'Imóvel rural · matrícula(s) em nome próprio'],
        ['G.02 · Cédula de Produto Rural', 'Safra/rebanho projetado'],
        ['G.03 · Aval solidário', 'Cônjuge ou terceiro idôneo'],
        ['G.04 · Seguro rural/pecuário', 'Beneficiário = credor'],
      ]
    : [
        ['G.01 · Cédula de Produto Rural', 'Safra/rebanho projetado'],
        ['G.02 · Penhor cedular', 'Rebanho + maquinário'],
        ['G.03 · Aval solidário', 'Terceiro idôneo + cônjuge'],
        ['G.04 · Seguro rural/pecuário', 'Beneficiário = credor'],
      ]
  renderTableSimple(
    doc,
    [
      { header: 'Instrumento', widthPct: 40 },
      { header: 'Objeto', widthPct: 60 },
    ],
    instrumentos,
  )

  doc.moveDown(0.8)

  // Nota técnica
  doc
    .font(F.sansItalic)
    .fontSize(9.5)
    .fillColor(V06.muted)
    .text(
      'Nota técnica: o múltiplo mínimo de cobertura de garantias varia de 1,3× (linhas subsidiadas) a 3,0× (recursos livres) conforme o produto e a política interna do credor. O lastro final será consolidado na avaliação formal do imóvel e no laudo de rebanho, quando for o caso.',
      MARGIN,
      doc.y,
      {
        width: CONTENT_W,
        align: 'justify',
        lineGap: 2,
      },
    )
}

// ══════════════════════════════════════════════════════════════════════════
// P6 — PARECER CONCLUSIVO
// ══════════════════════════════════════════════════════════════════════════
function renderParecer(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  const ga = avaliarPerfil(input.perfil)
  startSecao(doc, `0${input.tier === 'diagnostico' ? '2' : '5'} · Parecer conclusivo`, tituloParecer(ga.parecer))

  doc
    .font(F.sans)
    .fontSize(10.5)
    .fillColor(V06.ink2)
    .text(textoParecer(input, ga), MARGIN, doc.y + 14, {
      width: CONTENT_W,
      align: 'justify',
      lineGap: 3,
    })

  doc.moveDown(0.8)

  // Verdict grid 3 cols
  renderVerdictGrid(doc, [
    { v: statusCurto(ga.parecer), lbl: 'Viabilidade aparente' },
    { v: String(ga.fortes.length), lbl: 'Pontos fortes' },
    { v: String(ga.atencao.length), lbl: 'Pontos de atenção' },
  ])

  doc.moveDown(1)

  // Emissão / Identificação documental
  const y0 = doc.y
  const colW = (doc.page.width - MARGIN * 2 - 20) / 2

  // Coluna esquerda — Identificação documental
  miniH3Xy(doc, 'Identificação documental', MARGIN, y0, colW)
  const idInfo = [
    `LAUDO         ${numeroDoc(input.tier)}`,
    `PROCESSO     ${shortProc(input.processoId)}`,
    `EMISSÃO       ${dataHojeExtenso()}`,
    `VALIDADE      120 dias`,
    `PRODUTO       ${nomeProduto(input.tier)}`,
  ]
  doc
    .font(F.mono)
    .fontSize(9)
    .fillColor(V06.ink2)
    .text(idInfo.join('\n'), MARGIN, y0 + 18, {
      width: colW,
      lineGap: 4,
    })
  const leftEndY = doc.y

  // Coluna direita — Emissor
  const rx = MARGIN + colW + 20
  miniH3Xy(doc, 'Emissor', rx, y0, colW)
  doc
    .font(F.display)
    .fontSize(18)
    .fillColor(V06.ink)
    .text('AgroBridge', rx, y0 + 18, { width: colW, lineBreak: false, ellipsis: true })
  doc
    .font(F.sans)
    .fontSize(9.5)
    .fillColor(V06.ink2)
    .text(
      'Consultoria Especializada em Crédito Rural · Assessoria de crédito.',
      rx,
      y0 + 42,
      { width: colW, lineGap: 3 },
    )
  const rightMidY = doc.y
  doc
    .font(F.sansItalic)
    .fontSize(9)
    .fillColor(V06.muted)
    .text(
      'Este laudo reflete análise técnica baseada nos dados autodeclarados e na documentação apresentada. Decisão final de aprovação compete ao comitê do credor.',
      rx,
      rightMidY + 6,
      { width: colW, lineGap: 2 },
    )
  const rightEndY = doc.y

  // Avança cursor pro maior dos dois fins
  doc.y = Math.max(leftEndY, rightEndY) + 12

  // Assinatura — 2 colunas
  doc.moveDown(1)
  const sigY = doc.y
  const sigColW = (doc.page.width - MARGIN * 2 - 30) / 2
  // linha 1
  doc
    .moveTo(MARGIN, sigY + 30)
    .lineTo(MARGIN + sigColW, sigY + 30)
    .lineWidth(0.6)
    .strokeColor(V06.ink)
    .stroke()
  doc
    .font(F.mono)
    .fontSize(7.5)
    .fillColor(V06.muted)
    .text('Consultoria AgroBridge · responsável técnico', MARGIN, sigY + 36, {
      width: sigColW,
      characterSpacing: 1.2,
      lineBreak: false,
    })
  // linha 2
  const sx = MARGIN + sigColW + 30
  doc
    .moveTo(sx, sigY + 30)
    .lineTo(sx + sigColW, sigY + 30)
    .lineWidth(0.6)
    .strokeColor(V06.ink)
    .stroke()
  doc
    .font(F.mono)
    .fontSize(7.5)
    .fillColor(V06.muted)
    .text('Produtor · ciente e de acordo', sx, sigY + 36, {
      width: sigColW,
      characterSpacing: 1.2,
      lineBreak: false,
    })
}

// ══════════════════════════════════════════════════════════════════════════
// P7 — GARGALOS OCULTOS (Ouro)
// ══════════════════════════════════════════════════════════════════════════
function renderGargalos(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(doc, '06 · Gargalos ocultos', 'Análise de risco reputacional e operacional')

  doc
    .font(F.sansItalic)
    .fontSize(10)
    .fillColor(V06.muted)
    .text(
      'O comitê do credor avalia além do que está no formulário. Esta seção antecipa pontos que historicamente derrubam pedidos sem que o produtor saiba que foram avaliados.',
      MARGIN,
      doc.y + 14,
      {
        width: CONTENT_W,
        align: 'justify',
        lineGap: 3,
      },
    )
  doc.moveDown(0.6)

  const gargalos = identificarGargalos(input.perfil)
  for (const g of gargalos) {
    renderGargaloBloco(doc, g)
    doc.moveDown(0.5)
  }
}

interface Gargalo {
  severidade: 'alta' | 'media' | 'baixa'
  titulo: string
  descricao: string
  mitigacao: string
}

function identificarGargalos(perfil: PerfilEntrevista): Gargalo[] {
  const out: Gargalo[] = []
  out.push({
    severidade: 'alta',
    titulo: 'Extrato SCR não anexado preventivamente',
    descricao:
      'O comitê sempre puxa o registrato do Sistema de Informações de Crédito (SCR/Bacen) antes de decidir. Surpresas lá (operação esquecida, rolagem, classificação degradada) geram desconfiança e atrasam a análise.',
    mitigacao:
      'Emitir o registrato gratuitamente em registrato.bcb.gov.br antes do protocolo e anexar com nota explicativa de cada operação ativa.',
  })
  out.push({
    severidade: 'media',
    titulo: 'Pesquisa de mídia e imagem do proponente',
    descricao:
      'Bancos privados e cooperativas médias fazem busca aberta no nome — Google, redes sociais, processos públicos. Resultados negativos mesmo arquivados podem derrubar a operação no comitê de risco reputacional.',
    mitigacao:
      'Auditar presença online antes do pedido. Se houver matérias antigas negativas, preparar nota explicativa com contexto e desfecho.',
  })
  if (perfil.financeiro?.credito_rural_ativo) {
    out.push({
      severidade: perfil.financeiro.parcelas_em_atraso ? 'alta' : 'media',
      titulo: 'Crédito rural ativo coexistindo com nova operação',
      descricao:
        'Carregar saldo devedor rural enquanto pede nova operação acende alerta de concentração de risco safra. O comitê analisa se a nova operação amortiza ou empilha.',
      mitigacao: `Demonstrar capacidade de pagamento separada por operação${
        perfil.financeiro.saldo_devedor_rural
          ? `. Saldo devedor declarado ${brl(perfil.financeiro.saldo_devedor_rural)}.`
          : '.'
      } Anexar comprovante de adimplência das parcelas vigentes.`,
    })
  }
  if (perfil.propriedade?.matricula_em_nome_proprio === false) {
    out.push({
      severidade: 'alta',
      titulo: 'Matrícula em nome de terceiro',
      descricao:
        'Imóvel em nome de terceiro (cônjuge, sócio, herdeiro, holding) não pode ser ofertado direto como garantia hipotecária. Exige anuência formal e análise jurídica do regime de bens.',
      mitigacao:
        'Levar termo de anuência do titular + certidão de casamento (se comunhão) ou contrato social + ata (se PJ) junto do dossiê.',
    })
  }
  if (perfil.pendencias?.judicial?.tem_pendencia) {
    out.push({
      severidade: 'media',
      titulo: 'Pendência judicial declarada',
      descricao: perfil.pendencias.judicial.descricao || 'Detalhes não informados na entrevista.',
      mitigacao:
        'Anexar certidão de objeto e pé atualizada. Se valor < 10% do patrimônio, geralmente não é impeditivo.',
    })
  }
  return out
}

function renderGargaloBloco(doc: PDFDoc, g: Gargalo): void {
  const sevColor =
    g.severidade === 'alta' ? V06.danger : g.severidade === 'media' ? V06.warning : V06.muted
  const startY = doc.y
  const innerX = MARGIN + 14
  const innerW = doc.page.width - MARGIN * 2 - 14

  // Eyebrow severidade
  doc
    .font(F.mono)
    .fontSize(8)
    .fillColor(sevColor)
    .text(`SEVERIDADE ${g.severidade.toUpperCase()}`, innerX, startY, {
      characterSpacing: 1.4,
      lineBreak: false,
    })
  doc.moveDown(0.3)
  doc
    .font(F.sansBold)
    .fontSize(12)
    .fillColor(V06.ink)
    .text(g.titulo, innerX, doc.y, { width: innerW })
  doc.moveDown(0.2)
  doc
    .font(F.sans)
    .fontSize(10)
    .fillColor(V06.ink2)
    .text(g.descricao, innerX, doc.y, {
      width: innerW,
      align: 'justify',
      lineGap: 2,
    })
  doc.moveDown(0.2)
  doc
    .font(F.sansBold)
    .fontSize(9.5)
    .fillColor(V06.ink)
    .text('Mitigação recomendada: ', innerX, doc.y, { continued: true, lineBreak: false })
  doc
    .font(F.sans)
    .fontSize(9.5)
    .fillColor(V06.ink2)
    .text(g.mitigacao, { width: innerW - 4 })

  const endY = doc.y
  // Accent vertical à esquerda
  doc.rect(MARGIN, startY, 3, endY - startY).fill(sevColor)
  doc.y = endY + 4
}

// ══════════════════════════════════════════════════════════════════════════
// P8 — PARECER DO FUNDADOR (Ouro, opcional)
// ══════════════════════════════════════════════════════════════════════════
function renderParecerFundador(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(doc, '07 · Parecer estratégico do fundador', 'Observações pessoais da revisão')

  doc
    .font(F.mono)
    .fontSize(8)
    .fillColor(V06.accentGold)
    .text('OBSERVAÇÕES DO FUNDADOR', MARGIN, doc.y + 14, {
      characterSpacing: 1.6,
      lineBreak: false,
    })
  doc.moveDown(0.6)

  renderMarkdownInline(doc, input.observacoesFundadorMd || '')

  doc.moveDown(1)
  doc
    .font(F.sansItalic)
    .fontSize(9.5)
    .fillColor(V06.muted)
    .text(
      '— Paulo Costa, fundador AgroBridge · 14 anos no Sistema Financeiro Nacional',
      MARGIN,
      doc.y,
      {
        width: CONTENT_W,
        align: 'right',
      },
    )
}

// ══════════════════════════════════════════════════════════════════════════
// P9 — ROTEIRO DE DEFESA EM COMITÊ (Ouro)
// ══════════════════════════════════════════════════════════════════════════
function renderRoteiroComite(doc: PDFDoc, input: LaudoInput): void {
  pageBg(doc)
  startSecao(
    doc,
    `0${input.observacoesFundadorMd ? '8' : '7'} · Roteiro de defesa em comitê`,
    'Script oral de apresentação da operação',
  )

  doc
    .font(F.sansItalic)
    .fontSize(10)
    .fillColor(V06.muted)
    .text(
      'Quando o gerente leva o pedido ao comitê de crédito, a defesa oral conta tanto quanto o dossiê. Este roteiro estrutura o que dizer — na ordem em que o comitê pergunta — pra deixar a operação pronta pra aprovação.',
      MARGIN,
      doc.y + 14,
      { width: CONTENT_W, align: 'justify', lineGap: 2 },
    )
  doc.moveDown(0.6)

  const perfil = input.perfil
  const etapas = [
    {
      titulo: '1. Abertura — quem é o produtor (30s)',
      script: `${input.produtor.nome}, produtor em ${perfil.perfil?.municipio ?? '—'}/${
        perfil.perfil?.estado ?? '—'
      }, ${perfil.perfil?.tempo_atividade_anos ?? '—'} anos na atividade de ${
        perfil.perfil?.atividade_principal ?? '—'
      }. Operação em ${regimeParaTexto(perfil.propriedade?.regime)} de ${
        perfil.propriedade?.area_hectares ?? '—'
      } ha.`,
    },
    {
      titulo: '2. Capacidade de pagamento (60s)',
      script: `Faturamento médio ${
        perfil.financeiro?.faturamento_medio_anual
          ? brl(perfil.financeiro.faturamento_medio_anual)
          : faixaParaTexto(perfil.financeiro?.faixa_faturamento)
      }/ano. Histórico ${
        perfil.financeiro?.parcelas_em_atraso
          ? 'com pendências já reestruturadas'
          : 'limpo'
      }. Operação de ${brl(input.valor)} representa ${
        input.valor && perfil.financeiro?.faturamento_medio_anual
          ? Math.round((input.valor / perfil.financeiro.faturamento_medio_anual) * 100)
          : '—'
      }% do faturamento anual.`,
    },
    {
      titulo: '3. Garantia (30s)',
      script: perfil.propriedade?.disponivel_como_garantia
        ? `Imóvel disponível pra hipoteca, matrícula ${
            perfil.propriedade?.matricula_em_nome_proprio ? 'em nome próprio' : 'com anuência do titular'
          }. CAR ${perfil.propriedade?.car_situacao === 'ativo' ? 'ativo e regular' : 'em regularização'}.`
        : 'Garantia complementar ofertada (cédula de produto rural, aval, alienação fiduciária de máquinas).',
    },
    {
      titulo: '4. Tratamento de pontos sensíveis (90s)',
      script:
        'Antecipar com transparência: SCR anexo, eventuais pendências menores declaradas, plano de mitigação claro. Comitê valoriza candura — surpresa derruba operação.',
    },
    {
      titulo: '5. Encerramento — pedido de decisão (15s)',
      script:
        'Reforçar prazo desejado, disponibilidade pra responder exigência imediata e proximidade da janela operacional (plantio, safra, etc).',
    },
  ]
  for (const etapa of etapas) {
    doc
      .font(F.sansBold)
      .fontSize(11)
      .fillColor(V06.accent)
      .text(etapa.titulo, MARGIN, doc.y)
    doc.moveDown(0.15)
    doc
      .font(F.sansItalic)
      .fontSize(10)
      .fillColor(V06.ink2)
      .text(etapa.script, MARGIN + 8, doc.y, {
        width: CONTENT_W - 8,
        align: 'justify',
        lineGap: 2,
      })
    doc.moveDown(0.5)
  }
}

// ══════════════════════════════════════════════════════════════════════════
// PRIMITIVAS DE RENDER
// ══════════════════════════════════════════════════════════════════════════

function pageBg(doc: PDFDoc): void {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(V06.paper)
  doc.fillColor(V06.ink)
  // Banda lateral accent fina (3pt) nas páginas internas
  doc.rect(0, 0, 3, doc.page.height).fill(V06.accent)
  doc.y = MARGIN + 20
}

function startSecao(doc: PDFDoc, numero: string, titulo: string): void {
  doc
    .font(F.mono)
    .fontSize(8.5)
    .fillColor(V06.accent2)
    .text(numero.toUpperCase(), MARGIN, doc.y, {
      characterSpacing: 1.8,
      width: CONTENT_W,
      lineBreak: false,
      ellipsis: true,
    })
  doc.moveDown(0.4)
  doc
    .font(F.display)
    .fontSize(26)
    .fillColor(V06.ink)
    .text(titulo, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 })
  // Fio accent sob título — ancorado ao y final do text, não ao y atual
  const fioY = doc.y + 4
  doc.rect(MARGIN, fioY, 40, 1.5).fill(V06.accent2)
  doc.y = fioY + 12
}

function miniH3(doc: PDFDoc, titulo: string): void {
  doc
    .font(F.sansBold)
    .fontSize(9)
    .fillColor(V06.accent)
    .text(titulo.toUpperCase(), MARGIN, doc.y, {
      characterSpacing: 1.2,
      width: CONTENT_W,
      lineBreak: false,
      ellipsis: true,
    })
  doc.moveDown(0.2)
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .lineWidth(0.3)
    .strokeColor(V06.lineSoft)
    .stroke()
  doc.moveDown(0.3)
}

/**
 * Variante de miniH3 posicionada em (x,y) absoluto — usada em layouts
 * two-col onde cada coluna tem origem própria. Atualiza doc.y pro fim
 * do título pra próxima chamada seguir o fluxo.
 */
function miniH3Xy(doc: PDFDoc, titulo: string, x: number, y: number, w: number): void {
  doc
    .font(F.sansBold)
    .fontSize(9)
    .fillColor(V06.accent)
    .text(titulo.toUpperCase(), x, y, {
      characterSpacing: 1.2,
      width: w,
      lineBreak: false,
      ellipsis: true,
    })
}

function renderKpiRow(
  doc: PDFDoc,
  kpis: Array<{ lbl: string; val: string; sub: string }>,
): void {
  const y0 = doc.y
  const totalW = doc.page.width - MARGIN * 2
  const colW = totalW / kpis.length
  const padX = 10
  const innerW = colW - padX * 2
  const h = 78 // +16pt pra valores longos renderizarem em 2 linhas sem overflow

  doc
    .rect(MARGIN, y0, totalW, h)
    .lineWidth(0.5)
    .strokeColor(V06.line)
    .stroke()

  for (let i = 0; i < kpis.length; i++) {
    const x = MARGIN + i * colW
    if (i > 0) {
      doc
        .moveTo(x, y0)
        .lineTo(x, y0 + h)
        .lineWidth(0.3)
        .strokeColor(V06.line)
        .stroke()
    }
    // Label
    doc
      .font(F.mono)
      .fontSize(7)
      .fillColor(V06.muted)
      .text(kpis[i].lbl.toUpperCase(), x + padX, y0 + 10, {
        characterSpacing: 1.4,
        width: innerW,
        lineBreak: false,
        ellipsis: true,
      })
    // Valor: fonte adaptativa (16pt base, 13pt se muito comprido)
    const valTxt = kpis[i].val
    doc.font(F.display)
    const baseSize = 17
    const estWidth = doc.widthOfString(valTxt, { size: baseSize } as never)
    const adaptiveSize = estWidth > innerW ? 13 : baseSize
    doc
      .font(F.display)
      .fontSize(adaptiveSize)
      .fillColor(V06.ink)
      .text(valTxt, x + padX, y0 + 24, {
        width: innerW,
        height: 32,
        lineBreak: true,
        ellipsis: true,
        lineGap: 1,
      })
    // Sub
    doc
      .font(F.sans)
      .fontSize(8)
      .fillColor(V06.muted)
      .text(kpis[i].sub, x + padX, y0 + h - 18, {
        width: innerW,
        height: 14,
        lineBreak: false,
        ellipsis: true,
      })
  }
  doc.y = y0 + h + 6
}

function renderPullQuote(doc: PDFDoc, quote: string, caption: string): void {
  const y0 = doc.y
  const innerX = MARGIN + 14
  const innerW = doc.page.width - MARGIN * 2 - 14 - 8

  doc
    .font(F.displayItalic)
    .fontSize(14)
    .fillColor(V06.ink)
    .text(quote, innerX, y0 + 4, { width: innerW, lineGap: 3 })
  // doc.y agora é o fim do quote
  const capY = doc.y + 6
  doc
    .font(F.mono)
    .fontSize(7.5)
    .fillColor(V06.muted)
    .text(caption.toUpperCase(), innerX, capY, {
      characterSpacing: 1.4,
      width: innerW,
      lineBreak: false,
      ellipsis: true,
    })
  const endY = doc.y + 6
  doc.rect(MARGIN, y0, 3, endY - y0).fill(V06.accent2)
  doc.y = endY + 4
}

function renderTwoColLists(
  doc: PDFDoc,
  p: {
    leftTitle: string
    leftItems: string[]
    rightTitle: string
    rightItems: string[]
  },
): void {
  const y0 = doc.y
  const colW = (doc.page.width - MARGIN * 2 - 24) / 2
  const rx = MARGIN + colW + 24

  // Helper que renderiza UMA coluna a partir de y0 e devolve o y final.
  // Usa heightOfString pra calcular a altura real de cada item antes de
  // posicionar — evita sobreposição quando item quebra em 2-3 linhas.
  const renderCol = (
    x: number,
    title: string,
    items: string[],
  ): number => {
    doc
      .font(F.sansBold)
      .fontSize(9)
      .fillColor(V06.accent)
      .text(title.toUpperCase(), x, y0, {
        characterSpacing: 1.2,
        width: colW,
        lineBreak: false,
        ellipsis: true,
      })
    doc
      .moveTo(x, y0 + 14)
      .lineTo(x + colW, y0 + 14)
      .lineWidth(0.3)
      .strokeColor(V06.lineSoft)
      .stroke()
    let cy = y0 + 20
    const list = items.length > 0 ? items : ['—']
    for (const item of list) {
      const txt = `→  ${item}`
      doc.font(F.sans).fontSize(9.5)
      const itemH = doc.heightOfString(txt, { width: colW, lineGap: 2 })
      doc
        .fillColor(V06.ink2)
        .text(txt, x, cy, { width: colW, lineGap: 2 })
      cy += itemH + 4
    }
    return cy
  }

  const lyL = renderCol(MARGIN, p.leftTitle, p.leftItems)
  const lyR = renderCol(rx, p.rightTitle, p.rightItems)
  doc.y = Math.max(lyL, lyR) + 6
}

function renderKvCol(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  items: Array<[string, string]>,
): void {
  const labelW = w * 0.40
  const valueX = x + w * 0.42
  const valueW = w * 0.58
  let cy = y
  for (const [k, v] of items) {
    // Mede altura real do valor antes de renderizar — garante que
    // próxima linha não colida com a anterior quando valor quebra.
    doc.font(F.sans).fontSize(10)
    const valH = doc.heightOfString(v, { width: valueW, lineGap: 2 })
    const rowH = Math.max(16, valH + 4)
    // Label mono
    doc
      .font(F.mono)
      .fontSize(7.5)
      .fillColor(V06.muted)
      .text(k.toUpperCase(), x, cy + 1, {
        characterSpacing: 1.2,
        width: labelW,
        lineBreak: false,
        ellipsis: true,
      })
    // Valor
    doc
      .font(F.sans)
      .fontSize(10)
      .fillColor(V06.ink)
      .text(v, valueX, cy, { width: valueW, lineGap: 2 })
    cy += rowH
  }
  doc.y = cy
}

function renderTableSimple(
  doc: PDFDoc,
  cols: Array<{ header: string; widthPct: number; align?: 'left' | 'right' | 'center' }>,
  rows: string[][],
): void {
  const tableW = doc.page.width - MARGIN * 2
  const colWs = cols.map((c) => (c.widthPct / 100) * tableW)

  const renderRow = (cells: string[], font: string, color: string, isHeader: boolean) => {
    const y = doc.y
    const padX = 6
    const padY = 5
    doc.font(font).fontSize(isHeader ? 7.5 : 9.5)
    let maxH = 0
    for (let i = 0; i < cols.length; i++) {
      const h = doc.heightOfString(cells[i] ?? '', { width: colWs[i] - padX * 2 })
      if (h > maxH) maxH = h
    }
    const rowH = maxH + padY * 2

    // Page-break: se a linha não cabe, quebra e repinta o fundo.
    if (y + rowH > Y_SAFE_BOTTOM) {
      doc.addPage()
      pageBg(doc)
    }
    const yFinal = doc.y

    let cx = MARGIN
    for (let i = 0; i < cols.length; i++) {
      const txt = isHeader ? (cells[i] ?? '').toUpperCase() : (cells[i] ?? '')
      doc
        .fillColor(color)
        .font(font)
        .fontSize(isHeader ? 7.5 : 9.5)
        .text(txt, cx + padX, yFinal + padY, {
          width: colWs[i] - padX * 2,
          align: cols[i].align ?? 'left',
          ...(isHeader ? { characterSpacing: 1.2 } : {}),
        })
      cx += colWs[i]
    }

    // Grid horizontal
    const lineColor = isHeader ? V06.accent2 : V06.lineSoft
    const lineWidth = isHeader ? 0.8 : 0.3
    doc
      .moveTo(MARGIN, yFinal + rowH)
      .lineTo(MARGIN + tableW, yFinal + rowH)
      .lineWidth(lineWidth)
      .strokeColor(lineColor)
      .stroke()
    doc.y = yFinal + rowH
  }

  renderRow(
    cols.map((c) => c.header),
    F.mono,
    V06.accent,
    true,
  )
  for (const r of rows) {
    renderRow(r, F.sans, V06.ink2, false)
  }
  doc.moveDown(0.3)
}

function renderVerdictGrid(
  doc: PDFDoc,
  items: Array<{ v: string; lbl: string }>,
): void {
  const y0 = doc.y
  const totalW = doc.page.width - MARGIN * 2
  const colW = totalW / items.length
  const h = 72

  doc
    .rect(MARGIN, y0, totalW, h)
    .lineWidth(0.5)
    .strokeColor(V06.accent2)
    .stroke()

  for (let i = 0; i < items.length; i++) {
    const x = MARGIN + i * colW
    if (i > 0) {
      doc
        .moveTo(x, y0)
        .lineTo(x, y0 + h)
        .lineWidth(0.3)
        .strokeColor(V06.accent2)
        .stroke()
    }
    doc
      .font(F.displayItalic)
      .fontSize(28)
      .fillColor(V06.accent2)
      .text(items[i].v, x, y0 + 14, {
        width: colW,
        align: 'center',
        lineBreak: false,
      })
    doc
      .font(F.mono)
      .fontSize(7.5)
      .fillColor(V06.muted)
      .text(items[i].lbl.toUpperCase(), x, y0 + 52, {
        width: colW,
        align: 'center',
        characterSpacing: 1.4,
        lineBreak: false,
      })
  }
  doc.y = y0 + h + 4
}

function renderMarkdownInline(doc: PDFDoc, md: string): void {
  if (!md) return
  doc.font(F.sans).fontSize(10.5).fillColor(V06.ink2)
  const linhas = md.split('\n')
  for (const bruta of linhas) {
    const l = bruta.trimEnd()
    if (!l.trim()) {
      doc.moveDown(0.4)
      continue
    }
    // Page-break preventivo se já estamos perto do bottom
    if (doc.y > Y_SAFE_BOTTOM - 30) {
      doc.addPage()
      pageBg(doc)
    }
    if (l.startsWith('## ')) {
      doc.moveDown(0.6)
      doc
        .font(F.display)
        .fontSize(17)
        .fillColor(V06.ink)
        .text(l.slice(3).trim(), MARGIN, doc.y, {
          width: CONTENT_W,
          lineGap: 1,
        })
      const fioY = doc.y + 2
      doc.rect(MARGIN, fioY, 36, 1.2).fill(V06.accent2)
      doc.y = fioY + 8
      doc.font(F.sans).fontSize(10.5).fillColor(V06.ink2)
      continue
    }
    if (l.startsWith('### ')) {
      doc.moveDown(0.4)
      doc
        .font(F.sansBold)
        .fontSize(11)
        .fillColor(V06.ink)
        .text(l.slice(4).trim(), MARGIN, doc.y, {
          width: CONTENT_W,
          lineGap: 1,
        })
      doc.moveDown(0.15)
      doc.font(F.sans).fontSize(10.5).fillColor(V06.ink2)
      continue
    }
    if (l.trim() === '---') {
      doc.moveDown(0.25)
      doc
        .moveTo(MARGIN, doc.y)
        .lineTo(doc.page.width - MARGIN, doc.y)
        .lineWidth(0.3)
        .strokeColor(V06.lineSoft)
        .stroke()
      doc.moveDown(0.25)
      continue
    }
    if (/^\s*[-•]\s+/.test(l)) {
      const texto = l.replace(/^\s*[-•]\s+/, '')
      renderPar(doc, `•  ${texto}`, { indent: 10 })
      continue
    }
    if (/^\*[^*].*\*$/.test(l.trim())) {
      const texto = l.trim().replace(/^\*|\*$/g, '')
      doc
        .font(F.sansItalic)
        .fontSize(9.5)
        .fillColor(V06.muted)
        .text(texto, MARGIN, doc.y, {
          width: CONTENT_W,
          align: 'justify',
          lineGap: 2,
        })
      doc.moveDown(0.25)
      doc.font(F.sans).fontSize(10.5).fillColor(V06.ink2)
      continue
    }
    renderPar(doc, l)
  }
}

function renderPar(doc: PDFDoc, texto: string, opts: { indent?: number } = {}): void {
  const partes = parseBold(texto)
  const indent = opts.indent ?? 0
  const x = MARGIN + indent
  const width = CONTENT_W - indent
  let primeira = true
  for (const p of partes) {
    doc
      .font(p.bold ? F.sansBold : F.sans)
      .fontSize(10.5)
      .fillColor(V06.ink2)
      .text(p.texto, primeira ? x : undefined, primeira ? doc.y : undefined, {
        continued: !p.ultima,
        align: 'justify',
        width: primeira ? width : undefined,
        lineGap: 2,
      })
    primeira = false
  }
  doc.moveDown(0.2)
}

function parseBold(texto: string): Array<{ texto: string; bold: boolean; ultima: boolean }> {
  const partes: Array<{ texto: string; bold: boolean; ultima: boolean }> = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) partes.push({ texto: texto.slice(last, m.index), bold: false, ultima: false })
    partes.push({ texto: m[1], bold: true, ultima: false })
    last = m.index + m[0].length
  }
  if (last < texto.length) partes.push({ texto: texto.slice(last), bold: false, ultima: false })
  if (partes.length === 0) partes.push({ texto, bold: false, ultima: true })
  else partes[partes.length - 1].ultima = true
  return partes
}

// ══════════════════════════════════════════════════════════════════════════
// LÓGICA DE DOMÍNIO — avaliação do perfil, textos variáveis
// ══════════════════════════════════════════════════════════════════════════

function avaliarPerfil(perfil: PerfilEntrevista): {
  fortes: string[]
  atencao: string[]
  parecer: 'favoravel' | 'com_ressalvas' | 'restrita'
} {
  const fortes: string[] = []
  const atencao: string[] = []

  if (perfil.propriedade?.regime === 'propria') fortes.push('Propriedade própria — garantia real disponível')
  if (perfil.propriedade?.car_situacao === 'ativo') fortes.push('CAR ativo e regular')
  if (perfil.propriedade?.ccir_em_dia) fortes.push('CCIR quitado no exercício')
  if (perfil.propriedade?.itr_em_dia) fortes.push('ITR em dia (últimos exercícios)')
  if (perfil.documentacao_pf?.cnd_federal && perfil.documentacao_pf?.cnd_estadual) fortes.push('CNDs federal e estadual regulares')
  if (perfil.financeiro?.parcelas_em_atraso === false && perfil.financeiro?.credito_rural_ativo === false)
    fortes.push('Histórico bancário limpo, sem inadimplência')
  if (perfil.perfil?.tempo_atividade_anos != null && perfil.perfil.tempo_atividade_anos >= 5)
    fortes.push(`${perfil.perfil.tempo_atividade_anos} anos de atividade — mercado consolidado`)

  if (perfil.propriedade?.car_situacao === 'pendente') atencao.push('CAR pendente — exigência do comitê')
  if (perfil.propriedade?.car_situacao === 'nao_feito') atencao.push('CAR não cadastrado — bloqueia operação')
  if (perfil.propriedade?.ccir_em_dia === false) atencao.push('CCIR sem quitação atualizada')
  if (perfil.financeiro?.parcelas_em_atraso) atencao.push('Parcelas em atraso ativas — SCR/Bacen')
  if (perfil.pendencias?.sanitaria?.tem_pendencia) atencao.push('Pendência sanitária declarada')
  if (perfil.pendencias?.ambiental?.tem_pendencia) atencao.push('Pendência ambiental declarada')
  if (perfil.pendencias?.judicial?.tem_pendencia) atencao.push('Pendência judicial declarada')
  if (perfil.propriedade?.matricula_em_nome_proprio === false)
    atencao.push('Matrícula em nome de terceiro — limita garantia direta')

  // Parecer final
  let parecer: 'favoravel' | 'com_ressalvas' | 'restrita' = 'favoravel'
  const bloqueadores = atencao.filter((a) =>
    /bloqueia|em atraso|nome de terceiro|sem quitação/i.test(a),
  ).length
  if (bloqueadores >= 2) parecer = 'restrita'
  else if (atencao.length >= 1) parecer = 'com_ressalvas'
  return { fortes, atencao, parecer }
}

function tituloSumario(
  parecer: 'favoravel' | 'com_ressalvas' | 'restrita',
): string {
  switch (parecer) {
    case 'favoravel':
      return 'Operação apta, lastro confortável'
    case 'com_ressalvas':
      return 'Operação viável com ressalvas'
    case 'restrita':
      return 'Operação requer regularização'
  }
}

function tituloParecer(parecer: 'favoravel' | 'com_ressalvas' | 'restrita'): string {
  switch (parecer) {
    case 'favoravel':
      return 'Juízo favorável à concessão'
    case 'com_ressalvas':
      return 'Juízo favorável com ressalvas'
    case 'restrita':
      return 'Juízo condicional — regularização prévia'
  }
}

function tituloCapa(tier: TierLaudo): string {
  if (tier === 'diagnostico') {
    return 'Diagnóstico\nde viabilidade\nde {{em}}crédito.'
  }
  if (tier === 'mentoria') {
    return 'Parecer\nestratégico\nde {{em}}crédito.'
  }
  return 'Crédito rural\nno padrão\ndo {{em}}comitê.'
}

function ledeCapa(input: LaudoInput): string {
  const nome = primeirosDoisNomes(input.perfil.perfil?.nome || input.produtor.nome || 'o produtor')
  if (input.tier === 'diagnostico') {
    return `Leitura preliminar da viabilidade de crédito rural pleiteada por ${nome}, com base no perfil autodeclarado em entrevista. Não substitui o dossiê completo com defesa de crédito.`
  }
  if (input.tier === 'mentoria') {
    return `Revisão cirúrgica do dossiê de ${nome} conduzida pela Consultoria Especializada — identificação de gargalos ocultos, parecer estratégico e roteiro de defesa oral em comitê.`
  }
  return `Laudo técnico institucional — caracterização da propriedade, análise de viabilidade, estrutura de garantias e parecer conclusivo sobre a operação pleiteada por ${nome}.`
}

function kickerTier(tier: TierLaudo): string {
  if (tier === 'diagnostico') return 'Diagnóstico de viabilidade'
  if (tier === 'mentoria') return 'Assessoria Premium · Plano Ouro'
  return 'Operação de crédito rural'
}

function safraAtual(): string {
  const y = new Date().getFullYear() % 100
  return `${y}/${y + 1}`
}

function numeroDoc(tier: TierLaudo): string {
  const y = new Date().getFullYear()
  const prefixo = tier === 'diagnostico' ? 'AB-DV' : tier === 'mentoria' ? 'AB-MC' : 'AB-LCR'
  const rand = Math.floor(Math.random() * 900 + 100)
  return `${prefixo}-${y}/${rand}`
}

function shortProc(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

function primeirosDoisNomes(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  if (partes.length <= 2) return nome
  return `${partes[0]} ${partes[partes.length - 1]}`
}

function pullQuoteSumario(parecer: 'favoravel' | 'com_ressalvas' | 'restrita'): string {
  if (parecer === 'favoravel')
    return 'Operação tecnicamente viável, com lastro confortável e perfil consistente com os parâmetros de aceitação do comitê.'
  if (parecer === 'com_ressalvas')
    return 'Operação com viabilidade reconhecida, condicionada à regularização dos pontos de atenção antes do protocolo.'
  return 'Operação requer regularização prévia dos itens bloqueadores para retornar à análise de viabilidade plena.'
}

function statusCurto(parecer: 'favoravel' | 'com_ressalvas' | 'restrita'): string {
  if (parecer === 'favoravel') return 'apta'
  if (parecer === 'com_ressalvas') return 'ressalva'
  return 'restrita'
}

function resumoSumario(
  input: LaudoInput,
  ga: ReturnType<typeof avaliarPerfil>,
): string {
  const perfil = input.perfil
  const nome = perfil.perfil?.nome || input.produtor.nome
  const tipo = perfil.necessidade_credito?.tipo ?? 'crédito rural'
  const valor = input.valor ? brl(input.valor) : 'valor a definir'
  const regime = regimeParaTexto(perfil.propriedade?.regime)
  const area = perfil.propriedade?.area_hectares
    ? `${Number(perfil.propriedade.area_hectares).toLocaleString('pt-BR')} ha`
    : 'área não informada'
  const local = `${perfil.perfil?.municipio ?? '—'}/${perfil.perfil?.estado ?? '—'}`
  const atividade = perfil.perfil?.atividade_principal ?? 'atividade rural'
  const parecerTxt =
    ga.parecer === 'favoravel'
      ? 'apresenta parecer preliminar favorável'
      : ga.parecer === 'com_ressalvas'
      ? 'apresenta parecer favorável condicionado a ressalvas específicas'
      : 'demanda regularização antes da análise de viabilidade plena'
  return (
    `${nome} solicita operação de ${tipo} no valor de ${valor}. ` +
    `Lastro em ${regime.toLowerCase()} de ${area} em ${local}, dedicada a ${atividade}. ` +
    `Nesta leitura, a operação ${parecerTxt}.`
  )
}

function tituloFinalidade(input: LaudoInput): string {
  const t = input.perfil.necessidade_credito?.tipo
  if (t === 'custeio') return 'custeio safra'
  if (t === 'investimento') return 'investimento rural'
  if (t === 'comercializacao') return 'comercialização'
  return 'crédito rural'
}

function tituloViabilidade(input: LaudoInput): string {
  const t = input.perfil.necessidade_credito?.tipo
  if (t === 'investimento') return 'Projeto, projeção e retorno'
  if (t === 'custeio') return 'Custeio, prazo e comercialização'
  return 'Objeto e enquadramento'
}

function descricaoViabilidade(input: LaudoInput): string {
  const t = input.perfil.necessidade_credito?.tipo ?? 'crédito rural'
  const fin = input.perfil.necessidade_credito?.finalidade ?? 'finalidade a detalhar'
  const prazo = input.perfil.necessidade_credito?.prazo_preferido ?? 'prazo a definir'
  return (
    `Operação de ${t}, finalidade ${fin}, com prazo ${prazo}. ` +
    `A viabilidade técnica e econômica detalhada segue no parecer editorial a seguir, ` +
    `acompanhada da análise de enquadramento na Manual de Crédito Rural e considerações ` +
    `sobre capacidade de pagamento, respaldo patrimonial e histórico operacional.`
  )
}

function textoParecer(input: LaudoInput, ga: ReturnType<typeof avaliarPerfil>): string {
  const nome = input.perfil.perfil?.nome || input.produtor.nome
  const valor = input.valor ? brl(input.valor) : 'valor a definir'
  if (ga.parecer === 'favoravel') {
    return (
      `Considerando a regularidade documental, a viabilidade técnica e econômica do projeto, ` +
      `a estrutura de garantias ofertada e o histórico operacional de ${nome}, emite-se juízo ` +
      `FAVORÁVEL à concessão da operação no valor de ${valor}, condicionada à formalização ` +
      `das garantias descritas, à confirmação da capacidade de pagamento por meio de ` +
      `documentação complementar (IR, notas fiscais de comercialização, registrato do Bacen) ` +
      `e à observância do cronograma de desembolso.`
    )
  }
  if (ga.parecer === 'com_ressalvas') {
    return (
      `Considerando o perfil apresentado por ${nome}, a operação no valor de ${valor} é ` +
      `tecnicamente viável, mas sua aprovação depende da regularização dos pontos de ` +
      `atenção identificados na seção anterior. Cumpridas tais condicionantes, o parecer ` +
      `retorna a FAVORÁVEL. O comitê do credor pode optar por exigência formal prévia ou ` +
      `aprovar condicionado a cláusulas específicas no instrumento.`
    )
  }
  return (
    `O perfil apresentado por ${nome} contém itens que restringem a análise de viabilidade ` +
    `plena da operação no valor de ${valor}. Recomenda-se o saneamento prévio dos ` +
    `pontos bloqueadores identificados (ver seção "pontos de atenção") antes do ` +
    `protocolo. Uma vez regularizados, o processo retorna à análise regular.`
  )
}
