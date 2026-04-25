// Checklist genérico de crédito rural — exibido em /checklist quando o
// usuário ainda não tem processo (não fez entrevista ou não pagou).
// Baseado nos documentos core do MCR. Cada item traz instrução e link
// pro portal/órgão correto pra emissão.
//
// Quando o lead conclui a entrevista E paga, /checklist/[id] mostra
// versão personalizada gerada pela IA com base no perfil dele
// (cultura, UF, modalidade, garantias, etc.).

export type CategoriaChecklist =
  | "identificacao"
  | "ambiental"
  | "fundiario"
  | "fiscal"
  | "produtivo"

export interface ItemChecklistPadrao {
  id: string
  nome: string
  sigla?: string
  categoria: CategoriaChecklist
  obrigatorio: boolean
  descricao: string
  /** Onde tirar — portal oficial. */
  origem: {
    orgao: string
    portal?: string
    url?: string
  }
  /** Passo-a-passo curto. Pode ter placeholder // TODO. */
  passos: string[]
  /** Aplicabilidade — a IA usa esses flags pra montar checklist personalizado. */
  aplica_se?: {
    pf?: boolean
    pj?: boolean
    pronaf?: boolean
    todos?: boolean
  }
}

export const CATEGORIA_CHECKLIST_LABEL: Record<CategoriaChecklist, string> = {
  identificacao: "Identificação",
  ambiental: "Regularidade ambiental",
  fundiario: "Documentação fundiária",
  fiscal: "Regularidade fiscal",
  produtivo: "Produção e renda",
}

