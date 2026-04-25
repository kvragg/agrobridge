// Checklist genérico de crédito rural — exibido em /checklist quando o
// usuário ainda não tem processo (não fez entrevista ou não pagou).
// Baseado nos documentos core do MCR. Cada item traz instrução e link
// pro portal/órgão correto pra emissão.
//
// Estrutura PF/PJ (25/04/2026):
//   - Lead PF: 2 grupos (Cadastro + Crédito Rural)
//   - Lead PJ: 3 grupos (Empresa + Sócios + Crédito Rural)
//   - Crédito Rural é IDÊNTICO pra ambos
//   - Sócios PJ usam o mesmo template de docs pessoais do Cadastro PF
//   - Lead vê apenas o que se aplica a ele — itens condicionais
//     (casado, investimento, pronaf) só aparecem se contexto bater
//
// Quando o lead conclui a entrevista E paga, /checklist/[id] mostra
// versão personalizada gerada pela IA com base no perfil dele.

// ─── Tipos ──────────────────────────────────────────────────────────

/** Grupo visual (accordion no UI). */
export type GrupoChecklist = "cadastro" | "empresa" | "socios" | "credito_rural"

/** Categoria temática (mais granular, dentro do grupo). */
export type CategoriaChecklist =
  | "identificacao"
  | "ambiental"
  | "fundiario"
  | "fiscal"
  | "produtivo"
  | "empresarial"

export interface ItemChecklistPadrao {
  id: string
  nome: string
  sigla?: string
  grupo: GrupoChecklist
  categoria: CategoriaChecklist
  obrigatorio: boolean
  descricao: string
  origem: {
    orgao: string
    portal?: string
    url?: string
  }
  passos: string[]
  /** Aplicabilidade — frontend filtra por tipo do lead + perfil. */
  aplica_se?: {
    pf?: boolean
    pj?: boolean
    pronaf?: boolean
    investimento?: boolean
    casado?: boolean
    todos?: boolean
  }
  nota_instabilidade?: string
}

// ─── Labels visuais ─────────────────────────────────────────────────

export const GRUPO_CHECKLIST_LABEL: Record<GrupoChecklist, string> = {
  cadastro: "Cadastro pessoal",
  empresa: "Empresa",
  socios: "Sócios",
  credito_rural: "Crédito Rural",
}

export const GRUPO_CHECKLIST_DESCRICAO: Record<GrupoChecklist, string> = {
  cadastro:
    "Documentos pessoais para abrir/atualizar seu cadastro no banco",
  empresa:
    "Documentos da pessoa jurídica para abrir/atualizar o cadastro empresarial",
  socios:
    "Documentos pessoais de cada sócio da empresa",
  credito_rural:
    "Documentos específicos da operação de crédito rural — independem de PF/PJ",
}

export const CATEGORIA_CHECKLIST_LABEL: Record<CategoriaChecklist, string> = {
  identificacao: "Identificação",
  ambiental: "Regularidade ambiental",
  fundiario: "Documentação fundiária",
  fiscal: "Regularidade fiscal",
  produtivo: "Produção e renda",
  empresarial: "Documentação empresarial",
}

// ─── PF — CADASTRO PESSOAL ──────────────────────────────────────────

