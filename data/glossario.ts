// Glossário técnico do crédito rural — 45 termos validados pelo fundador
// (14 anos no Sistema Financeiro Nacional gerindo carteira Agro). Não
// alterar definições sem revisão do especialista.

export type CategoriaGlossario =
  | 'ambiental'
  | 'credito'
  | 'documentos'
  | 'programas'
  | 'orgaos'

export interface TermoGlossario {
  sigla: string
  nome: string
  definicao: string
  categoria: CategoriaGlossario
}

export const CATEGORIA_LABEL: Record<CategoriaGlossario, string> = {
  ambiental: 'Ambiental',
  credito: 'Crédito',
  documentos: 'Documentos',
  programas: 'Programas',
  orgaos: 'Órgãos',
}

// Cores discretas por categoria — derivadas da paleta do site (.landing-root):
// verde · dourado · cinza-azulado · âmbar · azul institucional. Opacidade
// baixa pra ficar sutil sem competir com o accent verde principal.
export const CATEGORIA_COR: Record<CategoriaGlossario, string> = {
  ambiental: '#7eb89c', // verde-vegetação
  credito: '#c9a86a', // dourado (mesmo --gold do site)
  documentos: '#8593a8', // cinza-azulado (papel/doc)
  programas: '#c47a3f', // âmbar (programa/atenção)
  orgaos: '#6e8aa8', // azul institucional
}

