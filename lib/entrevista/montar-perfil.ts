import 'server-only'

import type { PerfilLead } from '@/types/perfil-lead'
import type {
  FaixaFaturamento,
  PerfilEntrevista,
  TipoCredito,
} from '@/types/entrevista'

// Helper puro — converte PerfilLead (campos extraídos pela IA do chat,
// estrutura simples) em PerfilEntrevista (estrutura rica que o
// gerarChecklist + gerarLaudo + gerarViabilidade esperam).
//
// Quando o lead conversa com o /api/chat, a função extrairFatosDaTroca
// preenche perfis_lead com campos diretos (nome, cultura, valor, etc) +
// memoria_ia (dump livre). Mas o gerador de checklist/dossiê espera
// PerfilEntrevista — schema do prompt antigo da entrevista estruturada.
//
// Esta função preenche o que tem, deixa null/false/strings vazias no
// que falta. A IA do checklist sabe lidar com campos ausentes.

function inferirTipoCredito(
  finalidade: string | null,
): TipoCredito {
  if (!finalidade) return 'custeio'
  const f = finalidade.toLowerCase()
  if (f.includes('investimento') || f.includes('máquina') || f.includes('terra'))
    return 'investimento'
  if (f.includes('comercializ')) return 'comercializacao'
  return 'custeio'
}

function inferirFaixaFaturamento(valor: number | null): FaixaFaturamento {
  if (!valor || valor < 500_000) return 'abaixo_500k'
  if (valor < 1_000_000) return '500k_1M'
  if (valor < 5_000_000) return '1M_5M'
  return 'acima_5M'
}

/**
 * Lê valor de memoria_ia com fallback. Aceita variações de chave
 * (snake_case, camelCase) porque a IA pode salvar de jeitos diferentes.
 */
function memVal(
  mem: Record<string, unknown>,
  ...chaves: string[]
): unknown {
  for (const k of chaves) {
    if (mem[k] !== undefined && mem[k] !== null) return mem[k]
  }
  return null
}

function asBool(v: unknown): boolean | null {
  if (v === true || v === 'true' || v === 'sim' || v === 1) return true
  if (v === false || v === 'false' || v === 'nao' || v === 'não' || v === 0)
    return false
  return null
}

function asStr(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  return fallback
}

