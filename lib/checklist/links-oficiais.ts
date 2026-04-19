export interface LinkOficial {
  label: string
  url: string
  aviso?: string
}

interface Regra {
  match: RegExp
  link: LinkOficial
}

const REGRAS: Regra[] = [
  {
    match: /\b(nirf|cafir)\b/i,
    link: {
      label: 'Emitir comprovante CAFIR (NIRF)',
      url: 'https://www.gov.br/pt-br/servicos/emitir-comprovante-de-inscricao-cafir',
    },
  },
  {
    match: /\bcar\b|cadastro ambiental rural/i,
    link: {
      label: 'Abrir portal do SICAR',
      url: 'https://www.car.gov.br/publico/imoveis/index',
    },
  },
  {
    match: /\bccir\b|certificado.*im[oó]vel rural/i,
    link: {
      label: 'Emitir CCIR no INCRA',
      url: 'https://certificacao.incra.gov.br/csv_ccir/manterCcir.action',
    },
  },
  {
    match: /\bitr\b|imposto territorial/i,
    link: {
      label: 'Consultar ITR na Receita',
      url: 'https://servicos.receita.fazenda.gov.br/servicos/itr/default.htm',
    },
  },
  {
    match: /cnd.*ibama|certid[aã]o.*d[eé]bitos ambientais/i,
    link: {
      label: 'Emitir CND do IBAMA',
      url: 'https://servicos.ibama.gov.br/ctf/publico/certidaoNegativa/',
    },
  },
  {
    match: /registrato/i,
    link: {
      label: 'Abrir Registrato no Bacen',
      url: 'https://www.bcb.gov.br/cedadoscidadao/registrato',
    },
  },
  {
    match: /\birpf\b|imposto de renda|declara[cç][aã]o.*renda/i,
    link: {
      label: 'Meu Imposto de Renda',
      url: 'https://www.gov.br/receitafederal/pt-br/servicos/meu-imposto-de-renda',
    },
  },
  {
    match: /cnd.*federal|d[eé]bitos.*uni[aã]o|receita federal.*certid[aã]o/i,
    link: {
      label: 'Emitir CND Federal (Receita)',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PF/Emitir',
    },
  },
  {
    match: /cnd.*fgts|fgts/i,
    link: {
      label: 'Emitir CRF do FGTS (Caixa)',
      url: 'https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf',
    },
  },
  {
    match: /cart[aã]o cnpj|cnpj.*receita/i,
    link: {
      label: 'Emitir Cartão CNPJ',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp',
    },
  },
  {
    match: /matr[ií]cula.*im[oó]vel/i,
    link: {
      label: 'Pedido online (ARISP / ONR)',
      url: 'https://www.registradores.onr.org.br/',
      aviso: 'Se o cartório não estiver integrado, vá presencialmente à comarca do imóvel.',
    },
  },
  {
    match: /certid[aã]o de casamento|registro civil/i,
    link: {
      label: 'Registro Civil online',
      url: 'https://www.registrocivil.org.br/',
    },
  },
  {
    match: /cnh|habilita[cç][aã]o/i,
    link: {
      label: 'Carteira Digital de Trânsito',
      url: 'https://portalservicos.senatran.serpro.gov.br/',
    },
  },
]

export function linkOficialPara(nomeDocumento: string): LinkOficial | null {
  for (const regra of REGRAS) {
    if (regra.match.test(nomeDocumento)) return regra.link
  }
  return null
}
