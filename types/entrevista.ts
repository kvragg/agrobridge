// Interface do JSON de saída da entrevista (claude-haiku-4-5)
// Espelha o schema definido em prompts/entrevista-system.md

export type AlertaEntrevista =
  | 'IAGRO_PENDENTE'
  | 'AGRODEFESA_PENDENTE'
  | 'NEGATIVADO'
  | 'CAR_PENDENTE'
  | 'CND_PENDENTE'
  | 'LICENCA_AMBIENTAL_PENDENTE'
  | 'GARANTIA_COMPROMETIDA'
  | 'CREDITO_ALTO'
  | 'MATRICULA_TERCEIRO'
  | 'EXECUCAO_JUDICIAL'
  | 'PJ_DOC_PENDENTE'

export type FaixaFaturamento =
  | 'abaixo_500k'
  | '500k_1M'
  | '1M_5M'
  | 'acima_5M'

export type TipoCredito = 'custeio' | 'investimento' | 'comercializacao'

export interface PerfilEntrevista {
  perfil: {
    nome: string
    cpf: string
    estado: string
    municipio: string
    tipo_pessoa: 'PF' | 'PJ'
    atividade_principal: string
    atividades_secundarias: string[]
    tempo_atividade_anos: number | null
  }
  propriedade: {
    regime: 'propria' | 'arrendada' | 'parceria'
    area_hectares: number | null
    disponivel_como_garantia: boolean
    impedimento_garantia: string
    matricula_disponivel: boolean | null
    matricula_em_nome_proprio: boolean | null
    car_situacao: 'ativo' | 'pendente' | 'nao_feito'
    ccir_em_dia: boolean | null
    itr_em_dia: boolean | null
  }
  documentacao_pf: {
    cnd_federal: boolean | null
    cnd_estadual: boolean | null
    cnd_municipal: boolean | null
    dispensa_ou_licenca_ambiental: boolean | null
  }
  documentacao_pj: {
    contrato_social_atualizado: boolean | null
    certidao_simplificada_junta: boolean | null
    faturamento_12_meses_documentado: boolean | null
    balanco_dre_disponivel: boolean | null
  }
  financeiro: {
    faturamento_medio_anual: number | null
    faixa_faturamento: FaixaFaturamento
    parcelas_em_atraso: boolean
    credito_rural_ativo: boolean
    saldo_devedor_rural: number | null
  }
  necessidade_credito: {
    valor: number | null
    finalidade: string
    tipo: TipoCredito
    prazo_preferido: string
    banco_preferido: string
    linha_preferida: string
  }
  pendencias: {
    sanitaria: {
      tem_pendencia: boolean
      orgao: string
      descricao: string
    }
    ambiental: {
      tem_pendencia: boolean
      orgao: string
      descricao: string
    }
    judicial: {
      tem_pendencia: boolean
      descricao: string
    }
  }
  alertas: AlertaEntrevista[]
  observacoes_livres: string
}
