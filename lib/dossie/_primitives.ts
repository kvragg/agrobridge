/**
 * Primitivas de render PDF reutilizadas pelos 3 tiers (Bronze/Prata/Ouro).
 *
 * Nada aqui conhece markdown do laudo — isso fica em cada template. Aqui
 * só blocos visuais: capa, header/footer, badges, cards, tabelas, divisores,
 * key-value, eyebrows.
 *
 * Decisão de layout:
 * - Margens de 54pt (esquerda/direita) = 0.75" = folga boa pra scan + boa
 *   proporção com A4.
 * - Hierarquia construída por peso + tamanho + cor, nunca só por tamanho.
 * - Linhas finas (0.5pt) em tom line — estilo docs oficiais (CAR/CCIR).
 */

import type PDFDocument from 'pdfkit'
import { COLOR, FONT, SIZE, SPACE, type TierTheme } from './_theme'

type PDFDoc = InstanceType<typeof PDFDocument>

export interface PageContext {
  theme: TierTheme
  produtor: {
    nome: string
    cpf?: string
  }
  processoId: string
}

// ── Eyebrow ────────────────────────────────────────────────────────────────
// Rótulo mono uppercase que identifica seção/contexto. Replica a estética
// de UPPERCASE + letter-spacing do site.

export function renderEyebrow(
  doc: PDFDoc,
  texto: string,
  options: { color?: string; x?: number; y?: number; size?: number } = {},
): void {
  const x = options.x ?? SPACE.margin
  const y = options.y ?? doc.y
  const size = options.size ?? SIZE.eyebrow
  doc
    .font(FONT.mono)
    .fontSize(size)
    .fillColor(options.color ?? COLOR.muted)
    .text(texto.toUpperCase(), x, y, { characterSpacing: 1.6, lineBreak: false })
}

// ── Divisor horizontal ─────────────────────────────────────────────────────

export function renderDivider(
  doc: PDFDoc,
  options: { y?: number; color?: string; dashed?: boolean } = {},
): void {
  const y = options.y ?? doc.y
  const color = options.color ?? COLOR.line
  const { width } = doc.page
  const line = doc
    .moveTo(SPACE.margin, y)
    .lineTo(width - SPACE.margin, y)
    .lineWidth(0.5)
    .strokeColor(color)

  if (options.dashed) line.dash(2, { space: 2 })
  line.stroke()
  if (options.dashed) doc.undash()
  doc.y = y + 6
}

// ── Badge ──────────────────────────────────────────────────────────────────
// Pílula de status (APTO / PENDENTE / ATENÇÃO). Usada no dossiê e mentoria
// pra marcar status de itens de checklist e blocos de análise.

export function renderBadge(
  doc: PDFDoc,
  texto: string,
  variant: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral',
  options: { x?: number; y?: number } = {},
): void {
  const color =
    variant === 'success'
      ? COLOR.success
      : variant === 'warning'
      ? COLOR.warning
      : variant === 'danger'
      ? COLOR.danger
      : COLOR.muted

  const fontSize = 7.5
  doc.font(FONT.mono).fontSize(fontSize)
  const w = doc.widthOfString(texto.toUpperCase(), { characterSpacing: 1.2 }) + 12
  const h = 14
  const x = options.x ?? doc.x
  const y = options.y ?? doc.y

  doc
    .roundedRect(x, y, w, h, 3)
    .lineWidth(0.6)
    .strokeColor(color)
    .stroke()

  doc
    .fillColor(color)
    .text(texto.toUpperCase(), x, y + 3.5, {
      width: w,
      align: 'center',
      characterSpacing: 1.2,
      lineBreak: false,
    })
}

// ── Lista chave-valor ──────────────────────────────────────────────────────
// Tipo "specification list" que os docs oficiais usam — duas colunas,
// label muted à esquerda, valor ink à direita. Proporção 40/60.

export interface KeyValue {
  label: string
  value: string
  /** Se true, valor em negrito (destaca). */
  strong?: boolean
}

export function renderKeyValueList(
  doc: PDFDoc,
  items: KeyValue[],
  options: { x?: number; width?: number; rowHeight?: number } = {},
): void {
  const x = options.x ?? SPACE.margin
  const width = options.width ?? doc.page.width - SPACE.margin * 2
  const labelWidth = width * 0.38
  const valueWidth = width * 0.62
  const rowHeight = options.rowHeight ?? 16

  for (const item of items) {
    const y = doc.y
    doc
      .font(FONT.sans)
      .fontSize(SIZE.body)
      .fillColor(COLOR.muted)
      .text(item.label, x, y, { width: labelWidth, lineBreak: false })

    doc
      .font(item.strong ? FONT.sansBold : FONT.sans)
      .fontSize(SIZE.body)
      .fillColor(COLOR.ink)
      .text(item.value || '—', x + labelWidth, y, {
        width: valueWidth,
        lineBreak: true,
      })

    const usedHeight = Math.max(doc.y - y, rowHeight)
    doc.y = y + usedHeight + 2
  }
}

