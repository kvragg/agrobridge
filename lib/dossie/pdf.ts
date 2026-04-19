import PDFDocument from 'pdfkit'
import type { PerfilEntrevista } from '@/types/entrevista'

const GREEN = '#0f3d2e'
const INK = '#0a0a0a'
const INK_2 = '#2a2a2a'
const MUTED = '#6b6b64'
const LINE = '#d6d1c3'

export interface DossieInput {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  banco: string | null
  valor: number | null
  perfil: PerfilEntrevista
  /** Markdown completo do laudo gerado pela Sonnet */
  laudoMd: string
}

function brl(v: number | null): string {
  if (v == null) return 'não informado'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function dataHoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function montarDossiePDF(input: DossieInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 56,
        info: {
          Title: `Dossiê de crédito rural — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Laudo de avaliação de crédito rural',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // ── Capa ────────────────────────────────────────────────────────
      renderCapa(doc, input)

      // ── Laudo (gerado pela IA) ──────────────────────────────────────
      doc.addPage()
      renderLaudo(doc, input.laudoMd)

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

type PDFDoc = InstanceType<typeof PDFDocument>

function renderCapa(doc: PDFDoc, input: DossieInput) {
  const { width, height } = doc.page

  doc.rect(0, 0, width, height).fill('#f7f5f0')
  doc.fillColor(INK)

  doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).text('AGROBRIDGE', 56, 56, {
    characterSpacing: 2,
  })
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text('Laudo de avaliação de crédito rural', 56, 72)

  doc.moveTo(56, 120).lineTo(width - 56, 120).strokeColor(LINE).stroke()

  doc.fillColor(INK).font('Helvetica-Bold').fontSize(32)
  doc.text('Dossiê de crédito', 56, 180, { width: width - 112 })
  doc.font('Helvetica').fontSize(32).fillColor(MUTED)
  doc.text('rural', 56, doc.y, { width: width - 112 })

  doc.moveDown(2)
  doc.font('Helvetica-Bold').fontSize(14).fillColor(INK)
  doc.text(input.produtor.nome, 56, doc.y)

  doc.font('Helvetica').fontSize(11).fillColor(INK_2)
  const linhas = [
    `CPF: ${input.produtor.cpf || 'não informado'}`,
    `Propriedade: ${input.perfil.propriedade.area_hectares ?? 'não informado'} ha · ${
      input.perfil.perfil.municipio || 'município não informado'
    } / ${input.perfil.perfil.estado || 'UF'}`,
    `Atividade: ${input.perfil.perfil.atividade_principal || 'não informado'}`,
    `Valor pretendido: ${brl(input.valor)}`,
    `Instituição: a definir (conforme perfil)`, // nunca cita marca de banco / cooperativa
    `Tipo de crédito: ${input.perfil.necessidade_credito.tipo}`,
  ]
  for (const l of linhas) {
    doc.text(l, 56, doc.y + 4)
  }

  // rodapé
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
  doc.text(`Emitido em ${dataHoje()}`, 56, height - 96)
  doc.text(`ID do processo: ${input.processoId}`, 56, height - 80)
  doc.text('AgroBridge · consultoria especializada em crédito rural', 56, height - 64)
}

// ── Renderizador de laudo em markdown ────────────────────────────────
// Suporta: ## (H2), ### (H3), #### (H4), **negrito inline**, listas com "- "/"• ",
// linhas divisórias "---" e parágrafos em itálico (*texto*).

function renderLaudo(doc: PDFDoc, laudoMd: string) {
  cabecalho(doc, 'Laudo de avaliação de crédito')
  doc.moveDown(0.6)
  doc.font('Helvetica').fontSize(11).fillColor(INK_2)

  const linhas = laudoMd.split('\n')
  for (const bruta of linhas) {
    const l = bruta.trimEnd()
    if (!l.trim()) {
      doc.moveDown(0.4)
      continue
    }
    if (l.startsWith('## ')) {
      doc.moveDown(0.8)
      doc.font('Helvetica-Bold').fontSize(16).fillColor(GREEN).text(l.slice(3).trim())
      doc.moveDown(0.2)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.startsWith('### ')) {
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(l.slice(4).trim())
      doc.moveDown(0.15)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.startsWith('#### ')) {
      doc.moveDown(0.3)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(l.slice(5).trim())
      doc.moveDown(0.1)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.trim() === '---') {
      doc.moveDown(0.3)
      doc
        .moveTo(56, doc.y)
        .lineTo(doc.page.width - 56, doc.y)
        .strokeColor(LINE)
        .stroke()
      doc.moveDown(0.3)
      continue
    }
    if (/^\s*[-•]\s+/.test(l)) {
      const texto = l.replace(/^\s*[-•]\s+/, '')
      renderParagrafoRico(doc, `• ${texto}`, { indent: 10 })
      continue
    }
    // Itálico de bloco (linha toda cercada por *...*)
    if (/^\*[^*].*\*$/.test(l.trim())) {
      const texto = l.trim().replace(/^\*|\*$/g, '')
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(MUTED).text(texto, {
        align: 'justify',
      })
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      doc.moveDown(0.3)
      continue
    }
    renderParagrafoRico(doc, l)
  }
}

function renderParagrafoRico(
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

function cabecalho(doc: PDFDoc, titulo: string) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(GREEN)
    .text('AGROBRIDGE · LAUDO', 56, 40, {
      characterSpacing: 2,
    })
  doc
    .moveTo(56, 60)
    .lineTo(doc.page.width - 56, 60)
    .strokeColor(LINE)
    .stroke()
  doc.moveDown(1.4)
  doc.font('Helvetica-Bold').fontSize(22).fillColor(INK).text(titulo, 56)
}
