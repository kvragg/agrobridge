/**
 * PDF Ouro · Mesa de Crédito (Mentoria)
 *
 * Topo de funil. Documento que sai do plano Ouro — entregue após revisão
 * cirúrgica do fundador. Layout estende o Prata com:
 * - Capa selada (banda ouro + selo "MESA DE CRÉDITO")
 * - Análise de gargalos ocultos (seção exclusiva)
 * - Parecer estratégico do fundador (callout assinado)
 * - Roteiro de comitê (script de defesa oral)
 * - Sem upsell — é topo de funil
 *
 * Compromisso: nunca cita marca de banco/cooperativa específica.
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
} from './_primitives'
import {
  boolToStatus,
  carSituacaoParaTexto,
  faixaParaTexto,
  regimeParaTexto,
} from './_domain'

export interface MentoriaInput {
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
  /**
   * Observações estratégicas do fundador adicionadas durante a mentoria.
   * Markdown opcional — quando presente, gera seção dedicada com calout
   * assinado.
   */
  observacoesFundadorMd?: string
  /**
   * Número da vaga (1-6 do mês corrente). Se ausente, omite na capa.
   */
  numeroVaga?: number | null
}

export async function montarMentoriaPDF(input: MentoriaInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const theme = TIER_THEMES.mentoria
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
          Title: `Mesa de Crédito — ${input.produtor.nome}`,
          Author: 'AgroBridge',
          Subject: 'Mentoria · Parecer estratégico de crédito rural',
          Creator: 'AgroBridge · Ouro',
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

      // ── Capa selada ─────────────────────────────────────────────────
      renderCapaSelada(doc, input)

      // ── Sumário executivo ───────────────────────────────────────────
      doc.addPage()
      renderSecaoTitulo(doc, 'I', 'Sumário executivo')
      renderSumarioExecutivo(doc, input)

      // ── Identificação e propriedade (compactos) ─────────────────────
      renderSecaoTitulo(doc, 'II', 'Identificação do produtor')
      renderPerfilProdutor(doc, input)

      renderSecaoTitulo(doc, 'III', 'Propriedade rural')
      renderPropriedade(doc, input)

      // ── Status documental ───────────────────────────────────────────
      renderSecaoTitulo(doc, 'IV', 'Status documental')
      renderStatusDocumental(doc, input)

      // ── Defesa técnica ──────────────────────────────────────────────
      doc.addPage()
      renderSecaoTitulo(doc, 'V', 'Defesa técnica de crédito')
      renderMarkdown(doc, input.laudoMd, TIER_THEMES.mentoria)

      // ── Análise de gargalos ocultos (exclusiva Ouro) ────────────────
      doc.addPage()
      renderSecaoTitulo(doc, 'VI', 'Gargalos ocultos identificados')
      renderGargalosOcultos(doc, input)

      // ── Parecer estratégico do fundador (exclusiva Ouro) ────────────
      if (input.observacoesFundadorMd) {
        doc.addPage()
        renderSecaoTitulo(doc, 'VII', 'Parecer estratégico do fundador')
        renderParecerFundador(doc, input.observacoesFundadorMd)
      }

      // ── Roteiro de comitê (exclusiva Ouro) ──────────────────────────
      doc.addPage()
      renderSecaoTitulo(
        doc,
        input.observacoesFundadorMd ? 'VIII' : 'VII',
        'Roteiro de defesa em comitê',
      )
      renderRoteiroComite(doc, input)

      // ── Selo final ──────────────────────────────────────────────────
      renderSeloFinal(doc, input)

      finalizePageChrome(doc, ctx)
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

type PDFDoc = InstanceType<typeof PDFDocument>

// ── Capa selada ──────────────────────────────────────────────────────────
// Banda ouro lateral espessa + título "Mesa de Crédito" + selo de vaga +
// identificação do produtor em card. Sensação de exclusividade premium.

function renderCapaSelada(doc: PDFDoc, input: MentoriaInput): void {
  const theme = TIER_THEMES.mentoria
  const { width, height } = doc.page

  // Banda ouro espessa à esquerda — assinatura visual exclusiva
  doc.rect(0, 0, 12, height).fill(theme.accent)
  // Banda mais fina ao lado, soft
  doc.rect(12, 0, 2, height).fill(theme.accentSoft)

  // Eyebrow no topo
  doc.y = 64
  renderEyebrow(doc, 'AgroBridge · Mesa de Crédito', {
    color: theme.accent,
    x: SPACE.margin,
  })

  doc.moveDown(0.4)
  doc
    .font(FONT.sans)
    .fontSize(SIZE.eyebrow)
    .fillColor(COLOR.muted)
    .text(`Emitido em ${dataHojeExtenso()}`, SPACE.margin, doc.y, {
      lineBreak: false,
    })

  // Título display — "Parecer estratégico" em duas linhas
  doc.y = 200
  doc
    .font(FONT.display)
    .fontSize(48)
    .fillColor(theme.accentInk)
    .text('Parecer', SPACE.margin, doc.y, {
      width: width - SPACE.margin * 2,
      lineGap: -6,
    })
  doc
    .font(FONT.display)
    .fontSize(48)
    .fillColor(COLOR.ink)
    .text('estratégico de crédito.', SPACE.margin, doc.y, {
      width: width - SPACE.margin * 2,
    })

  // Subtítulo
  doc.moveDown(0.3)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.bodyLg)
    .fillColor(COLOR.muted)
    .text(
      'Revisão cirúrgica conduzida pelo fundador. Documento exclusivo do plano Ouro.',
      SPACE.margin,
      doc.y,
      { width: width - SPACE.margin * 2 },
    )

  // Selo de vaga, se houver
  if (input.numeroVaga) {
    doc.moveDown(1.5)
    const seloX = SPACE.margin
    const seloY = doc.y
    const seloW = 200
    const seloH = 56
    doc
      .rect(seloX, seloY, seloW, seloH)
      .lineWidth(1)
      .strokeColor(theme.accent)
      .stroke()
    doc
      .font(FONT.mono)
      .fontSize(7.5)
      .fillColor(theme.accent)
      .text('VAGA OURO', seloX + 14, seloY + 10, {
        characterSpacing: 1.6,
        lineBreak: false,
      })
    doc
      .font(FONT.display)
      .fontSize(22)
      .fillColor(COLOR.ink)
      .text(
        `Nº ${String(input.numeroVaga).padStart(2, '0')}/06`,
        seloX + 14,
        seloY + 24,
        { lineBreak: false },
      )
    doc.y = seloY + seloH + 16
  }

  // Bloco de identificação
  doc.y = 480
  const perfil = input.perfil.perfil ?? {}
  const propriedade = input.perfil.propriedade ?? ({} as Record<string, unknown>)

  renderFilledCard(
    doc,
    150,
    ({ x, width: w }) => {
      doc.x = x
      doc
        .font(FONT.mono)
        .fontSize(7.5)
        .fillColor(theme.accent)
        .text('PRODUTOR ATENDIDO', x, doc.y, {
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
        .text(
          `${perfil.municipio || 'município'} / ${perfil.estado || 'UF'} · ` +
          `${perfil.atividade_principal || 'atividade não informada'}`,
          x,
          doc.y,
        )
      doc.text(
        `Operação pretendida: ${brl(input.valor)}`,
        x,
        doc.y,
      )
    },
    {
      bg: COLOR.bgCard,
      borderColor: theme.accent,
      accentLeft: theme.accent,
      padding: 22,
    },
  )

  // Rodapé da capa
  doc.y = height - 120
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
      'AgroBridge — Mesa de Crédito · revisão cirúrgica conduzida pelo fundador. ' +
      '14 anos no Sistema Financeiro Nacional gerindo carteira Agro em banco privado.',
      SPACE.margin,
      doc.y,
      { width: doc.page.width - SPACE.margin * 2 },
    )
}

// ── Cabeçalho de seção ───────────────────────────────────────────────────

function renderSecaoTitulo(doc: PDFDoc, num: string, titulo: string): void {
  const theme = TIER_THEMES.mentoria

  if (doc.page.height - doc.y < 120) doc.addPage()
  doc.moveDown(0.5)

  doc
    .font(FONT.mono)
    .fontSize(SIZE.eyebrow)
    .fillColor(theme.accent)
    .text(`SEÇÃO ${num.toUpperCase()}`, SPACE.margin, doc.y, {
      characterSpacing: 1.6,
      lineBreak: false,
    })
  doc.moveDown(0.3)

  doc
    .font(FONT.sansBold)
    .fontSize(SIZE.h1)
    .fillColor(COLOR.ink)
    .text(titulo, SPACE.margin, doc.y)

  doc
    .moveTo(SPACE.margin, doc.y + 4)
    .lineTo(SPACE.margin + 56, doc.y + 4)
    .lineWidth(2)
    .strokeColor(theme.accent)
    .stroke()

  doc.moveDown(0.9)
}

// ── Sumário executivo (similar Prata, accent ouro) ───────────────────────

function renderSumarioExecutivo(doc: PDFDoc, input: MentoriaInput): void {
  const perfil = input.perfil

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
          `${perfil.propriedade?.area_hectares ?? '—'} ha em ` +
          `${perfil.perfil?.municipio ?? '—'}/${perfil.perfil?.estado ?? '—'}, ` +
          `dedicada a ${perfil.perfil?.atividade_principal ?? '—'}. ` +
          `Este parecer reflete a análise estratégica conduzida na mentoria, ` +
          `incluindo gargalos ocultos e roteiro de defesa.`,
          x,
          doc.y,
          { width, align: 'justify' },
        )
    },
    { accent: TIER_THEMES.mentoria.accent },
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

  doc.y = badgeY + 30
  doc.moveDown(0.4)
}