// ── Tabela ─────────────────────────────────────────────────────────────────
// Tabela com header, grid fina, zebra opcional. Proporções das colunas em %.
// Replica estética das tabelas do CCIR/CAR.

export interface TableColumn {
  header: string
  widthPct: number
  align?: 'left' | 'right' | 'center'
}

export function renderTable(
  doc: PDFDoc,
  columns: TableColumn[],
  rows: string[][],
  options: {
    x?: number
    tableWidth?: number
    accent?: string
    zebra?: boolean
  } = {},
): void {
  const x = options.x ?? SPACE.margin
  const tableWidth =
    options.tableWidth ?? doc.page.width - SPACE.margin * 2
  const accent = options.accent ?? COLOR.ink

  const colWidths = columns.map((c) => (c.widthPct / 100) * tableWidth)

  const renderRow = (
    cells: string[],
    font: string,
    color: string,
    bg?: string,
  ) => {
    const y = doc.y
    const padX = 6
    const padY = 5

    // Calcula altura da linha pelo maior texto
    doc.font(font).fontSize(SIZE.body)
    let maxH = 0
    for (let i = 0; i < columns.length; i++) {
      const h = doc.heightOfString(cells[i] ?? '', {
        width: colWidths[i] - padX * 2,
      })
      if (h > maxH) maxH = h
    }
    const rowH = maxH + padY * 2

    if (bg) doc.rect(x, y, tableWidth, rowH).fill(bg)

    let cx = x
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      doc
        .fillColor(color)
        .font(font)
        .fontSize(SIZE.body)
        .text(cells[i] ?? '', cx + padX, y + padY, {
          width: colWidths[i] - padX * 2,
          align: col.align ?? 'left',
          lineBreak: true,
        })
      cx += colWidths[i]
    }

    // Grid horizontal inferior
    doc
      .moveTo(x, y + rowH)
      .lineTo(x + tableWidth, y + rowH)
      .lineWidth(0.4)
      .strokeColor(COLOR.lineSoft)
      .stroke()

    doc.y = y + rowH
  }

  // Header
  renderRow(
    columns.map((c) => c.header.toUpperCase()),
    FONT.mono,
    accent,
    undefined,
  )
  doc
    .moveTo(x, doc.y - 0.3)
    .lineTo(x + tableWidth, doc.y - 0.3)
    .lineWidth(0.8)
    .strokeColor(accent)
    .stroke()

  // Body
  rows.forEach((row, i) => {
    const zebraBg =
      options.zebra && i % 2 === 1 ? COLOR.bgSoft : undefined
    renderRow(row, FONT.sans, COLOR.ink2, zebraBg)
  })

  doc.moveDown(0.5)
}

// ── Bloco com accent lateral ───────────────────────────────────────────────
// Usado pra destacar seções (sumário, callout, CTA). Renderiza accent fino
// vertical à esquerda APÓS o conteúdo — evita problema de z-order do pdfkit.
// Visual estilo Linear/Stripe — clean, sem fundo, sem borda externa.

export function renderAccentBlock(
  doc: PDFDoc,
  draw: (inner: { x: number; width: number }) => void,
  options: {
    accent?: string
    indent?: number
    accentWidth?: number
  } = {},
): void {
  const accent = options.accent ?? COLOR.green
  const accentWidth = options.accentWidth ?? 2.5
  const indent = options.indent ?? 14
  const startY = doc.y
  const innerX = SPACE.margin + indent
  const innerWidth = doc.page.width - SPACE.margin * 2 - indent

  draw({ x: innerX, width: innerWidth })

  const endY = doc.y
  // Accent vertical à esquerda
  doc
    .rect(SPACE.margin, startY, accentWidth, endY - startY)
    .fill(accent)

  doc.y = endY + 4
  doc.fillColor(COLOR.ink2) // reset
}

// ── Card com fundo (altura conhecida) ──────────────────────────────────────
// Pra usar em capa ou cabeçalhos de seção onde a altura é previsível.