export const CHECKLIST_PADRAO: ItemChecklistPadrao[] = [
  {
    id: "cpf_cnpj",
    nome: "CPF (PF) ou CNPJ + Contrato Social (PJ)",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Documento de identificação fiscal e, no caso de pessoa jurídica, o contrato social atualizado com a última alteração registrada na Junta Comercial.",
    origem: {
      orgao: "Receita Federal / Junta Comercial",
      portal: "Receita Federal",
      url: "https://www.gov.br/receitafederal/pt-br",
    },
    passos: [
      "Para CPF: tenha em mãos o documento físico ou digital (CIN/Carteira Digital).",
      "Para CNPJ: emita o cartão CNPJ atualizado em gov.br/receitafederal.",
      "Para PJ: anexe o contrato social com a última alteração registrada na Junta Comercial.",
      "Confira se a situação cadastral está ‘ativa’ — situação ‘suspensa’ ou ‘inapta’ trava o crédito.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "comprovante_residencia",
    nome: "Comprovante de residência",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Conta de luz, água, telefone fixo ou contrato de aluguel recente (até 90 dias) em nome do produtor ou cônjuge.",
    origem: {
      orgao: "Concessionárias de serviço público",
    },
    passos: [
      "Use a fatura mais recente (até 90 dias).",
      "Se a conta estiver em nome do cônjuge ou de parente direto, anexe também certidão de casamento ou comprovante de parentesco.",
      "Endereço do comprovante deve bater com o cadastro no banco — divergência atrasa.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "car",
    nome: "CAR — Cadastro Ambiental Rural",
    sigla: "CAR",
    categoria: "ambiental",
    obrigatorio: true,
    descricao:
      "Registro eletrônico obrigatório dos imóveis rurais junto ao Sistema Nacional de Cadastro Ambiental Rural. Sem CAR ativo, o crédito não sai — Lei 12.651/2012 (Código Florestal).",
    origem: {
      orgao: "MMA / SICAR",
      portal: "SICAR",
      url: "https://www.car.gov.br",
    },
    passos: [
      "Acesse car.gov.br e localize o imóvel pela inscrição estadual ou nome.",
      "Baixe o demonstrativo do CAR (PDF com mapa e área) — esse é o documento que o banco pede.",
      "Confira se o status está ‘Ativo’ ou ‘Pendente de análise’. Status ‘Cancelado’ ou ‘Suspenso’ trava o crédito.",
      "Se houver pendência ambiental (embargo, área degradada), regularize via PRA antes de protocolar — o comitê ambiental do banco vê.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "ccir",
    nome: "CCIR — Certificado de Cadastro de Imóvel Rural",
    sigla: "CCIR",
    categoria: "fundiario",
    obrigatorio: true,
    descricao:
      "Certificado emitido pelo INCRA que comprova o cadastro do imóvel rural. Atualizado anualmente, é exigência para qualquer transação envolvendo imóvel rural.",
    origem: {
      orgao: "INCRA",
      portal: "Sistema Nacional de Cadastro Rural",
      url: "https://sncr.serpro.gov.br/sncr-web/consultaPublica.jsf",
    },
    passos: [
      "Acesse sncr.serpro.gov.br e busque pelo CPF/CNPJ do proprietário ou pelo número do imóvel.",
      "Pague a Guia do ITR (já gerada com o CCIR vinculado) — sem ITR pago, o CCIR não vale.",
      "Baixe o CCIR do exercício atual em PDF.",
      "Se o imóvel for arrendado: o CCIR fica em nome do PROPRIETÁRIO, não do arrendatário — peça a cópia.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "itr",
    nome: "ITR — últimos 5 exercícios",
    sigla: "ITR",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "Comprovante de pagamento ou de declaração do Imposto Territorial Rural dos 5 últimos anos. ITR atrasado é regra dura — comitê de crédito não aprova.",
    origem: {
      orgao: "Receita Federal",
      portal: "e-CAC",
      url: "https://cav.receita.fazenda.gov.br/eCAC/publico/login.aspx",
    },
    passos: [
      "Entre no e-CAC com certificado digital ou conta gov.br nível prata/ouro.",
      "Vá em ‘Declarações e Demonstrativos’ → ‘ITR’.",
      "Baixe os DARFs pagos dos últimos 5 anos (ou as declarações com isenção, se imune).",
      "Imóvel em nome de outro (espólio, sociedade, arrendamento) — o ITR é do PROPRIETÁRIO. Peça a cópia.",
      "ITR em atraso? Quite na própria Receita antes de protocolar — não tem como contornar.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "matricula",
    nome: "Matrícula atualizada do imóvel",
    categoria: "fundiario",
    obrigatorio: true,
    descricao:
      "Certidão de matrícula emitida nos últimos 30 dias pelo Cartório de Registro de Imóveis competente. Mostra proprietário atual, ônus, hipotecas, restrições.",
    origem: {
      orgao: "Cartório de Registro de Imóveis",
      portal: "ONR (Operador Nacional do Registro Eletrônico)",
      url: "https://www.registradores.onr.org.br",
    },
    passos: [
      "Identifique o cartório competente — é o da circunscrição do imóvel (não da residência do produtor).",
      "Solicite via ONR (online, sai em até 5 dias úteis) ou direto no cartório.",
      "Peça especificamente ‘certidão de inteiro teor’ ou ‘atualizada com ônus’ — não só a simples.",
      "Imóvel sem matrícula individualizada (gleba bruta, sem desmembramento) ou em inventário: trava o crédito até regularizar.",
      "Validade: 30 dias. Se demorou, peça outra antes de protocolar.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "cnds",
    nome: "Certidões negativas — Receita Federal, INSS, Trabalhista",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "Trio que comprova regularidade fiscal e trabalhista. Qualquer pendência aqui é detectada na consulta SCR/Bacen e barra a operação.",
    origem: {
      orgao: "Receita Federal / TST",
    },
    passos: [
      "Receita Federal + INSS (uma certidão só): emita em servicos.receita.fazenda.gov.br/Servicos/CertidaoInternet/PJ/Emitir/index.asp ou /PF/.",
      "Trabalhista (CNDT): emita em https://cndt-certidao.tst.jus.br/inicio.faces.",
      "Estadual (ICMS): se PJ ou produtor rural com inscrição estadual — site da Sefaz do seu estado.",
      "Municipal (ISS): site da prefeitura — só se exigido pelo banco específico.",
      "Pendência ‘positiva com efeito de negativa’ é aceita; ‘positiva’ pura, não.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "dap_caf",
    nome: "DAP / CAF (se Pronaf)",
    categoria: "produtivo",
    obrigatorio: false,
    descricao:
      "Documento de Aptidão ao Pronaf (antigo DAP) ou Cadastro Nacional da Agricultura Familiar (CAF, novo). Obrigatório só para acessar linhas Pronaf — destrava taxas menores.",
    origem: {
      orgao: "Sindicato Rural / EMATER / SAF",
      portal: "CAF Online",
      url: "https://caf.cnae.gov.br",
    },
    passos: [
      "Verifique se você se enquadra: renda bruta anual até R$ 500 mil, área até 4 módulos fiscais, mão de obra predominantemente familiar.",
      "Procure o sindicato rural ou EMATER local — eles emitem o CAF gratuitamente.",
      "Documentos típicos pedidos: identidade, comprovante de residência, ITR, declaração de área plantada/rebanho.",
      "Validade do CAF: 2 anos. Renove antes de protocolar Pronaf novo.",
    ],
    aplica_se: { pronaf: true },
  },
  {
    id: "comprovante_producao",
    nome: "Comprovante de produção / faturamento",
    categoria: "produtivo",
    obrigatorio: true,
    descricao:
      "Notas fiscais de venda da safra anterior, contratos de comercialização, ou declaração de produção do sindicato rural. O banco usa pra calcular capacidade de pagamento e teto da operação.",
    origem: {
      orgao: "Vários (notas fiscais, sindicato, IR)",
    },
    passos: [
      "PJ ou produtor rural com IE: emita relatório de notas fiscais de saída dos últimos 12 meses na Sefaz.",
      "PF sem IE: separe contratos de venda (CPR-F, contratos de armazenagem) e recibos.",
      "Reforce com IR Pessoa Física exibindo a receita rural na ficha ‘Atividade Rural’.",
      "Pecuária: GTAs (Guia de Trânsito Animal) emitidas pela ADAGRO/IDAF/IAGRO comprovam saldo de rebanho.",
      "Banco normalmente quer faturamento mínimo equivalente a 1.5× o valor pleiteado — confere antes de protocolar.",
    ],
    aplica_se: { todos: true },
  },
]

/**
 * Resumo executivo pra UI: total + obrigatórios + opcionais.
 */
export function resumoChecklistPadrao() {
  const total = CHECKLIST_PADRAO.length
  const obrigatorios = CHECKLIST_PADRAO.filter((d) => d.obrigatorio).length
  return { total, obrigatorios, opcionais: total - obrigatorios }
}
