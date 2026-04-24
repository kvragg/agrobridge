/**
 * Helpers de domínio compartilhados pelos templates PDF.
 *
 * Ficaram fora do _theme.ts (visual) e _primitives.ts (render) porque
 * traduzem campos do PerfilEntrevista pra texto humano legível em PT-BR.
 * Usados pelo pdf.ts (Prata) e pdf-mentoria.ts (Ouro).
 */

export function boolToStatus(v: boolean | null | undefined): string {
  if (v === true) return 'Em dia'
  if (v === false) return 'Pendente'
  return 'Não informado'
}

export function regimeParaTexto(r: string | null | undefined): string {
  switch (r) {
    case 'propria':
      return 'Propriedade própria'
    case 'arrendada':
      return 'Arrendamento'
    case 'parceria':
      return 'Parceria agrícola'
    default:
      return 'Não informado'
  }
}

export function carSituacaoParaTexto(s: string | null | undefined): string {
  switch (s) {
    case 'ativo':
      return 'Ativo e regular'
    case 'pendente':
      return 'Cadastrado com pendência'
    case 'nao_feito':
      return 'Não cadastrado'
    default:
      return 'Não informado'
  }
}

export function faixaParaTexto(f: string | null | undefined): string {
  switch (f) {
    case 'abaixo_500k':
      return 'Abaixo de R$ 500 mil/ano'
    case '500k_1M':
      return 'R$ 500 mil – R$ 1 milhão/ano'
    case '1M_5M':
      return 'R$ 1 milhão – R$ 5 milhões/ano'
    case 'acima_5M':
      return 'Acima de R$ 5 milhões/ano'
    default:
      return 'Faixa não informada'
  }
}