export function renderFilledCard(
  doc: PDFDoc,
  height: number,
  draw: (inner: { x: number; y: number; width: number; height: number }) => void,
  options: {
    bg?: string
    borderColor?: string
    accentLeft?: string
    padding?: number
  } = {},
): void {
  const padding = options.padding ?? 16
  const bg = options.bg ?? COLOR.bgCard
  const borderColor = options.borderColor ?? COLOR.line
  const { width } = doc.page
  const x = SPACE.margin
  const cardWidth = width - SPACE.margin * 2
  const startY = doc.y

  // 1. Desenha bg + borda PRIMEIRO
  doc
    .rect(x, startY, cardWidth, height)
    .lineWidth(0.5)
    .fillAndStroke(bg, borderColor)
  if (options.accentLeft) {
    doc.rect(x, startY, 3, height).fill(options.accentLeft)
  }

  // 2. Renderiza conteúdo POR CIMA
  const accentOffset = options.accentLeft ? 6 : 0
  const innerX = x + padding + accentOffset
  const innerY = startY + padding
  const innerWidth = cardWidth - padding * 2 - accentOffset
  const innerHeight = height - padding * 2

  doc.y = innerY
  doc.fillColor(COLOR.ink2)
  draw({ x: innerX, y: innerY, width: innerWidth, height: innerHeight })

  doc.y = startY + height + 4
}

// ── Header / footer de página (aplicado ao final, em todas as páginas) ────
//
// Por que ao final em vez de via evento `pageAdded`?
// `pageAdded` cria recursão: o doc.text() do chrome pode trigger overflow
// que dispara novo pageAdded → stack overflow. A abordagem oficial do
// pdfkit pra header/footer cross-page é usar `bufferPages: true` no doc e
// finalizar tudo via `bufferedPageRange()` antes de `doc.end()`.

export function finalizePageChrome(doc: PDFDoc, ctx: PageContext): void {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    const pageNum = i - range.start + 1
    const { width, height } = doc.page

    // Eyebrow de topo (à esquerda)
    doc
      .font(FONT.mono)
      .fontSize(7.5)
      .fillColor(ctx.theme.accent)
      .text(ctx.theme.eyebrowHeader, SPACE.margin, 26, {
        characterSpacing: 1.6,
        lineBreak: false,
      })

    // Nome do produtor alinhado à direita no topo
    doc
      .font(FONT.sans)
      .fontSize(7.5)
      .fillColor(COLOR.muted)
      .text(ctx.produtor.nome, width / 2, 26, {
        width: width / 2 - SPACE.margin,
        align: 'right',
        lineBreak: false,
      })

    // Fio de topo
    doc
      .moveTo(SPACE.margin, 42)
      .lineTo(width - SPACE.margin, 42)
      .lineWidth(0.5)
      .strokeColor(COLOR.line)
      .stroke()

    // Rodapé — fio + crédito + paginação
    const footY = height - 40
    doc
      .moveTo(SPACE.margin, footY - 8)
      .lineTo(width - SPACE.margin, footY - 8)
      .lineWidth(0.5)
      .strokeColor(COLOR.line)
      .stroke()

    doc
      .font(FONT.mono)
      .fontSize(6.5)
      .fillColor(COLOR.muted)
      .text(
        `AGROBRIDGE · ${ctx.theme.nomeProduto.toUpperCase()}`,
        SPACE.margin,
        footY,
        { characterSpacing: 1.4, lineBreak: false },
      )

    doc
      .font(FONT.mono)
      .fontSize(6.5)
      .fillColor(COLOR.muted)
      .text(`PÁG. ${pageNum}`, width - SPACE.margin - 60, footY, {
        width: 60,
        align: 'right',
        characterSpacing: 1.4,
        lineBreak: false,
      })
  }
}

// ── Rodapé de upsell (bronze → prata, prata → ouro) ────────────────────────

export interface UpsellFooterOptions {
  eyebrow: string
  titulo: string
  corpo: string
  accent: string
  /** Se true, exibe "vagas limitadas" pro Ouro. */
  destaqueOuro?: boolean
}

export function renderUpsellFooter(
  doc: PDFDoc,
  opts: UpsellFooterOptions,
): void {
  const { width, height } = doc.page
  const y = height - 150

  // Fio accent superior
  doc
    .moveTo(SPACE.margin, y - 10)
    .lineTo(width - SPACE.margin, y - 10)
    .lineWidth(0.8)
    .strokeColor(opts.accent)
    .stroke()

  // Eyebrow
  doc
    .font(FONT.mono)
    .fontSize(SIZE.eyebrow)
    .fillColor(opts.accent)
    .text(opts.eyebrow.toUpperCase(), SPACE.margin, y, {
      characterSpacing: 1.6,
      lineBreak: false,
    })

  // Título
  doc
    .font(FONT.sansBold)
    .fontSize(SIZE.h3)
    .fillColor(COLOR.ink)
    .text(opts.titulo, SPACE.margin, y + 16, {
      width: width - SPACE.margin * 2,
    })

  // Corpo
  doc
    .font(FONT.sans)
    .fontSize(SIZE.body)
    .fillColor(COLOR.ink2)
    .text(opts.corpo, SPACE.margin, doc.y + 4, {
      width: width - SPACE.margin * 2,
      align: 'justify',
    })
}

