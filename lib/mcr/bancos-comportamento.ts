// Base de conhecimento MCR — comportamento tipico de instituicoes financeiras.
//
// IMPORTANTE: CLAUDE.md proibe CITAR marcas bancarias na UI/copy/PDFs/emails
// ao usuario final. A estrutura abaixo mantem as marcas como KEY INTERNA
// (para matching) mas o CAMPO `perfil_generico` e o que a IA pode citar
// ao lead — sempre em linguagem genérica ("banco alvo", "cooperativa alvo").
//
// Ou seja: match interno por nome -> texto publico generico. Nunca
// vaze a key/marca para resposta gerada ao usuario.
//
// TODO: Paulo confirmar — comportamentos reais (14 anos dentro de banco
// dao uma autoridade que nenhum de nos pode improvisar). Estes sao
// aproximacoes de mercado aberto.

export type TipoInstituicao = 'banco_publico' | 'banco_privado' | 'cooperativa' | 'banco_regional'

export interface ComportamentoInstituicao {
  id: string // chave interna; nunca exibir
  tipo: TipoInstituicao
  // Texto generico que pode ser exibido ao lead (sem citar marca).
  perfil_generico: string
  // Documentos extras tipicos alem do checklist padrao.
  documentos_extras: readonly string[]
  // Pontos de atencao para a defesa tecnica do dossie.
  pontos_atencao: readonly string[]
  aprox: boolean
}

// TODO: Paulo confirmar cada comportamento abaixo.
const COMPORTAMENTOS: readonly ComportamentoInstituicao[] = [
  {
    id: 'bb',
    tipo: 'banco_publico',
    perfil_generico:
      'Banco publico com forte atuacao em credito rural oficial. Pedidos acima de R$ 500 mil tipicamente exigem projeto tecnico com ART de engenheiro agronomo registrado no CREA.',
    documentos_extras: ['Projeto tecnico com ART', 'Declaracao de aptidao ao Pronaf/Pronamp (quando aplicavel)'],
    pontos_atencao: [
      'Analise de risco pelo comite regional pode levar 15-45 dias.',
      'Garantia real hipotecaria e preferida sobre aval/fianca.',
    ],
    aprox: true,
  },
  {
    id: 'caixa',
    tipo: 'banco_publico',
    perfil_generico:
      'Banco publico com operacao de credito rural presente em municipios menores. Costuma pedir relatorio fotografico da propriedade.',
    documentos_extras: ['Relatorio fotografico com data', 'Comprovante de georreferenciamento (CAR)'],
    pontos_atencao: ['Analise pode ser centralizada e mais lenta em operacoes acima de R$ 1 milhao.'],
    aprox: true,
  },
  {
    id: 'banco_regional_ne',
    tipo: 'banco_regional',
    perfil_generico:
      'Banco regional de desenvolvimento no Nordeste. Opera FNE Rural. Analise de projeto tecnico rigorosa.',
    documentos_extras: ['Projeto tecnico completo (financeiro + agronomico)', 'Viabilidade economica projetada 5-8 anos'],
    pontos_atencao: ['Exige demonstracao de capacidade de pagamento via fluxo de caixa projetado.'],
    aprox: true,
  },
  {
    id: 'banco_regional_n',
    tipo: 'banco_regional',
    perfil_generico:
      'Banco regional de desenvolvimento na Amazonia. Opera FNO. Forte atencao a conformidade ambiental.',
    documentos_extras: [
      'Licenca ambiental valida',
      'CAR sem sobreposicao ou embargo',
      'Certificado de regularidade ambiental',
    ],
    pontos_atencao: ['Checagem automatizada de embargos IBAMA/ICMBio. Pendencias bloqueiam analise.'],
    aprox: true,
  },
  {
    id: 'banco_privado',
    tipo: 'banco_privado',
    perfil_generico:
      'Banco privado com linha rural. Privilegia relacionamento e reciprocidade (conta corrente, investimentos, seguros). Taxa acima da media oficial.',
    documentos_extras: ['Balanco patrimonial (quando PJ)', 'Relacionamento bancario comprovado'],
    pontos_atencao: ['Analise mais rapida (10-20 dias) porem seletiva. Exige reciprocidade.'],
    aprox: true,
  },
  {
    id: 'cooperativa',
    tipo: 'cooperativa',
    perfil_generico:
      'Cooperativa de credito. Tipicamente exige vinculo associativo ativo e deposito na cota-capital. Analise mais flexivel mas depende de regiao.',
    documentos_extras: ['Comprovante de associacao vigente', 'Integralizacao de cota-capital'],
    pontos_atencao: [
      'Nivel de autonomia da singular varia — operacoes grandes podem subir para a central.',
      'Relacionamento com cooperativa (movimentacao) pesa forte na analise.',
    ],
    aprox: true,
  },
]

// Entrada publica: retorna a variante genericizada (sem key/marca).
// Usada pela IA para compor a mini-analise.
export function comportamentoGenericoParaMiniAnalise(params: {
  banco_alvo_livre: string | null
}): ComportamentoInstituicao | null {
  const alvo = (params.banco_alvo_livre ?? '').toLowerCase().trim()
  if (!alvo) return null

  // Heuristica simples de match. Nao vaze `id` nem texto com marca.
  const map: Array<[RegExp, string]> = [
    [/\b(bb|banco do brasil|brasil)\b/, 'bb'],
    [/\bcaixa\b/, 'caixa'],
    [/\b(bnb|nordeste|bnb)\b/, 'banco_regional_ne'],
    [/\b(basa|amazonia)\b/, 'banco_regional_n'],
    [/\b(itau|itau|bradesco|santander|safra|abc)\b/, 'banco_privado'],
    [/\b(sicredi|sicoob|cresol|coop|unicred|credicoamo|coopavel|cooperativa)\b/, 'cooperativa'],
  ]
  for (const [rx, id] of map) {
    if (rx.test(alvo)) {
      const c = COMPORTAMENTOS.find((c) => c.id === id)
      if (c) return c
    }
  }
  return null
}

export function tipoGenericoInstituicao(id: TipoInstituicao): string {
  switch (id) {
    case 'banco_publico':
      return 'banco publico'
    case 'banco_privado':
      return 'banco privado'
    case 'banco_regional':
      return 'banco regional de desenvolvimento'
    case 'cooperativa':
      return 'cooperativa de credito'
  }
}