function renderPerfilProdutor(doc: PDFDoc, input: MentoriaInput): void {
  const perfil = input.perfil.perfil
  const financeiro = input.perfil.financeiro

  renderKeyValueList(doc, [
    { label: 'Nome', value: perfil.nome || '—', strong: true },
    { label: 'CPF', value: perfil.cpf || '—' },
    {
      label: 'Tipo',
      value: perfil.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
    },
    {
      label: 'Localização',
      value: `${perfil.municipio || '—'} · ${perfil.estado || '—'}`,
    },
    { label: 'Atividade', value: perfil.atividade_principal || '—' },
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

function renderPropriedade(doc: PDFDoc, input: MentoriaInput): void {
  const propriedade = input.perfil.propriedade

  renderKeyValueList(doc, [
    {
      label: 'Regime',
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
      label: 'Garantia disponível',
      value: propriedade?.disponivel_como_garantia
        ? 'Sim'
        : propriedade?.impedimento_garantia || 'Não',
    },
    {
      label: 'Matrícula',
      value:
        propriedade?.matricula_disponivel === true
          ? propriedade?.matricula_em_nome_proprio === true
            ? 'Em nome próprio'
            : 'Em nome de terceiro'
          : 'Não disponível',
    },
    { label: 'CAR', value: carSituacaoParaTexto(propriedade?.car_situacao) },
  ])
  doc.moveDown(0.4)
}

function renderStatusDocumental(doc: PDFDoc, input: MentoriaInput): void {
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
    { accent: TIER_THEMES.mentoria.accent, zebra: true },
  )
}

// ── Gargalos ocultos (exclusiva Ouro) ────────────────────────────────────
// Análise sistemática dos pontos que o comitê pesquisa mas raramente comenta.

function renderGargalosOcultos(doc: PDFDoc, input: MentoriaInput): void {
  const gargalos = identificarGargalos(input.perfil)

  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.body)
    .fillColor(COLOR.muted)
    .text(
      'O comitê do credor avalia além do que está no formulário. Esta seção ' +
      'antecipa pontos que historicamente derrubam pedidos sem que o produtor ' +
      'saiba que foram avaliados.',
      SPACE.margin,
      doc.y,
      {
        width: doc.page.width - SPACE.margin * 2,
        align: 'justify',
      },
    )
  doc.moveDown(0.6)

  for (const g of gargalos) {
    renderAccentBlock(
      doc,
      ({ x, width }) => {
        doc.x = x
        doc
          .font(FONT.mono)
          .fontSize(SIZE.eyebrow)
          .fillColor(g.severidade === 'alta' ? COLOR.danger : g.severidade === 'media' ? COLOR.warning : COLOR.muted)
          .text(`SEVERIDADE ${g.severidade.toUpperCase()}`, x, doc.y, {
            characterSpacing: 1.4,
            lineBreak: false,
          })
        doc.moveDown(0.3)
        doc
          .font(FONT.sansBold)
          .fontSize(SIZE.h3)
          .fillColor(COLOR.ink)
          .text(g.titulo, x, doc.y, { width })
        doc.moveDown(0.2)
        doc
          .font(FONT.sans)
          .fontSize(SIZE.body)
          .fillColor(COLOR.ink2)
          .text(g.descricao, x, doc.y, { width, align: 'justify' })
        doc.moveDown(0.3)
        doc
          .font(FONT.sansBold)
          .fontSize(SIZE.body)
          .fillColor(COLOR.ink)
          .text('Mitigação recomendada: ', x, doc.y, { continued: true })
        doc
          .font(FONT.sans)
          .fontSize(SIZE.body)
          .fillColor(COLOR.ink2)
          .text(g.mitigacao, { width: width - 4 })
      },
      {
        accent:
          g.severidade === 'alta'
            ? COLOR.danger
            : g.severidade === 'media'
            ? COLOR.warning
            : TIER_THEMES.mentoria.accent,
      },
    )
    doc.moveDown(0.5)
  }
}

interface Gargalo {
  titulo: string
  descricao: string
  mitigacao: string
  severidade: 'alta' | 'media' | 'baixa'
}

function identificarGargalos(perfil: PerfilEntrevista): Gargalo[] {
  const out: Gargalo[] = []

  // SCR — sempre presente, comitê SEMPRE puxa
  out.push({
    titulo: 'Extrato SCR não anexado preventivamente',
    descricao:
      'O comitê de crédito sempre puxa o registrato no Sistema de Informações ' +
      'de Crédito (SCR/Bacen) antes de decidir. Quando o produtor não anexa o ' +
      'extrato proativamente, qualquer surpresa nele (operação esquecida, ' +
      'rolagem, classificação degradada) gera desconfiança e atrasa a análise.',
    mitigacao:
      'Emitir o registrato gratuitamente em registrato.bcb.gov.br antes do ' +
      'protocolo, anexar ao dossiê com nota explicativa de cada operação ativa.',
    severidade: 'alta',
  })

  // Mídia / imagem
  out.push({
    titulo: 'Pesquisa de mídia e imagem do proponente',
    descricao:
      'Bancos privados e cooperativas de porte médio fazem busca aberta no ' +
      'nome do proponente — Google, redes sociais, processos públicos. ' +
      'Resultados negativos (mesmo arquivados ou sem condenação) podem ' +
      'derrubar a operação no comitê de risco reputacional.',
    mitigacao:
      'Auditar a presença online antes do pedido. Se houver matérias ' +
      'antigas negativas, preparar nota explicativa anexa ao dossiê com ' +
      'contexto e desfecho.',
    severidade: 'media',
  })

  // PEP
  out.push({
    titulo: 'Verificação de Pessoa Politicamente Exposta (PEP)',
    descricao:
      'Cargos políticos próprios ou em parentesco até 2º grau acionam ' +
      'protocolos adicionais (KYC reforçado, prazo dilatado, comitê especial). ' +
      'Não é impeditivo, mas pega de surpresa quem não declara.',
    mitigacao:
      'Declarar PEP no formulário cadastral logo no início. Aceitar prazo ' +
      'maior. Levar documentação completa de origem dos recursos.',
    severidade: 'baixa',
  })

  // Endividamento
  if (perfil.financeiro?.credito_rural_ativo) {
    out.push({
      titulo: 'Crédito rural ativo coexistindo com nova operação',
      descricao:
        'Carregar saldo devedor rural enquanto pede nova operação acende ' +
        'alerta de "concentração de risco safra". O comitê analisa se a ' +
        'nova operação amortiza ou empilha.',
      mitigacao:
        `Demonstrar capacidade de pagamento separada por operação. ` +
        `Saldo devedor declarado: ${brl(perfil.financeiro.saldo_devedor_rural)}. ` +
        `Anexar comprovante de adimplência das parcelas vigentes.`,
      severidade: perfil.financeiro.parcelas_em_atraso ? 'alta' : 'media',
    })
  }

  // Garantia
  if (perfil.propriedade?.matricula_em_nome_proprio === false) {
    out.push({
      titulo: 'Matrícula em nome de terceiro',
      descricao:
        'Imóvel em nome de terceiro (cônjuge, sócio, herdeiro, holding) ' +
        'não pode ser ofertado direto como garantia hipotecária. Exige ' +
        'anuência do titular + análise jurídica de regime de bens.',
      mitigacao:
        'Levar termo de anuência do titular junto da matrícula. Em casos ' +
        'de comunhão, certidão de casamento. Em holding, contrato social ' +
        'consolidado e ata de assembleia autorizando.',
      severidade: 'alta',
    })
  }

  // Pendências judiciais
  if (perfil.pendencias?.judicial?.tem_pendencia) {
    out.push({
      titulo: 'Pendência judicial declarada',
      descricao: perfil.pendencias.judicial.descricao || 'Detalhes não informados.',
      mitigacao:
        'Anexar certidão de objeto e pé atualizada da ação. Se for valor ' +
        'menor que 10% do patrimônio declarado, geralmente não é impeditivo.',
      severidade: 'media',
    })
  }

  return out
}

// ── Parecer estratégico do fundador ──────────────────────────────────────

function renderParecerFundador(doc: PDFDoc, observacoesMd: string): void {
  const theme = TIER_THEMES.mentoria

  renderAccentBlock(
    doc,
    ({ x, width }) => {
      doc.x = x
      doc
        .font(FONT.mono)
        .fontSize(SIZE.eyebrow)
        .fillColor(theme.accent)
        .text('OBSERVAÇÕES DO FUNDADOR', x, doc.y, {
          characterSpacing: 1.6,
          lineBreak: false,
        })
      doc.moveDown(0.5)
    },
    { accent: theme.accent, accentWidth: 3 },
  )

  doc.moveDown(0.4)
  renderMarkdown(doc, observacoesMd, theme)

  doc.moveDown(0.6)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.body - 0.5)
    .fillColor(COLOR.muted)
    .text(
      '— Paulo Costa, fundador AgroBridge · 14 anos no Sistema Financeiro Nacional',
      SPACE.margin,
      doc.y,
      {
        width: doc.page.width - SPACE.margin * 2,
        align: 'right',
      },
    )
}

