/**
 * PDF Prata · Dossiê Bancário Completo
 *
 * Documento principal do AgroBridge — PDF que o produtor leva pro banco.
 * Tier comercial Prata, accent verde. Layout estruturado em capa cheia +
 * seções (sumário, perfil, propriedade, status documental, defesa) +
 * upsell pro Ouro no final.
 *
 * Compromisso editorial:
 * - Nunca cita marca de banco/cooperativa específica (CLAUDE.md).
 * - Defesa técnica é o conteúdo principal — capa e cards são contexto.
 */

import PDFDocument from 'pdfkit'
import type { PerfilEntrevista } from '@/types/entrevista'
import {
  COLOR,
  FONT,
  SIZE,
  SPACE,
  TIER_THEMES,
  brl,
  dataHojeExtenso,
} from './_theme'
import {
  finalizePageChrome,
  renderAccentBlock,
  renderBadge,
  renderEyebrow,
  renderFilledCard,
  renderKeyValueList,
  renderMarkdown,
  renderTable,
  renderUpsellFooter,
} from './_primitives'
import {
  boolToStatus,
  carSituacaoParaTexto,
  faixaParaTexto,
  regimeParaTexto,
} from './_domain'

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
  laudoMd: string
}

export async function montarDossiePDF(input: DossieInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const theme = TIER_THEMES.dossie
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 60,
          bottom: 60,
          left: SPACE.margin,
          right: SPACE.margin,
        },
        bufferPages: true,
        info: {
          Title: `Dossiê de crédito rural — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Dossiê bancário · Laudo de avaliação de crédito rural',
          Creator: 'AgroBridge · Prata',
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

      // ── Capa ────────────────────────────────────────────────────────
      renderCapa(doc, input)

      // ── Sumário executivo ───────────────────────────────────────────
      doc.addPage()
      renderSecaoTitulo(doc, 'I', 'Sumário executivo')
      renderSumarioExecutivo(doc, input)

      // ── Perfil + Propriedade ────────────────────────────────────────
      renderSecaoTitulo(doc, 'II', 'Identificação do produtor')
      renderPerfilProdutor(doc, input)

      renderSecaoTitulo(doc, 'III', 'Propriedade rural')
      renderPropriedade(doc, input)

      // ── Status documental ───────────────────────────────────────────
      renderSecaoTitulo(doc, 'IV', 'Status documental')
      renderStatusDocumental(doc, input)

      // ── Defesa técnica (núcleo) ─────────────────────────────────────
      doc.addPage()
      renderSecaoTitulo(doc, 'V', 'Defesa técnica de crédito')
      renderMarkdown(doc, input.laudoMd, TIER_THEMES.dossie)

      // ── Upsell pro Ouro ─────────────────────────────────────────────
      if (doc.page.height - doc.y < 200) doc.addPage()
      renderUpsellFooter(doc, {
        eyebrow: 'Próximo passo · Ouro',
        titulo: 'Mesa de Crédito — revisão cirúrgica antes do comitê ver',
        corpo:
          'No plano Ouro, o fundador (14 anos no SFN gerindo carteira Agro) ' +
          'revisa pessoalmente este dossiê, identifica os gargalos ocultos que ' +
          'o comitê pesquisa mas raramente comenta — risco de imagem, PEP, ' +
          'mídia negativa, processos, embargos — e te entrega o pedido pronto ' +
          'pra entrar na mesa preparado. Vagas limitadas a 6 por mês.',
        accent: TIER_THEMES.mentoria.accent,
      })

      finalizePageChrome(doc, ctx)
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

type PDFDoc = InstanceType<typeof PDFDocument>

// ── Capa ──────────────────────────────────────────────────────────────────
// Capa cheia. Eyebrow + título display imenso + bloco de identificação +
// rodapé sutil. Banda accent vertical à esquerda como assinatura visual.

function renderCapa(doc: PDFDoc, input: DossieInput): void {
  const theme = TIER_THEMES.dossie
  const { width, height } = doc.page

  // Banda accent vertical à esquerda — assinatura visual da capa
  doc.rect(0, 0, 6, height).fill(theme.accent)

  // Eyebrow no topo
  doc.y = 64
  renderEyebrow(doc, 'AgroBridge · Dossiê Bancário', {
    color: theme.accent,
    x: SPACE.margin,
  })

  // Pós-eyebrow: data
  doc.moveDown(0.4)
  doc
    .font(FONT.sans)
    .fontSize(SIZE.eyebrow)
    .fillColor(COLOR.muted)
    .text(`Emitido em ${dataHojeExtenso()}`, SPACE.margin, doc.y, {
      lineBreak: false,
    })

  // Espaço grande antes do display
  doc.y = 200

  // Título display em duas linhas — verde escuro forte na primeira, ink na segunda
  doc
    .font(FONT.display)
    .fontSize(48)
    .fillColor(theme.accentInk)
    .text('Dossiê de crédito', SPACE.margin, doc.y, {
      width: width - SPACE.margin * 2,
      lineGap: -6,
    })
  doc
    .font(FONT.display)
    .fontSize(48)
    .fillColor(COLOR.ink)
    .text('rural', SPACE.margin, doc.y, {
      width: width - SPACE.margin * 2,
    })

  // Subtítulo
  doc.moveDown(0.3)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.bodyLg)
    .fillColor(COLOR.muted)
    .text(
      'Laudo técnico de avaliação para apresentação ao credor.',
      SPACE.margin,
      doc.y,
      { width: width - SPACE.margin * 2 },
    )

  // Bloco de identificação — card com fundo branco
  doc.y = 440
  const perfil = input.perfil.perfil ?? {}
  const propriedade = input.perfil.propriedade ?? ({} as Record<string, unknown>)
  const necessidade = input.perfil.necessidade_credito ?? ({} as Record<string, unknown>)

  renderFilledCard(
    doc,
    180,
    ({ x, width: w }) => {
      doc.x = x
      doc
        .font(FONT.mono)
        .fontSize(7.5)
        .fillColor(theme.accent)
        .text('IDENTIFICAÇÃO DO REQUERENTE', x, doc.y, {
          characterSpacing: 1.6,
          lineBreak: false,
        })
      doc.moveDown(0.6)
      doc
        .font(FONT.sansBold)
        .fontSize(18)
        .fillColor(COLOR.ink)
        .text(input.produtor.nome, x, doc.y, { width: w })
      doc.moveDown(0.3)
      doc
        .font(FONT.sans)
        .fontSize(SIZE.body)
        .fillColor(COLOR.ink2)
        .text(`CPF: ${input.produtor.cpf || 'não informado'}`, x, doc.y)
      doc.text(
        `${perfil.municipio || 'município não informado'} / ${perfil.estado || '—'}`,
        x,
        doc.y,
      )
      doc.text(
        `Atividade principal: ${perfil.atividade_principal || 'não informada'}`,
        x,
        doc.y,
      )
      doc.text(
        `Propriedade: ${
          propriedade.area_hectares
            ? `${propriedade.area_hectares.toLocaleString('pt-BR')} ha · ${propriedade.regime ?? 'regime não informado'}`
            : 'área não informada'
        }`,
        x,
        doc.y,
      )
      doc.text(
        `Operação pretendida: ${necessidade.tipo ?? 'crédito rural'} · ${brl(input.valor)}`,
        x,
        doc.y,
      )
    },
    {
      bg: COLOR.bgCard,
      borderColor: COLOR.line,
      accentLeft: theme.accent,
      padding: 22,
    },
  )

  // Rodapé da capa — número do processo + tagline
  doc.y = height - 100
  doc
    .font(FONT.mono)
    .fontSize(7)
    .fillColor(COLOR.muted)
    .text(
      `PROCESSO Nº ${input.processoId.slice(0, 8).toUpperCase()}`,
      SPACE.margin,
      doc.y,
      { characterSpacing: 1.4, lineBreak: false },
    )
  doc.moveDown(0.4)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.eyebrow)
    .fillColor(COLOR.muted)
    .text(
      'AgroBridge — consultoria especializada em crédito rural · construído por quem viveu aprovações e recusas dentro do banco',
      SPACE.margin,
      doc.y,
      { width: doc.page.width - SPACE.margin * 2 },
    )
}

// ── Cabeçalho de seção ───────────────────────────────────────────────────
// Numeração romana + título grande verde + fio accent.

function renderSecaoTitulo(doc: PDFDoc, num: string, titulo: string): void {
  const theme = TIER_THEMES.dossie

  if (doc.page.height - doc.y < 120) doc.addPage()
  doc.moveDown(0.5)

  // Número romano em mono
  doc
    .font(FONT.mono)
    .fontSize(SIZE.eyebrow)
    .fillColor(theme.accent)
    .text(`SEÇÃO ${num.toUpperCase()}`, SPACE.margin, doc.y, {
      characterSpacing: 1.6,
      lineBreak: false,
    })

  doc.moveDown(0.3)

  // Título grande
  doc
    .font(FONT.sansBold)
    .fontSize(SIZE.h1)
    .fillColor(COLOR.ink)
    .text(titulo, SPACE.margin, doc.y)

  // Fio accent fino
  doc
    .moveTo(SPACE.margin, doc.y + 4)
    .lineTo(SPACE.margin + 56, doc.y + 4)
    .lineWidth(2)
    .strokeColor(theme.accent)
    .stroke()

  doc.moveDown(0.9)
}

// ── Sumário executivo ────────────────────────────────────────────────────

function renderSumarioExecutivo(doc: PDFDoc, input: DossieInput): void {
  const perfil = input.perfil
  const completude = avaliarCompletudePerfil(perfil)

  renderAccentBlock(
    doc,
    ({ x, width }) => {
      doc.x = x
      doc
        .font(FONT.sans)
        .fontSize(SIZE.bodyLg)
        .fillColor(COLOR.ink2)
        .text(
          `Operação de ${perfil.necessidade_credito?.tipo ?? 'crédito rural'} ` +
          `no valor pretendido de ${brl(input.valor)}, ` +
          `lastreada em propriedade ${perfil.propriedade?.regime ?? '—'} de ` +
          `${perfil.propriedade?.area_hectares ?? '—'} ha em ${perfil.perfil?.municipio ?? '—'}/${perfil.perfil?.estado ?? '—'}, ` +
          `dedicada a ${perfil.perfil?.atividade_principal ?? '—'}.`,
          x,
          doc.y,
          { width, align: 'justify' },
        )
    },
    { accent: TIER_THEMES.dossie.accent },
  )

  doc.moveDown(0.6)

  // Status pills inline
  doc
    .font(FONT.mono)
    .fontSize(SIZE.eyebrow)
    .fillColor(COLOR.muted)
    .text('STATUS GERAL', SPACE.margin, doc.y, {
      characterSpacing: 1.4,
      lineBreak: false,
    })
  doc.moveDown(0.4)

  // 3 badges: CAR · CCIR · CNDs
  const badgeY = doc.y
  let badgeX = SPACE.margin
  const renderInlineBadge = (label: string, ok: boolean) => {
    renderBadge(doc, label, ok ? 'success' : 'warning', { x: badgeX, y: badgeY })
    badgeX += doc.widthOfString(label.toUpperCase(), { characterSpacing: 1.2 }) + 18
  }
  renderInlineBadge(
    `CAR ${perfil.propriedade?.car_situacao === 'ativo' ? 'OK' : 'PENDENTE'}`,
    perfil.propriedade?.car_situacao === 'ativo',
  )
  renderInlineBadge(
    `CCIR ${perfil.propriedade?.ccir_em_dia ? 'OK' : 'PENDENTE'}`,
    perfil.propriedade?.ccir_em_dia === true,
  )
  renderInlineBadge(
    `ITR ${perfil.propriedade?.itr_em_dia ? 'OK' : 'PENDENTE'}`,
    perfil.propriedade?.itr_em_dia === true,
  )

  doc.y = badgeY + 26
  doc.moveDown(0.6)

  // Pontos fortes / atenção
  if (completude.fortes.length > 0) {
    doc
      .font(FONT.sansBold)
      .fontSize(SIZE.body)
      .fillColor(COLOR.success)
      .text('Pontos fortes para o comitê:', SPACE.margin, doc.y)
    doc.moveDown(0.2)
    for (const f of completude.fortes) {
      doc
        .font(FONT.sans)
        .fontSize(SIZE.body)
        .fillColor(COLOR.ink2)
        .text(`✓  ${f}`, SPACE.margin + 6, doc.y, {
          width: doc.page.width - SPACE.margin * 2 - 6,
        })
      doc.moveDown(0.1)
    }
    doc.moveDown(0.4)
  }

  if (completude.atencao.length > 0) {
    doc
      .font(FONT.sansBold)
      .fontSize(SIZE.body)
      .fillColor(COLOR.warning)
      .text('Pontos de atenção:', SPACE.margin, doc.y)
    doc.moveDown(0.2)
    for (const a of completude.atencao) {
      doc
        .font(FONT.sans)
        .fontSize(SIZE.body)
        .fillColor(COLOR.ink2)
        .text(`!   ${a}`, SPACE.margin + 6, doc.y, {
          width: doc.page.width - SPACE.margin * 2 - 6,
        })
      doc.moveDown(0.1)
    }
  }

  doc.moveDown(0.4)
}

// ── Perfil do produtor ────────────────────────────────────────────────────

function renderPerfilProdutor(doc: PDFDoc, input: DossieInput): void {
  const perfil = input.perfil.perfil
  const financeiro = input.perfil.financeiro

  renderKeyValueList(doc, [
    { label: 'Nome', value: perfil.nome || '—', strong: true },
    { label: 'CPF', value: perfil.cpf || '—' },
    { label: 'Tipo', value: perfil.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física' },
    { label: 'Estado / Município', value: `${perfil.estado || '—'} · ${perfil.municipio || '—'}` },
    { label: 'Atividade principal', value: perfil.atividade_principal || '—' },
    {
      label: 'Atividades secundárias',
      value: perfil.atividades_secundarias?.join(', ') || '—',
    },
    {
      label: 'Tempo na atividade',
      value: perfil.tempo_atividade_anos
        ? `${perfil.tempo_atividade_anos} anos`
        : '—',
    },
    {
      label: 'Faturamento anual',
      value: financeiro?.faturamento_medio_anual
        ? brl(financeiro.faturamento_medio_anual)
        : faixaParaTexto(financeiro?.faixa_faturamento),
    },
  ])
  doc.moveDown(0.4)
}

// ── Propriedade rural ─────────────────────────────────────────────────────

function renderPropriedade(doc: PDFDoc, input: DossieInput): void {
  const propriedade = input.perfil.propriedade

  renderKeyValueList(doc, [
    {
      label: 'Regime de detenção',
      value: regimeParaTexto(propriedade?.regime),
      strong: true,
    },
    {
      label: 'Área',
      value: propriedade?.area_hectares
        ? `${propriedade.area_hectares.toLocaleString('pt-BR')} ha`
        : '—',
    },
    {
      label: 'Disponível como garantia',
      value: propriedade?.disponivel_como_garantia
        ? 'Sim'
        : propriedade?.impedimento_garantia || 'Não',
    },
    {
      label: 'Matrícula',
      value:
        propriedade?.matricula_disponivel === true
          ? propriedade?.matricula_em_nome_proprio === true
            ? 'Disponível em nome próprio'
            : 'Disponível em nome de terceiro'
          : 'Não disponível ou não informada',
    },
    {
      label: 'CAR',
      value: carSituacaoParaTexto(propriedade?.car_situacao),
    },
    {
      label: 'CCIR',
      value:
        propriedade?.ccir_em_dia === true
          ? 'Quitado e em dia'
          : propriedade?.ccir_em_dia === false
          ? 'Pendente'
          : 'Não informado',
    },
    {
      label: 'ITR',
      value:
        propriedade?.itr_em_dia === true
          ? 'Em dia'
          : propriedade?.itr_em_dia === false
          ? 'Pendente'
          : 'Não informado',
    },
  ])
  doc.moveDown(0.4)
}

// ── Status documental ─────────────────────────────────────────────────────
// Tabela com cada categoria + status. Visual estilo CCIR.

function renderStatusDocumental(doc: PDFDoc, input: DossieInput): void {
  const docPf = input.perfil.documentacao_pf
  const propriedade = input.perfil.propriedade

  const linhas: string[][] = [
    ['CAR (Cadastro Ambiental Rural)', boolToStatus(propriedade?.car_situacao === 'ativo')],
    ['CCIR (INCRA)', boolToStatus(propriedade?.ccir_em_dia)],
    ['ITR (Receita Federal)', boolToStatus(propriedade?.itr_em_dia)],
    ['CND Federal (RFB/PGFN)', boolToStatus(docPf?.cnd_federal)],
    ['CND Estadual', boolToStatus(docPf?.cnd_estadual)],
    ['CND Municipal', boolToStatus(docPf?.cnd_municipal)],
    [
      'Licença Ambiental / Dispensa',
      boolToStatus(docPf?.dispensa_ou_licenca_ambiental),
    ],
  ]

  if (input.perfil.perfil?.tipo_pessoa === 'PJ') {
    const docPj = input.perfil.documentacao_pj
    linhas.push(
      ['Contrato Social atualizado', boolToStatus(docPj?.contrato_social_atualizado)],
      ['Certidão Junta Comercial', boolToStatus(docPj?.certidao_simplificada_junta)],
      ['Faturamento 12 meses doc.', boolToStatus(docPj?.faturamento_12_meses_documentado)],
      ['Balanço / DRE', boolToStatus(docPj?.balanco_dre_disponivel)],
    )
  }

  renderTable(
    doc,
    [
      { header: 'Documento', widthPct: 70 },
      { header: 'Status', widthPct: 30, align: 'right' },
    ],
    linhas,
    { accent: TIER_THEMES.dossie.accent, zebra: true },
  )
}

// ── Helpers de domínio ────────────────────────────────────────────────────

function avaliarCompletudePerfil(perfil: PerfilEntrevista): {
  fortes: string[]
  atencao: string[]
} {
  const fortes: string[] = []
  const atencao: string[] = []

  if (perfil.propriedade?.regime === 'propria') fortes.push('Propriedade própria — base de garantia real disponível')
  if (perfil.propriedade?.car_situacao === 'ativo') fortes.push('CAR ativo e regular')
  if (perfil.propriedade?.ccir_em_dia) fortes.push('CCIR quitado dentro do exercício')
  if (perfil.propriedade?.itr_em_dia) fortes.push('ITR em dia (últimos exercícios)')
  if (perfil.documentacao_pf?.cnd_federal && perfil.documentacao_pf?.cnd_estadual)
    fortes.push('CNDs federal e estadual regulares')
  if (
    perfil.financeiro?.parcelas_em_atraso === false &&
    perfil.financeiro?.credito_rural_ativo === false
  )
    fortes.push('Histórico bancário limpo, sem inadimplência')
  if (
    perfil.perfil?.tempo_atividade_anos != null &&
    perfil.perfil.tempo_atividade_anos >= 5
  )
    fortes.push(`${perfil.perfil.tempo_atividade_anos} anos de atividade — tempo de mercado consolidado`)

  if (perfil.propriedade?.car_situacao === 'pendente')
    atencao.push('CAR pendente — pode acionar exigência do comitê')
  if (perfil.propriedade?.car_situacao === 'nao_feito')
    atencao.push('CAR não cadastrado — bloqueia operação até regularização')
  if (perfil.propriedade?.ccir_em_dia === false)
    atencao.push('CCIR sem quitação atualizada — invalida o certificado')
  if (perfil.financeiro?.parcelas_em_atraso)
    atencao.push('Parcelas em atraso ativas — comitê pesquisa via SCR/Bacen')
  if (perfil.pendencias?.sanitaria?.tem_pendencia)
    atencao.push(`Pendência sanitária: ${perfil.pendencias.sanitaria.descricao || 'descrição não informada'}`)
  if (perfil.pendencias?.ambiental?.tem_pendencia)
    atencao.push(`Pendência ambiental: ${perfil.pendencias.ambiental.descricao || 'descrição não informada'}`)
  if (perfil.pendencias?.judicial?.tem_pendencia)
    atencao.push(`Pendência judicial: ${perfil.pendencias.judicial.descricao || 'descrição não informada'}`)
  if (perfil.propriedade?.matricula_em_nome_proprio === false)
    atencao.push('Matrícula em nome de terceiro — limita uso como garantia direta')

  return { fortes, atencao }
}