// ── Render markdown simplificado ───────────────────────────────────────────
// ## H2 (accent do tier) · ### H3 (ink) · #### H4 (ink menor) ·
// **bold inline** · *itálico bloco* · - lista · --- divisor

export function renderMarkdown(
  doc: PDFDoc,
  md: string,
  theme: TierTheme,
): void {
  doc.font(FONT.sans).fontSize(SIZE.body).fillColor(COLOR.ink2)

  const linhas = md.split('\n')
  for (const bruta of linhas) {
    const l = bruta.trimEnd()
    if (!l.trim()) {
      doc.moveDown(0.45)
      continue
    }
    if (l.startsWith('## ')) {
      doc.moveDown(0.8)
      doc
        .font(FONT.sansBold)
        .fontSize(SIZE.h2)
        .fillColor(theme.accentInk)
        .text(l.slice(3).trim(), SPACE.margin)
      // Fio accent curto sob o h2
      const w = Math.min(
        doc.widthOfString(l.slice(3).trim()) * 0.25,
        80,
      )
      doc
        .moveTo(SPACE.margin, doc.y + 2)
        .lineTo(SPACE.margin + w, doc.y + 2)
        .lineWidth(1.2)
        .strokeColor(theme.accent)
        .stroke()
      doc.moveDown(0.5)
      doc.font(FONT.sans).fontSize(SIZE.body).fillColor(COLOR.ink2)
      continue
    }
    if (l.startsWith('### ')) {
      doc.moveDown(0.5)
      doc
        .font(FONT.sansBold)
        .fontSize(SIZE.h3)
        .fillColor(COLOR.ink)
        .text(l.slice(4).trim(), SPACE.margin)
      doc.moveDown(0.15)
      doc.font(FONT.sans).fontSize(SIZE.body).fillColor(COLOR.ink2)
      continue
    }
    if (l.startsWith('#### ')) {
      doc.moveDown(0.3)
      doc
        .font(FONT.sansBold)
        .fontSize(SIZE.body)
        .fillColor(COLOR.ink)
        .text(l.slice(5).trim(), SPACE.margin)
      doc.moveDown(0.1)
      doc.font(FONT.sans).fontSize(SIZE.body).fillColor(COLOR.ink2)
      continue
    }
    if (l.trim() === '---') {
      doc.moveDown(0.3)
      renderDivider(doc)
      doc.moveDown(0.1)
      continue
    }
    if (/^\s*[-•]\s+/.test(l)) {
      const texto = l.replace(/^\s*[-•]\s+/, '')
      renderParagrafoRico(doc, `•  ${texto}`, { indent: 10 })
      continue
    }
    if (/^\*[^*].*\*$/.test(l.trim())) {
      const texto = l.trim().replace(/^\*|\*$/g, '')
      doc
        .font(FONT.sansItalic)
        .fontSize(SIZE.body - 1)
        .fillColor(COLOR.muted)
        .text(texto, SPACE.margin, doc.y, {
          width: doc.page.width - SPACE.margin * 2,
          align: 'justify',
        })
      doc.moveDown(0.3)
      doc.font(FONT.sans).fontSize(SIZE.body).fillColor(COLOR.ink2)
      continue
    }
    renderParagrafoRico(doc, l)
  }
}

function renderParagrafoRico(
  doc: PDFDoc,
  texto: string,
  opts: { indent?: number } = {},
): void {
  const partes = parseBold(texto)
  const { indent = 0 } = opts
  const x = SPACE.margin + indent
  const width = doc.page.width - SPACE.margin * 2 - indent
  let primeira = true
  for (const p of partes) {
    doc
      .font(p.bold ? FONT.sansBold : FONT.sans)
      .fontSize(SIZE.body)
      .fillColor(COLOR.ink2)
      .text(p.texto, primeira ? x : undefined, primeira ? doc.y : undefined, {
        continued: !p.ultima,
        align: 'justify',
        width: primeira ? width : undefined,
      })
    primeira = false
  }
  doc.moveDown(0.25)
}

function parseBold(
  texto: string,
): { texto: string; bold: boolean; ultima: boolean }[] {
  const partes: { texto: string; bold: boolean; ultima: boolean }[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) {
      partes.push({
        texto: texto.slice(last, m.index),
        bold: false,
        ultima: false,
      })
    }
    partes.push({ texto: m[1], bold: true, ultima: false })
    last = m.index + m[0].length
  }
  if (last < texto.length) {
    partes.push({ texto: texto.slice(last), bold: false, ultima: false })
  }
  if (partes.length === 0) {
    partes.push({ texto, bold: false, ultima: true })
  } else {
    partes[partes.length - 1].ultima = true
  }
  return partes
}
