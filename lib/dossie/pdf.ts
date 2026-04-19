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
  defesaMd: string
  checklistMd: string
  documentos: { nome: string; tamanho: number; enviado: boolean }[]
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
          Subject: 'Dossiê técnico de crédito rural',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // ── Capa ────────────────────────────────────────────────────────
      renderCapa(doc, input)

      // ── Sumário ────────────────────────────────────────────────────
      doc.addPage()
      renderSumario(doc)

      // ── Perfil ─────────────────────────────────────────────────────
      doc.addPage()
      renderPerfil(doc, input)

      // ── Defesa técnica ────────────────────────────────────────────
      doc.addPage()
      renderDefesa(doc, input.defesaMd)

      // ── Checklist ──────────────────────────────────────────────────
      doc.addPage()
      renderChecklist(doc, input.checklistMd)

      // ── Documentos ─────────────────────────────────────────────────
      doc.addPage()
      renderDocumentos(doc, input.documentos)

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

// ─── Renderers ──────────────────────────────────────────────────────

type PDFDoc = InstanceType<typeof PDFDocument>

function renderCapa(doc: PDFDoc, input: DossieInput) {
  const { width, height } = doc.page

  doc.rect(0, 0, width, height).fill('#f7f5f0')
  doc.fillColor(INK)

  doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN).text('AGROBRIDGE', 56, 56, {
    characterSpacing: 2,
  })
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Dossiê técnico de crédito rural', 56, 72)

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
    `Banco: ${input.banco || 'a definir'}`,
    `Tipo de crédito: ${input.perfil.necessidade_credito.tipo}`,
  ]
  for (const l of linhas) {
    doc.text(l, 56, doc.y + 4)
  }

  // rodapé
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
  doc.text(`Emitido em ${dataHoje()}`, 56, height - 96)
  doc.text(`ID do processo: ${input.processoId}`, 56, height - 80)
  doc.text('AgroBridge · despachante técnico digital', 56, height - 64)
}

function renderSumario(doc: PDFDoc) {
  cabecalho(doc, 'Sumário')
  doc.moveDown(1)
  doc.font('Helvetica').fontSize(12).fillColor(INK_2)
  const itens = [
    '01  Perfil do proponente',
    '02  Defesa técnica (parecer pró-aprovação)',
    '03  Checklist personalizado de documentos',
    '04  Documentos anexados',
  ]
  for (const i of itens) {
    doc.text(i, { indent: 0 })
    doc.moveDown(0.4)
  }
}

function renderPerfil(doc: PDFDoc, input: DossieInput) {
  cabecalho(doc, '01 · Perfil do proponente')
  const p = input.perfil
  const kv: [string, string][] = [
    ['Nome', p.perfil.nome],
    ['CPF', p.perfil.cpf || 'não informado'],
    ['Tipo', p.perfil.tipo_pessoa],
    ['Localização', `${p.perfil.municipio || '—'} / ${p.perfil.estado || '—'}`],
    ['Atividade principal', p.perfil.atividade_principal || 'não informado'],
    ['Tempo de atividade', `${p.perfil.tempo_atividade_anos ?? '—'} anos`],
    ['Regime', p.propriedade.regime],
    ['Área (ha)', String(p.propriedade.area_hectares ?? '—')],
    ['Matrícula disponível', p.propriedade.matricula_disponivel ? 'sim' : 'não / não informado'],
    ['Situação CAR', p.propriedade.car_situacao],
    ['Faturamento médio anual', brl(p.financeiro.faturamento_medio_anual)],
    ['Faixa', p.financeiro.faixa_faturamento],
    ['Parcelas em atraso', p.financeiro.parcelas_em_atraso ? 'sim' : 'não'],
    ['Saldo devedor rural', brl(p.financeiro.saldo_devedor_rural)],
    ['Valor pretendido', brl(p.necessidade_credito.valor)],
    ['Finalidade', p.necessidade_credito.finalidade || 'não informado'],
    ['Tipo de crédito', p.necessidade_credito.tipo],
    ['Banco preferido', p.necessidade_credito.banco_preferido || 'não informado'],
  ]

  doc.moveDown(0.6)
  for (const [k, v] of kv) {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(k, 56, y, { width: 160 })
    doc.font('Helvetica').fontSize(10).fillColor(INK_2).text(v, 220, y, { width: 320 })
    doc.moveDown(0.5)
  }

  if (p.alertas && p.alertas.length > 0) {
    doc.moveDown(1)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#b24a3a').text('Alertas identificados')
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(10).fillColor(INK_2)
    for (const a of p.alertas) {
      doc.text(`• ${a.replace(/_/g, ' ').toLowerCase()}`)
    }
  }
}