const ITENS_CADASTRO_PF: ItemChecklistPadrao[] = [
  {
    id: "cnh",
    nome: "CNH (ou RG + CPF)",
    grupo: "cadastro",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Documento de identificação com foto. CNH é preferida pelos bancos por ter foto + assinatura + CPF integrados. RG + CPF separados também aceito.",
    origem: { orgao: "DETRAN (CNH) / Receita Federal (CPF)" },
    passos: [
      "Tenha em mãos a CNH física ou digital (app Carteira Digital de Trânsito).",
      "Confira se está dentro da validade — vencida não é aceita.",
      "Se for usar RG: traga junto com o CPF. Bancos podem pedir cópia autenticada de qualquer um dos dois.",
    ],
    aplica_se: { pf: true },
  },
  {
    id: "comprovante_endereco",
    nome: "Comprovante de endereço",
    grupo: "cadastro",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Conta de luz, água, telefone fixo ou contrato de aluguel emitido nos últimos 90 dias em seu nome ou do cônjuge.",
    origem: { orgao: "Concessionárias de serviço público" },
    passos: [
      "Use a fatura mais recente (até 90 dias).",
      "Se a conta estiver em nome do cônjuge ou parente direto, anexe certidão de casamento ou comprovante de parentesco.",
      "Endereço deve bater com o cadastro no banco — divergência atrasa a análise.",
    ],
    aplica_se: { pf: true },
  },
  {
    id: "ir_pf",
    nome: "Declaração de IR (último exercício)",
    grupo: "cadastro",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "Declaração completa de Imposto de Renda Pessoa Física do último exercício, com recibo de entrega. Banco usa para validar renda e patrimônio.",
    origem: {
      orgao: "Receita Federal",
      portal: "e-CAC",
      url: "https://cav.receita.fazenda.gov.br/eCAC/publico/login.aspx",
    },
    passos: [
      "Acesse o e-CAC com gov.br nível prata/ouro ou certificado digital.",
      "Vá em ‘Declarações e Demonstrativos’ → ‘DIRPF’.",
      "Baixe a declaração completa do último exercício + recibo de entrega.",
      "Se isento: declare e baixe o protocolo de isenção.",
    ],
    aplica_se: { pf: true },
  },
  {
    id: "certidao_casamento",
    nome: "Certidão de casamento",
    grupo: "cadastro",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Certidão atualizada (até 90 dias) de casamento ou união estável. Aplicável apenas se o titular do cadastro é casado/em união estável.",
    origem: { orgao: "Cartório de Registro Civil" },
    passos: [
      "Solicite via cartório onde o casamento foi registrado, ou via portal CRC.",
      "Peça a certidão atualizada (não a antiga arquivada em casa).",
      "Validade: 90 dias na maioria dos bancos.",
      "União estável: certidão de declaração lavrada em cartório serve.",
    ],
    aplica_se: { pf: true, casado: true },
  },
  {
    id: "cnh_conjuge",
    nome: "CNH do cônjuge (ou RG + CPF)",
    grupo: "cadastro",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Mesmo documento de identificação do titular, mas do cônjuge. Banco precisa pra validar regime de bens e responsabilidade solidária.",
    origem: { orgao: "DETRAN (CNH) / Receita Federal (CPF)" },
    passos: [
      "CNH digital ou física dentro da validade.",
      "Ou RG + CPF separados.",
      "Confira se o nome bate com o da certidão de casamento.",
    ],
    aplica_se: { pf: true, casado: true },
  },
  {
    id: "estudo_limites",
    nome: "Estudo de limites (quando houver)",
    grupo: "cadastro",
    categoria: "fundiario",
    obrigatorio: false,
    descricao:
      "Levantamento topográfico/geodésico com perímetro e confrontantes do imóvel rural. Exigido em operações de investimento de maior porte e em casos de divisão/desmembramento.",
    origem: {
      orgao: "Profissional CREA habilitado (engenheiro agrimensor/civil)",
    },
    passos: [
      "Contrate engenheiro agrimensor habilitado no CREA da sua UF.",
      "Estudo deve incluir: perímetro georreferenciado, confrontantes, área total, ARTs registradas.",
      "Quando aplica: investimento de maior porte, divisão de imóvel, regularização fundiária.",
      "Custo típico: R$ 5-30k dependendo da área.",
    ],
    aplica_se: { pf: true, investimento: true },
  },
]

// ─── PJ — EMPRESA ───────────────────────────────────────────────────