// ── Roteiro de defesa em comitê ──────────────────────────────────────────
// Script prático: o que dizer, na ordem, em cada momento da análise.

function renderRoteiroComite(doc: PDFDoc, input: MentoriaInput): void {
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.body)
    .fillColor(COLOR.muted)
    .text(
      'Quando o gerente leva o pedido pra mesa, a defesa oral conta tanto quanto ' +
      'o dossiê. Este roteiro estrutura o que dizer — na ordem em que o comitê ' +
      'pergunta — pra deixar a operação pronta pra aprovação.',
      SPACE.margin,
      doc.y,
      {
        width: doc.page.width - SPACE.margin * 2,
        align: 'justify',
      },
    )
  doc.moveDown(0.6)

  const etapas = [
    {
      titulo: '1. Abertura — quem é o produtor (30s)',
      script:
        `${input.produtor.nome}, produtor em ${input.perfil.perfil?.municipio ?? '—'}/${input.perfil.perfil?.estado ?? '—'}, ` +
        `${input.perfil.perfil?.tempo_atividade_anos ?? '—'} anos na atividade ` +
        `de ${input.perfil.perfil?.atividade_principal ?? '—'}. ` +
        `Operação em ${regimeParaTexto(input.perfil.propriedade?.regime)} ` +
        `de ${input.perfil.propriedade?.area_hectares ?? '—'} ha.`,
    },
    {
      titulo: '2. Capacidade de pagamento (60s)',
      script:
        `Faturamento médio ${
          input.perfil.financeiro?.faturamento_medio_anual
            ? brl(input.perfil.financeiro.faturamento_medio_anual)
            : faixaParaTexto(input.perfil.financeiro?.faixa_faturamento)
        }/ano. ` +
        `Histórico bancário ${
          input.perfil.financeiro?.parcelas_em_atraso ? 'com pendências (já reestruturadas)' : 'limpo'
        }. ` +
        `Operação pretendida ${brl(input.valor)} representa ` +
        `${
          input.valor && input.perfil.financeiro?.faturamento_medio_anual
            ? Math.round((input.valor / input.perfil.financeiro.faturamento_medio_anual) * 100)
            : '—'
        }% do faturamento anual — patamar confortável.`,
    },
    {
      titulo: '3. Garantia (30s)',
      script:
        `${
          input.perfil.propriedade?.disponivel_como_garantia
            ? `Imóvel disponível para hipoteca, matrícula ${
                input.perfil.propriedade?.matricula_em_nome_proprio ? 'em nome próprio' : 'com anuência do titular'
              }. CAR ${input.perfil.propriedade?.car_situacao === 'ativo' ? 'ativo, regular' : 'em regularização'}.`
            : 'Garantia complementar ofertada (cédula de produto rural, aval, alienação fiduciária de máquinas).'
        }`,
    },
    {
      titulo: '4. Tratamento de pontos sensíveis (90s)',
      script:
        'Antecipar com transparência: SCR anexo, eventuais pendências menores ' +
        'declaradas, plano de mitigação claro. Comitê valoriza candura — ' +
        'surpresa derruba operação.',
    },
    {
      titulo: '5. Encerramento — pedido de decisão (15s)',
      script:
        'Reforçar prazo desejado, disponibilidade pra responder exigência ' +
        'imediata e proximidade da janela operacional (plantio, safra, etc).',
    },
  ]

  for (const etapa of etapas) {
    doc
      .font(FONT.sansBold)
      .fontSize(SIZE.h3)
      .fillColor(TIER_THEMES.mentoria.accentInk)
      .text(etapa.titulo, SPACE.margin, doc.y)
    doc.moveDown(0.2)
    doc
      .font(FONT.sansItalic)
      .fontSize(SIZE.body)
      .fillColor(COLOR.ink2)
      .text(etapa.script, SPACE.margin + 8, doc.y, {
        width: doc.page.width - SPACE.margin * 2 - 8,
        align: 'justify',
      })
    doc.moveDown(0.6)
  }
}

