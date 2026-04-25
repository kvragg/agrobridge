// Base de conhecimento MCR — documentos criticos por perfil.
// Nao substitui o checklist B10 (fonte de verdade oficial) — esta
// funcao retorna um subconjunto priorizado para a mini-analise
// freemium (visao de alto nivel, nao checklist completo).

import type { FinalidadeCredito } from './linhas-credito'

export interface DocumentoCritico {
  id: string
  nome: string
  por_que: string
}

// TODO: Paulo confirmar precedencia real dos documentos.
const DOCUMENTOS: Record<string, DocumentoCritico> = {
  car: {
    id: 'car',
    nome: 'CAR (Cadastro Ambiental Rural)',
    por_que: 'Toda operacao rural exige CAR valido sem embargo ou sobreposicao.',
  },
  ccir: {
    id: 'ccir',
    nome: 'CCIR (Certificado de Cadastro de Imovel Rural)',
    por_que: 'Atesta a regularidade do imovel junto ao INCRA. Costuma ser o primeiro gargalo.',
  },
  itr: {
    id: 'itr',
    nome: 'ITR (Imposto sobre a Propriedade Territorial Rural) — ultimo exercicio',
    por_que: 'Comprova que o imposto esta em dia e que o imovel existe para a Receita. Apenas o exercicio mais recente — historico nao e necessario.',
  },
  matricula: {
    id: 'matricula',
    nome: 'Matricula atualizada do imovel',
    por_que: 'Comprova propriedade / usufruto e eventual garantia hipotecaria.',
  },
  cnd_federal: {
    id: 'cnd_federal',
    nome: 'CND Federal (PGFN/Receita)',
    por_que: 'Pendencia federal bloqueia contratacao de credito oficial.',
  },
  cnd_trabalhista: {
    id: 'cnd_trabalhista',
    nome: 'CND Trabalhista',
    por_que: 'Exigida em operacoes com recursos controlados.',
  },
  ir_pf: {
    id: 'ir_pf',
    nome: 'Declaracao de IRPF dos 2 ultimos exercicios',
    por_que: 'Base para calculo da capacidade de pagamento / renda comprovada.',
  },
  dap_caf: {
    id: 'dap_caf',
    nome: 'DAP ou CAF (Declaracao de Aptidao Pronaf)',
    por_que: 'Obrigatoria para acesso a linhas Pronaf.',
  },
  pronamp_decl: {
    id: 'pronamp_decl',
    nome: 'Declaracao de enquadramento Pronamp',
    por_que: 'Obrigatoria para acesso a linhas Pronamp (emitida pela instituicao).',
  },
  projeto_tecnico: {
    id: 'projeto_tecnico',
    nome: 'Projeto tecnico com ART',
    por_que: 'Valores elevados (tipicamente > R$ 500 mil) exigem projeto por engenheiro agronomo / zootecnista.',
  },
  croqui: {
    id: 'croqui',
    nome: 'Croqui da propriedade',
    por_que: 'Mapa com localizacao das culturas / atividades planejadas.',
  },
  licenca_ambiental: {
    id: 'licenca_ambiental',
    nome: 'Licenca ambiental valida',
    por_que: 'Obrigatoria para atividades que demandam licenciamento (irrigacao, aviario, confinamento).',
  },
  saldo_gado: {
    id: 'saldo_gado',
    nome: 'Saldo de gado (Iagro / Agrodefesa / Adapar)',
    por_que: 'Para operacoes de pecuaria, comprova o rebanho declarado.',
  },
  cpr: {
    id: 'cpr',
    nome: 'CPR ou contrato de comercializacao',
    por_que: 'Demonstra receita futura vinculada, essencial em operacoes de comercializacao.',
  },
  contrato_social: {
    id: 'contrato_social',
    nome: 'Contrato social e certidao da Junta',
    por_que: 'Para PJ: prova a constituicao e os poderes de assinatura.',
  },
  balanco: {
    id: 'balanco',
    nome: 'Balanco patrimonial e DRE dos ultimos 2 exercicios',
    por_que: 'Para PJ: base da analise de capacidade financeira.',
  },
}

// Retorna documentos criticos prioritarios para a mini-analise freemium.
// 2-3 itens, escolhidos pela combinacao finalidade + valor + cultura.
export function documentosCriticosPorPerfil(params: {
  finalidade: FinalidadeCredito | null
  valor_pretendido: number | null
  cultura_principal: string | null
  is_pj?: boolean
}): readonly DocumentoCritico[] {
  const { finalidade, valor_pretendido, cultura_principal, is_pj } = params
  const criticos: DocumentoCritico[] = []

  // Sempre no topo
  criticos.push(DOCUMENTOS.car)
  criticos.push(DOCUMENTOS.matricula)

  if (valor_pretendido && valor_pretendido >= 500_000) {
    criticos.push(DOCUMENTOS.projeto_tecnico)
  }

  if (finalidade === 'investimento') {
    criticos.push(DOCUMENTOS.licenca_ambiental)
  }

  if (finalidade === 'comercializacao') {
    criticos.push(DOCUMENTOS.cpr)
  }

  const c = (cultura_principal ?? '').toLowerCase()
  if (/\b(boi|gado|pecu|leite|corte)\b/.test(c)) {
    criticos.push(DOCUMENTOS.saldo_gado)
  }

  if (is_pj) {
    criticos.push(DOCUMENTOS.contrato_social)
    criticos.push(DOCUMENTOS.balanco)
  } else {
    criticos.push(DOCUMENTOS.ir_pf)
  }

  // Deduplica e limita a 3 (mini-analise e sintetica)
  const unicos: DocumentoCritico[] = []
  for (const d of criticos) {
    if (!unicos.find((u) => u.id === d.id)) unicos.push(d)
    if (unicos.length >= 3) break
  }
  return unicos
}
