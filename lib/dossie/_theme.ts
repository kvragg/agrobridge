/**
 * Tokens de estilo dos PDFs AgroBridge — light premium com DNA do site.
 *
 * Light em vez de dark por 2 razões práticas:
 * 1. Produtor imprime e leva pro banco — preto no creme lê muito melhor.
 * 2. Docs oficiais (CAR, CCIR, matrícula) são todos light — consistência visual
 *    que comunica seriedade.
 *
 * Três accents por tier (interno → comercial):
 *   diagnostico → Bronze (muted/neutro)
 *   dossie      → Prata  (verde)
 *   mentoria    → Ouro   (dourado)
 */

export type TierPdf = 'diagnostico' | 'dossie' | 'mentoria'

export const COLOR = {
  bg: '#f7f5f0',
  bgSoft: '#fafaf7',
  bgCard: '#ffffff',
  ink: '#0a0a0a',
  ink2: '#2a2a2a',
  ink3: '#4a4a4a',
  muted: '#6b6b64',
  line: '#d6d1c3',
  lineSoft: '#e8e4d8',

  green: '#2f7a5c',
  greenSoft: '#5cbd95',
  greenInk: '#0f3d2e',

  gold: '#a8893f',
  goldSoft: '#c9a86a',
  goldInk: '#5a4622',

  bronze: '#6b6b64',
  bronzeSoft: '#8f8a7f',

  success: '#2f7a5c',
  warning: '#c47a3f',
  danger: '#b84a3a',
} as const

export const FONT = {
  /** Display — títulos de capa, números grandes. Times dá ar de documento oficial. */
  display: 'Times-Bold',
  displayItalic: 'Times-Italic',

  /** Sans principal pro corpo. */
  sans: 'Helvetica',
  sansBold: 'Helvetica-Bold',
  sansItalic: 'Helvetica-Oblique',

  /** Mono pra eyebrows uppercase — replica o "mono" do site. */
  mono: 'Courier-Bold',
} as const

export const SIZE = {
  eyebrow: 8.5,
  body: 10.5,
  bodyLg: 11.5,
  h3: 12,
  h2: 15,
  h1: 22,
  display: 36,
  displayXl: 48,
  micro: 8,
} as const

export const SPACE = {
  margin: 54,
  marginLg: 64,
  gutter: 20,
  section: 22,
} as const

export interface TierTheme {
  tier: TierPdf
  nome: string
  nomeComercial: 'Bronze' | 'Prata' | 'Ouro'
  accent: string
  accentSoft: string
  accentInk: string
  /** Preço formatado como exibido na UI — mantido sync com PlanosClient. */
  preco: string
  /** Tagline curta pra capa. */
  tagline: string
  /** Subtítulo do produto no rodapé do footer de cada página. */
  nomeProduto: string
  /** Eyebrow do cabeçalho de cada página (uppercase, mono). */
  eyebrowHeader: string
}

export const TIER_THEMES: Record<TierPdf, TierTheme> = {
  diagnostico: {
    tier: 'diagnostico',
    nome: 'Diagnóstico Rápido',
    nomeComercial: 'Bronze',
    accent: COLOR.bronze,
    accentSoft: COLOR.bronzeSoft,
    accentInk: COLOR.ink,
    preco: 'R$ 79,99',
    tagline: 'Pra chegar na agência sabendo exatamente o que falar.',
    nomeProduto: 'Diagnóstico Rápido · Parecer de viabilidade',
    eyebrowHeader: 'AGROBRIDGE · DIAGNÓSTICO',
  },
  dossie: {
    tier: 'dossie',
    nome: 'Dossiê Bancário Completo',
    nomeComercial: 'Prata',
    accent: COLOR.green,
    accentSoft: COLOR.greenSoft,
    accentInk: COLOR.greenInk,
    preco: 'R$ 397,00',
    tagline: 'O pedido pronto pra entregar ao comitê de crédito.',
    nomeProduto: 'Dossiê Bancário · Laudo de crédito rural',
    eyebrowHeader: 'AGROBRIDGE · DOSSIÊ BANCÁRIO',
  },
  mentoria: {
    tier: 'mentoria',
    nome: 'Assessoria Premium 1:1',
    nomeComercial: 'Ouro',
    accent: COLOR.gold,
    accentSoft: COLOR.goldSoft,
    accentInk: COLOR.goldInk,
    preco: 'R$ 1.497,00',
    tagline: 'Acompanhamento pessoal direto com o fundador.',
    nomeProduto: 'Assessoria Premium · Parecer estratégico',
    eyebrowHeader: 'AGROBRIDGE · ASSESSORIA PREMIUM',
  },
}

export function dataHojeExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function brl(v: number | null | undefined): string {
  if (v == null) return 'não informado'
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
