import PDFDocument from 'pdfkit'
import type { PerfilEntrevista } from '@/types/entrevista'

const GREEN = '#0f3d2e'
const INK = '#0a0a0a'
const INK_2 = '#2a2a2a'
const MUTED = '#6b6b64'
const LINE = '#d6d1c3'

export interface ViabilidadeInput {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  perfil: PerfilEntrevista
  /** Markdown completo do parecer gerado pela Sonnet */
  parecerMd: string
}

function dataHoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function montarViabilidadePDF(
  input: ViabilidadeInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 56,
        info: {
          Title: `Parecer de viabilidade de crédito — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Diagnóstico Rápido de viabilidade de crédito rural',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      renderHeader(doc, input)
      renderParecer(doc, input.parecerMd)
      renderUpsellFooter(doc)

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

type PDFDoc = InstanceType<typeof PDFDocument>

function renderHeader(doc: PDFDoc, input: ViabilidadeInput) {
  const { width } = doc.page

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(GREEN)
    .text('AGROBRIDGE · DIAGNÓSTICO RÁPIDO', 56, 40, { characterSpacing: 2 })
  doc
    .moveTo(56, 60)
    .lineTo(width - 56, 60)
    .strokeColor(LINE)
    .stroke()

  doc.font('Helvetica-Bold').fontSize(20).fillColor(INK)
  doc.text('Parecer de viabilidade', 56, 80)

  doc.font('Helvetica').fontSize(10).fillColor(MUTED)
  doc.text(`Produtor: ${input.produtor.nome}`, 56, doc.y + 6)
  doc.text(
    `Localização: ${input.perfil.perfil.municipio || 'não informado'} / ${
      input.perfil.perfil.estado || 'UF'
    }`,
    56,
    doc.y + 2
  )
  doc.text(`Emitido em ${dataHoje()}`, 56, doc.y + 2)

  doc.moveDown(1)
}

function renderParecer(doc: PDFDoc, parecerMd: string) {
  doc.moveDown(0.4)
  doc.font('Helvetica').fontSize(11).fillColor(INK_2)

  const linhas = parecerMd.split('\n')
  for (const bruta of linhas) {
    const l = bruta.trimEnd()
    if (!l.trim()) {
      doc.moveDown(0.4)
      continue
    }
    if (l.startsWith('## ')) {
      doc.moveDown(0.7)
      doc.font('Helvetica-Bold').fontSize(15).fillColor(GREEN).text(l.slice(3).trim())
      doc.moveDown(0.2)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.startsWith('### ')) {
      doc.moveDown(0.45)
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(l.slice(4).trim())
      doc.moveDown(0.15)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.trim() === '---') {
      doc.moveDown(0.25)
      doc
        .moveTo(56, doc.y)
        .lineTo(doc.page.width - 56, doc.y)
        .strokeColor(LINE)
        .stroke()
      doc.moveDown(0.25)
      continue
    }
    if (/^\s*[-•]\s+/.test(l)) {
      const texto = l.replace(/^\s*[-•]\s+/, '')
      renderParagrafo(doc, `• ${texto}`, { indent: 10 })
      continue
    }
    if (/^\*[^*].*\*$/.test(l.trim())) {
      const texto = l.trim().replace(/^\*|\*$/g, '')
      doc
        .font('Helvetica-Oblique')
        .fontSize(9.5)
        .fillColor(MUTED)
        .text(texto, { align: 'justify' })
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      doc.moveDown(0.3)
      continue
    }
    renderParagrafo(doc, l)
  }
}

function renderParagrafo(
  doc: PDFDoc,
  texto: string,
  opts: { indent?: number } = {}
) {
  const partes = parseBold(texto)
  const { indent = 0 } = opts
  const x = 56 + indent
  let primeira = true
  for (const p of partes) {
    doc.font(p.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor(INK_2)
    doc.text(p.texto, primeira ? x : undefined, primeira ? doc.y : undefined, {
      continued: !p.ultima,
      align: 'justify',
    })
    primeira = false
  }
  doc.moveDown(0.2)
}

function parseBold(
  texto: string
): { texto: string; bold: boolean; ultima: boolean }[] {
  const partes: { texto: string; bold: boolean; ultima: boolean }[] = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) {
      partes.push({ texto: texto.slice(last, m.index), bold: false, ultima: false })
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

function renderUpsellFooter(doc: PDFDoc) {
  const { width, height } = doc.page
  const y = height - 110

  doc
    .moveTo(56, y - 10)
    .lineTo(width - 56, y - 10)
    .strokeColor(LINE)
    .stroke()

  doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN)
  doc.text('Próximo passo natural', 56, y, { width: width - 112 })

  doc.font('Helvetica').fontSize(9.5).fillColor(INK_2)
  doc.text(
    'O Dossiê Bancário Completo (plano Prata) inclui o checklist personalizado de documentos com passo a passo de obtenção, a defesa técnica de crédito redigida em linguagem de comitê e o PDF consolidado com seus documentos anexados — pronto para entregar ao gerente. Confira o valor em /planos dentro da sua conta.',
    56,
    doc.y + 4,
    { width: width - 112, align: 'justify' }
  )

  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  doc.text(
    'AgroBridge · construído por quem viveu aprovações e recusas dentro do banco — 14 anos no SFN',
    56,
    height - 40,
    { width: width - 112, align: 'center' }
  )
}