export function montarPerfilEntrevistaDeLead(
  lead: PerfilLead,
): PerfilEntrevista {
  const mem = (lead.memoria_ia ?? {}) as Record<string, unknown>

  // Tipo PF/PJ — heurística: CPF preenchido ⇒ PF, senão default PF
  const tipoPessoa: 'PF' | 'PJ' =
    asStr(memVal(mem, 'tipo_pessoa', 'tipoPessoa')).toUpperCase() === 'PJ'
      ? 'PJ'
      : 'PF'

  // Regime de propriedade — heurística da memoria_ia
  const regime: 'propria' | 'arrendada' | 'parceria' = (() => {
    const r = asStr(
      memVal(mem, 'relacao_terra', 'regime_propriedade', 'tipo_terra'),
    ).toLowerCase()
    if (r.includes('arrend')) return 'arrendada'
    if (r.includes('parceria') || r.includes('meeiro')) return 'parceria'
    return 'propria'
  })()

  const carSituacao: 'ativo' | 'pendente' | 'nao_feito' = (() => {
    const c = asStr(memVal(mem, 'car', 'car_situacao')).toLowerCase()
    if (c.includes('ativo') || c.includes('regular') || c.includes('averbado'))
      return 'ativo'
    if (c.includes('pendente') || c.includes('inscrito')) return 'pendente'
    if (c.includes('nao') || c.includes('não') || c === '') return 'nao_feito'
    return 'pendente'
  })()

  return {
    perfil: {
      nome: lead.nome ?? '',
      cpf: lead.cpf ?? '',
      estado: lead.estado_uf ?? '',
      municipio: lead.municipio ?? '',
      tipo_pessoa: tipoPessoa,
      atividade_principal: lead.cultura_principal ?? '',
      atividades_secundarias: (() => {
        const arr = memVal(mem, 'atividades_secundarias', 'culturas_secundarias')
        return Array.isArray(arr)
          ? arr.filter((x): x is string => typeof x === 'string')
          : []
      })(),
      tempo_atividade_anos: (() => {
        const v = memVal(mem, 'tempo_atividade_anos', 'anos_atividade')
        return typeof v === 'number' ? v : null
      })(),
    },
    propriedade: {
      regime,
      area_hectares: lead.fazenda_area_ha,
      disponivel_como_garantia:
        asBool(memVal(mem, 'imovel_garantia', 'pode_dar_garantia')) ??
        regime === 'propria',
      impedimento_garantia: asStr(memVal(mem, 'impedimento_garantia')),
      matricula_disponivel: asBool(
        memVal(mem, 'matricula_disponivel', 'tem_matricula'),
      ),
      matricula_em_nome_proprio: asBool(
        memVal(mem, 'matricula_em_nome_proprio'),
      ),
      car_situacao: carSituacao,
      ccir_em_dia: asBool(memVal(mem, 'ccir', 'ccir_em_dia')),
      itr_em_dia: asBool(memVal(mem, 'itr', 'itr_em_dia')),
    },
    documentacao_pf: {
      cnd_federal: asBool(memVal(mem, 'cnd_federal', 'certidao_federal')),
      cnd_estadual: asBool(memVal(mem, 'cnd_estadual', 'certidao_estadual')),
      cnd_municipal: asBool(memVal(mem, 'cnd_municipal', 'certidao_municipal')),
      dispensa_ou_licenca_ambiental: asBool(
        memVal(mem, 'licenca_ambiental', 'dispensa_ambiental'),
      ),
    },
    documentacao_pj: {
      contrato_social_atualizado: asBool(memVal(mem, 'contrato_social')),
      certidao_simplificada_junta: asBool(memVal(mem, 'certidao_junta')),
      faturamento_12_meses_documentado: asBool(
        memVal(mem, 'faturamento_documentado'),
      ),
      balanco_dre_disponivel: asBool(memVal(mem, 'balanco_dre')),
    },
    financeiro: {
      faturamento_medio_anual: (() => {
        const v = memVal(mem, 'faturamento_medio_anual', 'faturamento')
        return typeof v === 'number' ? v : null
      })(),
      faixa_faturamento: inferirFaixaFaturamento(
        (() => {
          const v = memVal(mem, 'faturamento_medio_anual', 'faturamento')
          return typeof v === 'number' ? v : null
        })(),
      ),
      parcelas_em_atraso: asBool(memVal(mem, 'parcelas_em_atraso')) ?? false,
      credito_rural_ativo: asBool(
        memVal(mem, 'credito_ativo', 'tem_credito_rural'),
      ) ?? false,
      saldo_devedor_rural: (() => {
        const v = memVal(mem, 'saldo_devedor', 'saldo_credito')
        return typeof v === 'number' ? v : null
      })(),
    },
    necessidade_credito: {
      valor: lead.valor_pretendido,
      finalidade: lead.finalidade_credito ?? '',
      tipo: inferirTipoCredito(lead.finalidade_credito),
      prazo_preferido: asStr(memVal(mem, 'prazo', 'prazo_preferido')),
      banco_preferido: lead.banco_alvo ?? '',
      linha_preferida: asStr(memVal(mem, 'linha_credito', 'linha_preferida')),
    },
    pendencias: {
      sanitaria: {
        tem_pendencia:
          asBool(memVal(mem, 'pendencia_sanitaria', 'iagro_pendente')) ?? false,
        orgao: asStr(memVal(mem, 'orgao_sanitario')),
        descricao: asStr(memVal(mem, 'descricao_sanitaria')),
      },
      ambiental: {
        tem_pendencia:
          asBool(memVal(mem, 'pendencia_ambiental', 'embargo_ambiental')) ??
          false,
        orgao: asStr(memVal(mem, 'orgao_ambiental')),
        descricao: asStr(memVal(mem, 'descricao_ambiental')),
      },
      judicial: {
        tem_pendencia:
          asBool(memVal(mem, 'processo_judicial', 'tem_processo')) ?? false,
        descricao: asStr(memVal(mem, 'descricao_judicial')),
      },
    },
    alertas: [],
    observacoes_livres: asStr(
      memVal(mem, 'observacoes', 'notas_livres'),
      lead.historico_credito ?? '',
    ),
  }
}

/**
 * Sinal de "perfil minimamente preenchido" — usado pra decidir se o
 * botão "Concluir entrevista" pode aparecer no chat. Se tem nome +
 * pelo menos uma das (cultura | área | valor), o perfil tem corpo
 * suficiente pra gerar checklist personalizado.
 */
export function leadTemPerfilMinimo(lead: PerfilLead | null): boolean {
  if (!lead) return false
  if (!lead.nome) return false
  const temAlgo =
    !!lead.cultura_principal ||
    !!lead.fazenda_area_ha ||
    !!lead.valor_pretendido ||
    !!lead.estado_uf
  return temAlgo
}