function renderDefesa(doc: PDFDoc, defesa: string) {
  cabecalho(doc, '02 · Defesa técnica')
  doc.moveDown(0.6)
  doc.font('Helvetica').fontSize(11).fillColor(INK_2)
  for (const linha of defesa.split('\n')) {
    const l = linha.trim()
    if (!l) {
      doc.moveDown(0.6)
      continue
    }
    // Títulos em CAIXA ALTA
    if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s·\-]{4,}$/.test(l) && l === l.toUpperCase()) {
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(l)
      doc.font('Helvetica').fontSize(11).fillColor(INK_2)
      continue
    }
    if (l.startsWith('- ') || l.startsWith('• ')) {
      doc.text(`• ${l.replace(/^[-•]\s+/, '')}`, { indent: 12 })
      continue
    }
    doc.text(l, { align: 'justify' })
    doc.moveDown(0.3)
  }
}

function renderChecklist(doc: PDFDoc, checklistMd: string) {
  cabecalho(doc, '03 · Checklist personalizado')
  doc.moveDown(0.6)
  doc.font('Helvetica').fontSize(10).fillColor(INK_2)

  for (const linha of checklistMd.split('\n')) {
    const l = linha.trim()
    if (!l) {
      doc.moveDown(0.3)
      continue
    }
    if (l.startsWith('### ')) {
      doc.moveDown(0.6)
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(l.replace(/^###\s+/, ''))
      doc.font('Helvetica').fontSize(10).fillColor(INK_2)
      continue
    }
    if (l.startsWith('## ')) {
      doc.moveDown(0.4)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GREEN).text(l.replace(/^##\s+/, ''))
      doc.font('Helvetica').fontSize(10).fillColor(INK_2)
      continue
    }
    if (l.startsWith('**') && l.endsWith('**')) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(l.replace(/^\*\*|\*\*$/g, ''))
      doc.font('Helvetica').fontSize(10).fillColor(INK_2)
      continue
    }
    if (l === '---') {
      doc.moveDown(0.3)
      doc.moveTo(56, doc.y).lineTo(540, doc.y).strokeColor(LINE).stroke()
      doc.moveDown(0.3)
      continue
    }
    // Remove decorações de link/emoji inline para não poluir PDF
    const limpa = l.replace(/🔗|✅|📋|📄|🔎|⚠️/g, '').trim()
    doc.text(limpa, { align: 'left' })
    doc.moveDown(0.2)
  }
}

function renderDocumentos(doc: PDFDoc, docs: DossieInput['documentos']) {
  cabecalho(doc, '04 · Documentos anexados')
  doc.moveDown(0.6)
  if (docs.length === 0) {
    doc.font('Helvetica').fontSize(11).fillColor(MUTED).text(
      'Nenhum documento anexado até o momento.'
    )
    return
  }
  doc.font('Helvetica').fontSize(10).fillColor(INK_2)
  docs.forEach((d, i) => {
    const y = doc.y
    let tam = '—'
    if (d.tamanho) {
      tam =
        d.tamanho > 1024 * 1024
          ? `${(d.tamanho / 1024 / 1024).toFixed(1)} MB`
          : `${(d.tamanho / 1024).toFixed(0)} KB`
    }
    doc
      .font('Helvetica-Bold')
      .text(`${(i + 1).toString().padStart(2, '0')}. ${d.nome}`, 56, y, { width: 400 })
    doc.font('Helvetica').fillColor(MUTED).text(tam, 460, y, { width: 80, align: 'right' })
    doc.fillColor(INK_2)
    doc.moveDown(0.35)
  })
}

function cabecalho(doc: PDFDoc, titulo: string) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GREEN).text('AGROBRIDGE · DOSSIÊ', 56, 40, {
    characterSpacing: 2,
  })
  doc.moveTo(56, 60).lineTo(540, 60).strokeColor(LINE).stroke()
  doc.moveDown(1.4)
  doc.font('Helvetica-Bold').fontSize(22).fillColor(INK).text(titulo, 56)
}