const ITENS_EMPRESA_PJ: ItemChecklistPadrao[] = [
  {
    id: "contrato_social",
    nome: "Contrato social (versão consolidada + última alteração)",
    grupo: "empresa",
    categoria: "empresarial",
    obrigatorio: true,
    descricao:
      "Contrato social consolidado vigente + última alteração contratual registrada na Junta Comercial. Banco usa para validar quem são os sócios, capital, objeto social e poderes de assinatura.",
    origem: { orgao: "Junta Comercial do estado da empresa" },
    passos: [
      "Solicite ao seu contador a versão consolidada vigente do contrato social.",
      "Anexe também o registro da última alteração contratual (se houver).",
      "Confira se os sócios cadastrados aqui no AgroBridge batem com o contrato.",
      "Se a empresa for ME/EPP/Eireli/Ltda, certifique-se que o contrato está com selo da Junta.",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "balanco_patrimonial",
    nome: "Balanço patrimonial (último exercício)",
    grupo: "empresa",
    categoria: "empresarial",
    obrigatorio: true,
    descricao:
      "Balanço patrimonial do último exercício fechado, assinado por contador com CRC. Banco usa para avaliar saúde financeira e patrimônio da empresa.",
    origem: { orgao: "Contador da empresa (CRC)" },
    passos: [
      "Solicite ao contador da empresa o balanço patrimonial do último exercício.",
      "Documento deve estar assinado pelo contador (CRC).",
      "Empresas no Simples Nacional: balanço gerencial serve, mas o ideal é o oficial assinado.",
      "// TODO Paulo confirmar: bancos pedem 1 ou 2 últimos exercícios?",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "dre",
    nome: "DRE (último exercício)",
    grupo: "empresa",
    categoria: "empresarial",
    obrigatorio: true,
    descricao:
      "Demonstração do Resultado do Exercício (DRE) do último exercício fechado, assinada por contador com CRC. Mostra receita, custo, lucro/prejuízo.",
    origem: { orgao: "Contador da empresa (CRC)" },
    passos: [
      "Solicite ao contador a DRE do último exercício, assinada com CRC.",
      "Confira se o faturamento da DRE bate com o relatório de faturamento 12m.",
      "Se há prejuízo no exercício, anexe nota explicativa do contador (recomendado).",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "faturamento_12m",
    nome: "Faturamento dos últimos 12 meses",
    grupo: "empresa",
    categoria: "empresarial",
    obrigatorio: true,
    descricao:
      "Relatório contábil ou extrato de NF-e dos últimos 12 meses corridos. Banco calcula capacidade de pagamento e teto de operação a partir disso.",
    origem: {
      orgao: "Contador da empresa / Sefaz (relatório de NF-e emitidas)",
    },
    passos: [
      "Solicite ao contador relatório de faturamento mês a mês dos últimos 12 meses.",
      "Alternativa: extrato de NF-e emitidas direto na Sefaz da UF.",
      "Quanto maior detalhamento (por cliente, por produto), melhor pro analista.",
      "Banco normalmente quer faturamento mínimo equivalente a 1.5× o valor pleiteado.",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "comprovante_endereco_empresa",
    nome: "Comprovante de endereço da empresa",
    grupo: "empresa",
    categoria: "empresarial",
    obrigatorio: true,
    descricao:
      "Conta de concessionária (luz, água, telefone, internet) em nome da PJ ou contrato de aluguel da sede, emitido nos últimos 90 dias.",
    origem: { orgao: "Concessionárias de serviço público" },
    passos: [
      "Use fatura recente (até 90 dias) em nome da empresa.",
      "Se a sede é alugada: contrato de locação atualizado serve como complemento ou substituto.",
      "Endereço deve bater com o cadastro CNPJ na Receita.",
      "// TODO Paulo confirmar: aceita conta em nome do sócio quando a empresa funciona em endereço residencial?",
    ],
    aplica_se: { pj: true },
  },
]

// ─── SÓCIO PJ — TEMPLATE (renderizado N vezes, 1 por sócio) ─────────

/**
 * Template de itens que cada sócio da PJ precisa ter. Quando renderizado
 * no UI, cada sócio recebe seus próprios itens com IDs prefixados
 * (ex: `socio_${socio.id}_cnh`). Isso garante unicidade e permite upload
 * separado por sócio. Itens condicionais (`casado`) só aparecem pra
 * sócios com estado_civil='casado' ou 'uniao_estavel'.
 *
 * Reaproveita os mesmos guias visuais dos itens PF (CNH, comprovante,
 * IR, certidão casamento, CNH cônjuge) — não duplica conteúdo.
 */
export const ITENS_POR_SOCIO: ItemChecklistPadrao[] = [
  {
    id: "socio_cnh",
    nome: "CNH (ou RG + CPF)",
    grupo: "socios",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Documento de identificação com foto do sócio. CNH preferida pelos bancos.",
    origem: { orgao: "DETRAN / Receita Federal" },
    passos: [
      "CNH dentro da validade (digital ou física).",
      "Ou RG + CPF separados.",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "socio_comprovante_endereco",
    nome: "Comprovante de endereço (≤ 90 dias)",
    grupo: "socios",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Conta de luz/água/telefone ou contrato de aluguel em nome do sócio, até 90 dias.",
    origem: { orgao: "Concessionárias de serviço público" },
    passos: [
      "Fatura até 90 dias.",
      "Em nome do cônjuge: anexe certidão de casamento.",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "socio_ir",
    nome: "Declaração de IR (último exercício)",
    grupo: "socios",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "DIRPF completa do último exercício do sócio + recibo de entrega.",
    origem: {
      orgao: "Receita Federal",
      portal: "e-CAC",
      url: "https://cav.receita.fazenda.gov.br/eCAC/publico/login.aspx",
    },
    passos: [
      "e-CAC → Declarações → DIRPF → baixar última.",
      "Se isento: protocolo de isenção.",
    ],
    aplica_se: { pj: true },
  },
  {
    id: "socio_certidao_casamento",
    nome: "Certidão de casamento",
    grupo: "socios",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Certidão atualizada (≤ 90 dias). Aplicável só se o sócio é casado ou em união estável.",
    origem: { orgao: "Cartório de Registro Civil" },
    passos: [
      "Solicite via cartório de registro ou portal CRC.",
      "União estável: declaração lavrada em cartório.",
    ],
    aplica_se: { pj: true, casado: true },
  },
  {
    id: "socio_cnh_conjuge",
    nome: "CNH do cônjuge (ou RG + CPF)",
    grupo: "socios",
    categoria: "identificacao",
    obrigatorio: true,
    descricao:
      "Identificação do cônjuge do sócio. Banco precisa pra validar regime de bens.",
    origem: { orgao: "DETRAN / Receita Federal" },
    passos: ["CNH dentro da validade ou RG + CPF separados."],
    aplica_se: { pj: true, casado: true },
  },
]

// ─── CRÉDITO RURAL — IDÊNTICO PRA PF E PJ ───────────────────────────

const ITENS_CREDITO_RURAL: ItemChecklistPadrao[] = [
  {
    id: "car",
    nome: "CAR — Cadastro Ambiental Rural",
    sigla: "CAR",
    grupo: "credito_rural",
    categoria: "ambiental",
    obrigatorio: true,
    descricao:
      "Registro eletrônico obrigatório dos imóveis rurais junto ao Sistema Nacional de Cadastro Ambiental Rural. Sem CAR ativo, o crédito não sai — Lei 12.651/2012.",
    origem: {
      orgao: "MMA / SICAR",
      portal: "SICAR",
      url: "https://www.car.gov.br",
    },
    passos: [
      "Acesse car.gov.br e localize o imóvel pela inscrição estadual ou nome.",
      "Baixe o demonstrativo do CAR (PDF com mapa e área) — esse é o documento que o banco pede.",
      "Confira se o status está ‘Ativo’ ou ‘Pendente de análise’. Status ‘Cancelado’ ou ‘Suspenso’ trava o crédito.",
      "Se houver pendência ambiental (embargo, área degradada), regularize via PRA antes de protocolar.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "ccir",
    nome: "CCIR — Certificado de Cadastro de Imóvel Rural",
    sigla: "CCIR",
    grupo: "credito_rural",
    categoria: "fundiario",
    obrigatorio: true,
    descricao:
      "Certificado emitido pelo INCRA que comprova o cadastro do imóvel rural. Atualizado anualmente.",
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
    nome: "ITR — Imposto sobre a Propriedade Territorial Rural (último exercício)",
    sigla: "ITR",
    grupo: "credito_rural",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "Comprovante de pagamento ou de declaração do ITR do último exercício. ITR atrasado é regra dura — comitê de crédito não aprova.",
    origem: {
      orgao: "Receita Federal",
      portal: "e-CAC",
      url: "https://cav.receita.fazenda.gov.br/eCAC/publico/login.aspx",
    },
    passos: [
      "Entre no e-CAC com certificado digital ou conta gov.br nível prata/ouro.",
      "Vá em ‘Declarações e Demonstrativos’ → ‘ITR’.",
      "Baixe o DARF pago do último exercício (ou a declaração com isenção, se imune). Não é necessário trazer histórico de exercícios anteriores.",
      "Imóvel em nome de outro (espólio, sociedade, arrendamento) — o ITR é do PROPRIETÁRIO. Peça a cópia.",
      "ITR em atraso? Quite na própria Receita antes de protocolar — não tem como contornar.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "matricula",
    nome: "Matrícula atualizada do imóvel",
    grupo: "credito_rural",
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
      "Imóvel sem matrícula individualizada (gleba bruta) ou em inventário: trava o crédito até regularizar.",
      "Validade: 30 dias.",
    ],
    aplica_se: { todos: true },
    nota_instabilidade:
      "O portal ONR fica instável com frequência. Se não abrir, tente em outro horário (madrugada costuma funcionar) ou vá direto ao cartório do município do imóvel — o serviço presencial é equivalente.",
  },
  {
    id: "cnds",
    nome: "Certidões negativas — Receita Federal, INSS, Trabalhista",
    grupo: "credito_rural",
    categoria: "fiscal",
    obrigatorio: true,
    descricao:
      "Trio que comprova regularidade fiscal e trabalhista. Qualquer pendência aqui é detectada na consulta SCR/Bacen e barra a operação.",
    origem: { orgao: "Receita Federal / TST" },
    passos: [
      "Receita Federal + INSS (uma certidão só): emita em servicos.receita.fazenda.gov.br/Servicos/CertidaoInternet.",
      "Trabalhista (CNDT): emita em https://cndt-certidao.tst.jus.br/inicio.faces.",
      "Estadual (ICMS): site da Sefaz da sua UF.",
      "Pendência ‘positiva com efeito de negativa’ é aceita; ‘positiva’ pura, não.",
    ],
    aplica_se: { todos: true },
  },
  {
    id: "projeto",
    nome: "Projeto técnico (operações de investimento)",
    grupo: "credito_rural",
    categoria: "produtivo",
    obrigatorio: false,
    descricao:
      "Projeto técnico assinado por engenheiro agrônomo ou profissional habilitado, descrevendo a obra/equipamento/aquisição financiada e a viabilidade econômica.",
    origem: {
      orgao: "Engenheiro agrônomo CREA / responsável técnico habilitado",
    },
    passos: [
      "Contrate profissional habilitado (eng. agrônomo, zootecnista, eng. agrícola conforme objeto).",
      "Projeto deve ter: descrição da obra/equipamento, orçamento, cronograma, viabilidade econômica e ART recolhida.",
      "Banco normalmente exige formato específico — pergunte ao gerente qual modelo eles aceitam.",
      "Aplica só pra crédito de investimento (Pronamp, Inovagro, Moderfrota, ABC+, etc).",
    ],
    aplica_se: { todos: true, investimento: true },
  },
  {
    id: "croqui",
    nome: "Croqui da propriedade (operações de investimento)",
    grupo: "credito_rural",
    categoria: "produtivo",
    obrigatorio: false,
    descricao:
      "Esquema visual da propriedade indicando localização da obra/benfeitoria/equipamento que será financiado. Anexa ao projeto técnico.",
    origem: { orgao: "Mesmo profissional que assinou o projeto técnico" },
    passos: [
      "Croqui pode ser desenho técnico ou imagem aérea anotada.",
      "Indicar com clareza: localização da obra, áreas de plantio/pastagem, benfeitorias existentes, acessos.",
      "Aplica só pra crédito de investimento.",
    ],
    aplica_se: { todos: true, investimento: true },
  },
  {
    id: "dap_caf",
    nome: "DAP / CAF (se Pronaf)",
    grupo: "credito_rural",
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
      "Validade do CAF: 2 anos.",
    ],
    aplica_se: { todos: true, pronaf: true },
    nota_instabilidade:
      "O portal CAF Online (caf.cnae.gov.br) fica fora do ar com frequência. Solução melhor que esperar: vai direto no sindicato rural ou na EMATER do seu município — eles emitem o CAF gratuitamente e mais rápido que pelo portal.",
  },
  {
    id: "comprovante_producao",
    nome: "Comprovante de produção / faturamento rural",
    grupo: "credito_rural",
    categoria: "produtivo",
    obrigatorio: true,
    descricao:
      "Notas fiscais de venda da safra anterior, contratos de comercialização, ou declaração de produção do sindicato rural. O banco usa pra calcular capacidade de pagamento e teto da operação.",
    origem: { orgao: "Vários (notas fiscais, sindicato, IR Atividade Rural)" },
    passos: [
      "PJ ou produtor rural com IE: emita relatório de notas fiscais de saída dos últimos 12 meses na Sefaz.",
      "PF sem IE: separe contratos de venda (CPR-F, contratos de armazenagem) e recibos.",
      "Reforce com IR Pessoa Física exibindo a receita rural na ficha ‘Atividade Rural’.",
      "Pecuária: GTAs (Guia de Trânsito Animal) emitidas pela ADAGRO/IDAF/IAGRO comprovam saldo de rebanho.",
      "Banco normalmente quer faturamento mínimo equivalente a 1.5× o valor pleiteado.",
    ],
    aplica_se: { todos: true },
  },
]

// ─── EXPORTS PRINCIPAIS ─────────────────────────────────────────────

/**
 * Lista plana de todos os items "fixos" (não por sócio). Mantém
 * compatibilidade com código antigo que importa CHECKLIST_PADRAO.
 * Para itens por sócio, ver ITENS_POR_SOCIO acima — renderizados
 * dinamicamente N vezes no UI.
 */
export const CHECKLIST_PADRAO: ItemChecklistPadrao[] = [
  ...ITENS_CADASTRO_PF,
  ...ITENS_EMPRESA_PJ,
  ...ITENS_CREDITO_RURAL,
]

/** Helpers de filtragem usados pelo ChecklistGenerico no client. */

export interface ContextoChecklist {
  leadType: "pf" | "pj"
  /** Estado civil do lead PF — define se mostra certidão casamento + CNH cônjuge. */
  casado?: boolean
  /** Operação de investimento — define se mostra projeto + croqui + estudo limites. */
  investimento?: boolean
  /** Lead se enquadra em Pronaf — define se mostra CAF/DAP. */
  pronaf?: boolean
}

/** Filtra a lista plana respeitando o contexto. */
export function filtrarChecklistPorContexto(
  items: ItemChecklistPadrao[],
  ctx: ContextoChecklist,
): ItemChecklistPadrao[] {
  return items.filter((item) => {
    const a = item.aplica_se ?? {}
    if (a.todos) {
      // Items "todos" (Crédito Rural) entram sempre, exceto se condicionais
      // específicos não baterem
      if (a.investimento && !ctx.investimento) return false
      if (a.pronaf && !ctx.pronaf) return false
      return true
    }
    if (ctx.leadType === "pf") {
      if (!a.pf) return false
      if (a.casado && !ctx.casado) return false
      if (a.investimento && !ctx.investimento) return false
      return true
    }
    if (ctx.leadType === "pj") {
      // PJ vê items de "empresa" + itens "todos" do crédito rural
      // (sócios são renderizados separadamente via ITENS_POR_SOCIO)
      if (!a.pj) return false
      if (item.grupo === "socios") return false // sócios entram via render dinâmico
      return true
    }
    return false
  })
}

/** Renderiza items de UM sócio específico, prefixando IDs e respeitando estado civil. */
export function itensDoSocio(
  socio: { id: string; estado_civil: string; full_name: string },
): Array<ItemChecklistPadrao & { socio_id: string }> {
  const isCasado =
    socio.estado_civil === "casado" || socio.estado_civil === "uniao_estavel"
  return ITENS_POR_SOCIO
    .filter((tpl) => {
      const a = tpl.aplica_se ?? {}
      if (a.casado && !isCasado) return false
      return true
    })
    .map((tpl) => ({
      ...tpl,
      id: `socio_${socio.id}_${tpl.id}`,
      socio_id: socio.id,
    }))
}

/** Resumo executivo — usado no header do bloco. */
export function resumoChecklistPadrao(items: ItemChecklistPadrao[]) {
  const total = items.length
  const obrigatorios = items.filter((d) => d.obrigatorio).length
  return { total, obrigatorios, opcionais: total - obrigatorios }
}
