/**
 * PDF Bronze · Diagnóstico Rápido — Parecer de Viabilidade
 *
 * Tier mais leve. Sem capa cheia, vai direto ao parecer. O design é
 * intencionalmente sóbrio (accent muted/neutro) — o salto visual pro
 * verde do Prata e ouro do Ouro é parte do funil de upsell.
 *
 * Layout (1-2 páginas):
 * 1. Header premium (eyebrow + título display + key-value do produtor)
 * 2. Corpo markdown (## h2 com fio accent · render rico)
 * 3. Footer de upsell pro Prata
 */

import PDFDocument from 'pdfkit'
import type { PerfilEntrevista } from '@/types/entrevista'
import {
  COLOR,
  FONT,
  SIZE,
  SPACE,
  TIER_THEMES,
  dataHojeExtenso,
} from './_theme'
import {
  finalizePageChrome,
  renderEyebrow,
  renderKeyValueList,
  renderMarkdown,
  renderUpsellFooter,
} from './_primitives'

export interface ViabilidadeInput {
  produtor: {
    nome: string
    cpf: string
    email?: string | null
  }
  processoId: string
  perfil: PerfilEntrevista
  parecerMd: string
}

export async function montarViabilidadePDF(
  input: ViabilidadeInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const theme = TIER_THEMES.diagnostico
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: SPACE.margin, right: SPACE.margin },
        bufferPages: true, // necessário pro chrome cross-page
        info: {
          Title: `Parecer de viabilidade — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Diagnóstico Rápido · Viabilidade de crédito rural',
          Creator: 'AgroBridge · Bronze',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const ctx = {
        theme,
        produtor: { nome: input.produtor.nome, cpf: input.produtor.cpf },
        processoId: input.processoId,
      }

      renderHeader(doc, input)
      renderMarkdown(doc, input.parecerMd, theme)

      // Reserva espaço pro upsell — força quebra se faltar < 170pt
      if (doc.page.height - doc.y < 170) doc.addPage()
      renderUpsellFooter(doc, {
        eyebrow: 'Próximo passo natural · Prata',
        titulo: 'Dossiê Bancário Completo — pronto pra mesa do comitê',
        corpo:
          'Inclui tudo do diagnóstico, mais o checklist documental personalizado, ' +
          'a defesa técnica de crédito redigida em linguagem de comitê, o roteiro ' +
          'de visita técnica do analista e o PDF consolidado com seus documentos ' +
          'anexados na ordem que o banco lê. Confira em /planos dentro da sua conta.',
        accent: TIER_THEMES.dossie.accent,
      })

      finalizePageChrome(doc, ctx)
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

type PDFDoc = InstanceType<typeof PDFDocument>

function renderHeader(doc: PDFDoc, input: ViabilidadeInput): void {
  const theme = TIER_THEMES.diagnostico
  const { width } = doc.page

  // Eyebrow inicial — repete a info do header pra reforçar identidade
  doc.y = 64
  renderEyebrow(doc, `Parecer · ${dataHojeExtenso()}`, {
    color: theme.accent,
    size: 8.5,
  })

  // Título display em serif — peso documental
  doc.moveDown(0.6)
  doc
    .font(FONT.display)
    .fontSize(28)
    .fillColor(COLOR.ink)
    .text('Parecer de viabilidade de crédito rural', SPACE.margin, doc.y, {
      width: width - SPACE.margin * 2,
      lineGap: -2,
    })

  // Subtítulo — leitura preliminar
  doc.moveDown(0.3)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.bodyLg)
    .fillColor(COLOR.muted)
    .text(
      'Leitura preliminar baseada nos dados autodeclarados na entrevista. ' +
      'Sujeita a análise final do comitê do credor.',
      SPACE.margin,
      doc.y,
      {
        width: width - SPACE.margin * 2,
      },
    )

  doc.moveDown(0.8)

  // Linha de identificação — dados do produtor em key-value compacto
  const perfil = input.perfil.perfil ?? {}
  const livre = input.perfil as unknown as Record<string, unknown>
  const operacao = livre.operacao as
    | { fazenda_nome?: string; area_ha?: number; cultura_principal?: string }
    | undefined
  const credito = livre.credito as
    | { finalidade?: string; valor_pretendido?: number }
    | undefined

  renderKeyValueList(doc, [
    { label: 'Produtor', value: input.produtor.nome, strong: true },
    {
      label: 'Localização',
      value: `${perfil.municipio || 'município não informado'} / ${
        perfil.estado || '—'
      }`,
    },
    ...(operacao?.fazenda_nome
      ? [{ label: 'Propriedade', value: operacao.fazenda_nome }]
      : []),
    ...(operacao?.area_ha
      ? [
          {
            label: 'Área',
            value: `${operacao.area_ha.toLocaleString('pt-BR')} ha · ${
              operacao.cultura_principal ?? 'atividade não informada'
            }`,
          },
        ]
      : []),
    ...(credito?.valor_pretendido
      ? [
          {
            label: 'Operação pretendida',
            value: `${credito.finalidade ?? 'crédito rural'} · R$ ${credito.valor_pretendido.toLocaleString(
              'pt-BR',
            )}`,
          },
        ]
      : []),
  ])

  doc.moveDown(0.5)

  // Divisor accent fino antes do parecer
  doc
    .moveTo(SPACE.margin, doc.y)
    .lineTo(SPACE.margin + 36, doc.y)
    .lineWidth(2)
    .strokeColor(theme.accent)
    .stroke()

  doc.moveDown(0.8)
}
