// Base canônica dos 9 documentos MCR essenciais para todo dossiê rural.
//
// Fonte-da-verdade em código (e não só no prompt Sonnet) porque:
//   - o cliente do checklist (`checklist-client.tsx`) consegue enriquecer
//     cada item com prazo/link/passos sem depender de parsing de markdown;
//   - o prompt do Sonnet agora referencia esta lista por nome (NÃO
//     inventa docs novos, NÃO cita NIRF nem "Notas Bezerros" — fora do
//     escopo MCR padrão);
//   - o seed de UAT (`scripts/seed-uat-real.ts`) usa os nomes canônicos
//     para garantir consistência do E2E.
//
// Ordem na lista reflete a prioridade que o Banco / Cooperativa analisa.

export type CategoriaMCR =
  | 'imovel'
  | 'ambiental'
  | 'pessoal'
  | 'renda'
  | 'credito'
  | 'operacao'

export interface DocMCR {
  id: string
  nome: string
  categoria: CategoriaMCR
  por_que: string
  onde_obter: readonly string[] // passos didáticos (1..N)
  prazo_estimado: string
  link_oficial?: { label: string; url: string; aviso?: string }
  opcional?: boolean
}

export const CHECKLIST_MCR_DOCS: readonly DocMCR[] = [
  {
    id: 'car',
    nome: 'CAR (Cadastro Ambiental Rural)',
    categoria: 'ambiental',
    por_que:
      'Toda operação rural exige CAR válido, sem embargo nem sobreposição. É o primeiro filtro ambiental.',
    onde_obter: [
      'Acessar o portal do SICAR (car.gov.br).',
      'Consultar o imóvel pelo CPF/CNPJ do proprietário.',
      'Emitir o Recibo de Inscrição do CAR (tem número de protocolo).',
    ],
    prazo_estimado: 'imediato (online) — ou 5–15 dias se precisar cadastrar',
    link_oficial: {
      label: 'Abrir portal do SICAR',
      url: 'https://www.car.gov.br/publico/imoveis/index',
    },
  },
  {
    id: 'ccir',
    nome: 'CCIR (Certificado de Cadastro de Imóvel Rural)',
    categoria: 'imovel',
    por_que:
      'Atesta a regularidade do imóvel junto ao INCRA. Precisa estar quitado (sem débito de TFRA).',
    onde_obter: [
      'Acessar o portal do INCRA (área de certificação de imóvel rural).',
      'Informar o CPF do proprietário.',
      'Emitir o CCIR atualizado.',
      'Se houver débito, regularizar antes de emitir.',
    ],
    prazo_estimado: 'imediato (online)',
    link_oficial: {
      label: 'Emitir CCIR no INCRA',
      url: 'https://certificacao.incra.gov.br/csv_ccir/manterCcir.action',
    },
  },
  {
    id: 'itr',
    nome: 'ITR (Imposto Territorial Rural)',
    categoria: 'imovel',
    por_que:
      'Comprova que o imposto está em dia e que o imóvel existe para a Receita.',
    onde_obter: [
      'Acessar o portal da Receita Federal (Serviços → ITR).',
      'Consultar a declaração do exercício atual (2026) — ou mais recente disponível.',
      'Baixar o comprovante de entrega e o recibo.',
    ],
    prazo_estimado: 'imediato (online)',
    link_oficial: {
      label: 'Consultar ITR na Receita',
      url: 'https://servicos.receita.fazenda.gov.br/servicos/itr/default.htm',
    },
  },
  {
    id: 'matricula',
    nome: 'Matrícula do Imóvel Atualizada',
    categoria: 'imovel',
    por_que:
      'Comprova propriedade/usufruto e é base da garantia hipotecária. Validade típica: 30 dias.',
    onde_obter: [
      'Ir ao Cartório de Registro de Imóveis da comarca onde o imóvel fica (ou pelo portal do ONR se o cartório estiver integrado).',
      'Pedir certidão de inteiro teor atualizada.',
      'Levar CPF/CNPJ do proprietário e, se souber, o número da matrícula.',
    ],
    prazo_estimado: '2–7 dias úteis',
    link_oficial: {
      label: 'Pedido online (ARISP / ONR)',
      url: 'https://www.registradores.onr.org.br/',
      aviso:
        'Se o cartório não estiver integrado, o pedido precisa ser presencial na comarca do imóvel.',
    },
  },
  {
    id: 'cnd_federal',
    nome: 'CND Federal (PGFN / Receita Federal)',
    categoria: 'pessoal',
    por_que:
      'Pendência federal bloqueia contratação de crédito com recursos controlados.',
    onde_obter: [
      'Acessar o portal da Receita Federal (Serviços → Certidões).',
      'Emitir a Certidão Negativa de Débitos Federais com CPF/CNPJ.',
      'Se houver pendência, baixar certidão positiva com efeito de negativa OU regularizar antes.',
    ],
    prazo_estimado: 'imediato (online)',
    link_oficial: {
      label: 'Emitir CND Federal (Receita)',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PF/Emitir',
    },
  },
  {
    id: 'cnd_ibama',
    nome: 'CND IBAMA (Certidão Negativa de Débitos Ambientais)',
    categoria: 'ambiental',
    por_que:
      'Pendência ambiental no IBAMA bloqueia liberação de crédito rural.',
    onde_obter: [
      'Acessar o portal do IBAMA (Serviços → Certidões e Licenças).',
      'Emitir a CND com CPF/CNPJ.',
    ],
    prazo_estimado: 'imediato (online)',
    link_oficial: {
      label: 'Emitir CND do IBAMA',
      url: 'https://servicos.ibama.gov.br/ctf/publico/certidaoNegativa/',
    },
  },
  {
    id: 'irpf',
    nome: 'Declaração de IRPF (última completa)',
    categoria: 'renda',
    por_que:
      'Base para comprovação de renda e análise de capacidade de pagamento.',
    onde_obter: [
      'Acessar "Meu Imposto de Renda" com conta Gov.br.',
      'Baixar o recibo de entrega e a declaração completa (incluindo ficha de Atividade Rural / Livro Caixa, quando aplicável).',
    ],
    prazo_estimado: 'imediato (online)',
    link_oficial: {
      label: 'Meu Imposto de Renda',
      url: 'https://www.gov.br/receitafederal/pt-br/servicos/meu-imposto-de-renda',
    },
  },
  {
    id: 'registrato',
    nome: 'Registrato (Bacen)',
    categoria: 'credito',
    por_que:
      'Relatório de relacionamentos financeiros no SFN — peça-chave da defesa de crédito. Comprova endividamento total.',
    onde_obter: [
      'Acessar registrato.bcb.gov.br.',
      'Entrar com conta Gov.br.',
      'Em "Relatórios" → "Endividamento e Relacionamentos", selecionar todos os módulos.',
      'Gerar relatório e baixar o PDF.',
    ],
    prazo_estimado: 'imediato (online). Validade: 30 dias — emita só quando estiver perto de entregar.',
    link_oficial: {
      label: 'Abrir Registrato no Bacen',
      url: 'https://www.bcb.gov.br/cedadoscidadao/registrato',
    },
  },
  {
    id: 'licenca_ambiental',
    nome: 'Licença Ambiental ou Declaração de Dispensa',
    categoria: 'ambiental',
    por_que:
      'Obrigatória para atividades que demandam licenciamento (irrigação, confinamento, avicultura, etc).',
    onde_obter: [
      'Procurar a Secretaria de Meio Ambiente do Estado (varia por UF).',
      'Para atividades federais, seguir pelo IBAMA.',
      'Se a atividade é dispensada, emitir a Declaração de Dispensa no órgão competente.',
    ],
    prazo_estimado: '15–60 dias (conforme UF e tipo de atividade)',
    opcional: true,
  },
  {
    id: 'projeto_tecnico',
    nome: 'Projeto Técnico com ART',
    categoria: 'operacao',
    por_que:
      'Obrigatório para valores elevados (tipicamente > R$ 500 mil) — elaborado por Engenheiro Agrônomo habilitado no CREA. Respaldo técnico da operação.',
    onde_obter: [
      'Contratar Engenheiro Agrônomo habilitado no CREA.',
      'O projeto deve conter: memorial descritivo, croqui da propriedade, inventário patrimonial a valor de mercado, orçamento detalhado e ART.',
      '⚠️ Nunca usar o valor do IR para patrimônio — sempre valor de mercado atual.',
    ],
    prazo_estimado: '7–30 dias (depende do escopo)',
    opcional: true,
  },
] as const

// Casa um nome-livre (ex: do markdown gerado pelo Sonnet) com a entrada
// canônica na base. Usa heurística por ID e por primeira palavra-chave.
// Retorna null se não encontrar — o cliente então renderiza só o básico.
export function encontrarDocMCR(nomeOuTrecho: string): DocMCR | null {
  const t = nomeOuTrecho.toLowerCase()
  for (const doc of CHECKLIST_MCR_DOCS) {
    if (t.includes(doc.id)) return doc
    // primeira palavra relevante do nome (CCIR, Matrícula, etc)
    const primeira = doc.nome.split(/[\s(]+/)[0].toLowerCase()
    if (primeira.length >= 3 && t.includes(primeira)) return doc
  }
  return null
}