export const GLOSSARIO: TermoGlossario[] = [
  // === AMBIENTAL & TERRITORIAL ===
  {
    sigla: 'CAR',
    categoria: 'ambiental',
    nome: 'Cadastro Ambiental Rural',
    definicao:
      'Registro eletrônico obrigatório de toda propriedade rural junto ao SICAR, com mapeamento de APP, Reserva Legal e áreas consolidadas. Sem CAR ativo, não há crédito rural.',
  },
  {
    sigla: 'CCIR',
    categoria: 'ambiental',
    nome: 'Certificado de Cadastro de Imóvel Rural',
    definicao:
      'Emitido pelo INCRA, comprova a regularidade cadastral do imóvel rural. Obrigatório para venda, hipoteca ou financiamento.',
  },
  {
    sigla: 'ITR',
    categoria: 'ambiental',
    nome: 'Imposto Territorial Rural',
    definicao:
      'Imposto federal anual sobre a propriedade rural. O DARF quitado é exigência presente em quase toda operação de crédito.',
  },
  {
    sigla: 'PRODES',
    categoria: 'ambiental',
    nome: 'Monitoramento do desmatamento',
    definicao:
      'Sistema do INPE que monitora o desmatamento na Amazônia Legal por satélite. Áreas com alerta PRODES recente bloqueiam crédito por norma do CMN.',
  },
  {
    sigla: 'PRAD',
    categoria: 'ambiental',
    nome: 'Plano de Recuperação de Áreas Degradadas',
    definicao:
      'Plano técnico exigido por órgão ambiental quando há dano ou supressão sem autorização. Detalha como recuperar a área (mudas, isolamento, manejo).',
  },
  {
    sigla: 'PRADA',
    categoria: 'ambiental',
    nome: 'Projeto de Recomposição (CAR/PRA)',
    definicao:
      'Projeto apresentado pelo produtor dentro do CAR, vinculado ao PRA, para regularizar passivos de Reserva Legal e APP. Fluxo: CAR → PRA → PRADA.',
  },
  {
    sigla: 'PRA',
    categoria: 'ambiental',
    nome: 'Programa de Regularização Ambiental',
    definicao:
      'Adesão estadual que permite ao produtor regularizar passivos de RL e APP via PRADA, sem autuação por infrações cometidas até 22/07/2008.',
  },
  {
    sigla: 'MAPBIOMAS',
    categoria: 'ambiental',
    nome: 'Mapeamento de cobertura da terra',
    definicao:
      'Plataforma colaborativa de mapeamento anual da cobertura e uso da terra no Brasil. Usada por bancos como segunda fonte de checagem ambiental.',
  },
  {
    sigla: 'MÓDULOS FISCAIS',
    categoria: 'ambiental',
    nome: 'Unidade agrária por município',
    definicao:
      'Unidade de medida agrária definida por município (varia de 5 a 110 hectares). Define se o produtor é pequeno, médio ou grande — chave para Pronaf e Pronamp.',
  },
  {
    sigla: 'APP',
    categoria: 'ambiental',
    nome: 'Área de Preservação Permanente',
    definicao:
      'Faixas protegidas pelo Código Florestal (margens de rio, topo de morro, nascente) onde a exploração econômica é restrita.',
  },
  {
    sigla: 'RL',
    categoria: 'ambiental',
    nome: 'Reserva Legal',
    definicao:
      'Percentual da propriedade que deve ser mantido com vegetação nativa: 20% a 80% conforme bioma e localização.',
  },
  {
    sigla: 'SICAR',
    categoria: 'ambiental',
    nome: 'Sistema Nacional do CAR',
    definicao:
      'Plataforma onde o CAR é registrado, analisado e validado pelos órgãos ambientais estaduais.',
  },
  {
    sigla: 'CNIR',
    categoria: 'ambiental',
    nome: 'Cadastro Nacional de Imóveis Rurais',
    definicao:
      'Base unificada que integra dados do INCRA e da Receita Federal sobre imóveis rurais.',
  },
  {
    sigla: 'ZARC',
    categoria: 'ambiental',
    nome: 'Zoneamento Agrícola de Risco Climático',
    definicao:
      'Define janelas de plantio por cultura, município e tipo de solo. Plantar fora do ZARC = sem Proagro/PSR e, em geral, sem crédito.',
  },
  {
    sigla: 'SIGEF',
    categoria: 'ambiental',
    nome: 'Sistema de Gestão Fundiária',
    definicao:
      'Plataforma do INCRA para certificação e cadastro de imóveis rurais georreferenciados, conforme Lei 10.267/01. Imóveis acima do limite legal só são certificados via SIGEF — exigência cada vez mais comum em operações de crédito de maior porte.',
  },
  {
    sigla: 'GEORREFERENCIAMENTO',
    categoria: 'ambiental',
    nome: 'Levantamento topográfico do imóvel rural',
    definicao:
      'Levantamento técnico da poligonal do imóvel feito por profissional habilitado no CREA, conforme Lei 10.267/01 e norma técnica do INCRA. Obrigatório para certificação no SIGEF e exigido em diversas linhas de crédito.',
  },

  // === CRÉDITO & FINANCIAMENTO ===
  {
    sigla: 'MCR',
    categoria: 'credito',
    nome: 'Manual de Crédito Rural',
    definicao:
      'Manual do Banco Central que consolida todas as regras do crédito rural: linhas, taxas, prazos, garantias, documentação e fiscalização.',
  },
  {
    sigla: 'PRONAF',
    categoria: 'credito',
    nome: 'Crédito para a agricultura familiar',
    definicao:
      'Programa Nacional de Fortalecimento da Agricultura Familiar. Linha subsidiada, exclusiva para quem possui CAF ativa.',
  },
  {
    sigla: 'PRONAMP',
    categoria: 'credito',
    nome: 'Crédito para o médio produtor',
    definicao:
      'Programa Nacional de Apoio ao Médio Produtor Rural. Linha intermediária entre Pronaf e demais produtores.',
  },
  {
    sigla: 'FCO',
    categoria: 'credito',
    nome: 'Fundo Constitucional do Centro-Oeste',
    definicao:
      'Funding oficial para crédito rural na região Centro-Oeste, operado principalmente pelo Banco do Brasil.',
  },
  {
    sigla: 'FNE',
    categoria: 'credito',
    nome: 'Fundo Constitucional do Nordeste',
    definicao:
      'Funding oficial para crédito rural no Nordeste, operado pelo Banco do Nordeste do Brasil.',
  },
  {
    sigla: 'FNO',
    categoria: 'credito',
    nome: 'Fundo Constitucional do Norte',
    definicao:
      'Funding oficial para crédito rural na região Norte, operado pelo Banco da Amazônia.',
  },
  {
    sigla: 'BNDES',
    categoria: 'credito',
    nome: 'Funding de longo prazo',
    definicao:
      'Banco Nacional de Desenvolvimento Econômico e Social. Funding de longo prazo para investimento (Moderfrota, Moderagro, Inovagro etc).',
  },
  {
    sigla: 'FINAME',
    categoria: 'credito',
    nome: 'Código FINAME (BNDES)',
    definicao:
      'Código do BNDES que identifica máquinas e equipamentos credenciados para financiamento. Sem código FINAME, o bem não é elegível em linhas como Moderfrota, Moderagro e Inovagro.',
  },
  {
    sigla: 'LCA',
    categoria: 'credito',
    nome: 'Letra de Crédito do Agronegócio',
    definicao:
      'Título lastreado em recebíveis do agro emitido por bancos. A exigibilidade da LCA também direciona recursos para crédito rural.',
  },
  {
    sigla: 'CRA',
    categoria: 'credito',
    nome: 'Certificado de Recebíveis do Agronegócio',
    definicao:
      'Título do mercado de capitais lastreado em direitos creditórios do agronegócio.',
  },
  {
    sigla: 'CDA/WA',
    categoria: 'credito',
    nome: 'CDA e Warrant Agropecuário',
    definicao:
      'Títulos emitidos por armazéns gerais que comprovam depósito de produto agropecuário e podem ser dados em garantia.',
  },
  {
    sigla: 'CPR',
    categoria: 'credito',
    nome: 'Cédula de Produto Rural',
    definicao:
      'Título de promessa de entrega futura de produto agropecuário. Pode ser financeira (CPR-F) ou de liquidação física.',
  },
  {
    sigla: 'MELP',
    categoria: 'credito',
    nome: 'Moeda Estrangeira de Longo Prazo',
    definicao:
      'Modalidade de crédito rural com funding em moeda estrangeira voltada a investimentos de longo prazo.',
  },
  {
    sigla: 'TAC',
    categoria: 'credito',
    nome: 'Tarifa de Abertura de Crédito',
    definicao:
      'Tarifa cobrada pela instituição financeira no início da operação de crédito, regulada pelo Bacen.',
  },
  {
    sigla: 'DERIVATIVOS',
    categoria: 'credito',
    nome: 'Hedge de preço e câmbio',
    definicao:
      'Instrumentos financeiros (futuros, opções, swap) usados como proteção de preço de commodities e câmbio. Cada vez mais exigidos como parte da estrutura do crédito.',
  },
  {
    sigla: 'PLANO SAFRA',
    categoria: 'credito',
    nome: 'Pacote anual de crédito rural',
    definicao:
      'Pacote anual do governo federal que define volume, taxas e condições do crédito rural para o ciclo agrícola (julho a junho).',
  },
  {
    sigla: 'VBC',
    categoria: 'credito',
    nome: 'Valor Básico de Custeio',
    definicao:
      'Tabela do MCR que limita o valor do financiamento por hectare e por cultura.',
  },

  // === DOCUMENTOS & CADASTROS ===
  {
    sigla: 'DAP',
    categoria: 'documentos',
    nome: 'Declaração de Aptidão ao Pronaf',
    definicao:
      'Documento que comprovava a condição de agricultor familiar — substituído pelo CAF a partir de 2023.',
  },
  {
    sigla: 'CAF',
    categoria: 'documentos',
    nome: 'Cadastro da Agricultura Familiar',
    definicao:
      'Sucessor do DAP. Cadastro Nacional da Agricultura Familiar — condição obrigatória para acessar o Pronaf.',
  },
  {
    sigla: 'DAI',
    categoria: 'documentos',
    nome: 'Despesas de Amparo à Instalação',
    definicao:
      'Despesas vinculadas à estruturação do crédito (laudos, georreferenciamento, custas cartoriais), que podem ser financiadas dentro da operação.',
  },
  {
    sigla: 'ATER',
    categoria: 'documentos',
    nome: 'Assistência Técnica e Extensão Rural',
    definicao:
      'Serviço de orientação técnica ao produtor. Em algumas linhas (Pronaf, Inovagro), o laudo do ATER é obrigatório.',
  },
  {
    sigla: 'GTA',
    categoria: 'documentos',
    nome: 'Guia de Trânsito Animal',
    definicao:
      'Documento sanitário obrigatório para movimentação de animais. Funciona como prova documental de rebanho.',
  },
  {
    sigla: 'CROQUI',
    categoria: 'documentos',
    nome: 'Croqui da Propriedade Rural',
    definicao:
      "Desenho esquemático da propriedade indicando áreas de cultivo, Reserva Legal, APP, benfeitorias, estradas e cursos d'água. Exigido pelo banco para visualização da operação e conferência cruzada com o CAR.",
  },

  // === PROGRAMAS & GARANTIAS ===
  {
    sigla: 'PROAGRO',
    categoria: 'programas',
    nome: 'Garantia da Atividade Agropecuária',
    definicao:
      'Programa de Garantia da Atividade Agropecuária. Cobre dívida do produtor em caso de perda por evento climático, desde que a lavoura esteja dentro do ZARC.',
  },
  {
    sigla: 'PSR',
    categoria: 'programas',
    nome: 'Subvenção ao Prêmio do Seguro Rural',
    definicao:
      'Programa que subsidia parte do prêmio do seguro rural privado, reduzindo o custo para o produtor.',
  },
  {
    sigla: 'SEAF',
    categoria: 'programas',
    nome: 'Seguro da Agricultura Familiar',
    definicao:
      'Versão do Proagro voltada às operações Pronaf, com cobertura ampliada e prêmio subsidiado.',
  },

  // === ÓRGÃOS & REGULAÇÃO ===
  {
    sigla: 'BACEN',
    categoria: 'orgaos',
    nome: 'Banco Central do Brasil',
    definicao:
      'Edita o Manual de Crédito Rural (MCR) e regulamenta operacionalmente o crédito rural no Brasil.',
  },
  {
    sigla: 'CMN',
    categoria: 'orgaos',
    nome: 'Conselho Monetário Nacional',
    definicao:
      'Órgão deliberativo máximo do Sistema Financeiro Nacional. Aprova as resoluções que entram no MCR.',
  },
  {
    sigla: 'INCRA',
    categoria: 'orgaos',
    nome: 'Reforma agrária e cadastro rural',
    definicao:
      'Mantém o cadastro rural (CCIR) e responde pela regularização fundiária e reforma agrária.',
  },
  {
    sigla: 'IBAMA',
    categoria: 'orgaos',
    nome: 'Fiscalização ambiental federal',
    definicao:
      'Instituto Brasileiro do Meio Ambiente. Embargo do Ibama bloqueia o crédito rural.',
  },
  {
    sigla: 'MAPA',
    categoria: 'orgaos',
    nome: 'Ministério da Agricultura',
    definicao:
      'Ministério da Agricultura, Pecuária e Abastecimento. Define políticas agrícolas e operacionaliza o Plano Safra junto com o Bacen.',
  },
]