// ── Selo final ───────────────────────────────────────────────────────────

function renderSeloFinal(doc: PDFDoc, input: MentoriaInput): void {
  doc.moveDown(1.5)
  if (doc.page.height - doc.y < 100) doc.addPage()

  const theme = TIER_THEMES.mentoria
  const { width } = doc.page
  const startY = doc.y

  doc
    .moveTo(SPACE.margin, startY)
    .lineTo(width - SPACE.margin, startY)
    .lineWidth(0.8)
    .strokeColor(theme.accent)
    .stroke()

  doc.y = startY + 12
  doc
    .font(FONT.mono)
    .fontSize(SIZE.eyebrow)
    .fillColor(theme.accent)
    .text('PARECER ENCERRADO · MESA DE CRÉDITO', SPACE.margin, doc.y, {
      characterSpacing: 1.6,
      lineBreak: false,
    })
  doc.moveDown(0.4)
  doc
    .font(FONT.sansItalic)
    .fontSize(SIZE.body - 0.5)
    .fillColor(COLOR.muted)
    .text(
      `Documento exclusivo do plano Ouro emitido em ${dataHojeExtenso()}. ` +
      `Processo nº ${input.processoId.slice(0, 8).toUpperCase()}.`,
      SPACE.margin,
      doc.y,
      { width: width - SPACE.margin * 2 },
    )
}

