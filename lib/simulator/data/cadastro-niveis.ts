// Os 3 níveis de "cadastro AgroBridge" com teto de score por nível.
// Padrão AgroBridge é o pacote completo que a mesa técnica monta —
// é o produto principal pago da plataforma.

export type CadastroNivelId =
  | 'desatualizado'
  | 'atualizado_incompleto'
  | 'padrao_agrobridge'

export interface CadastroNivel {
  id: CadastroNivelId
  nome: string
  /** Teto de score absoluto pra esse nível. */
  teto_score: number
  /** Bonus aplicado direto no score (+0/+0/+15). */
  delta_adicional: number
  requisitos_cumpridos: string[]
  requisitos_faltantes: string[]
  resumo_curto: string
}

export const CADASTRO_NIVEIS: CadastroNivel[] = [
  {
    id: 'desatualizado',
    nome: 'Desatualizado',
    teto_score: 60,
    delta_adicional: 0,
    requisitos_cumpridos: [
      'Você está no banco com cadastro básico',
    ],
    requisitos_faltantes: [
      'CPF/CNPJ sem atualização na Receita Federal',
      'Sem CCIR vigente (último emitido > 1 ano)',
      'IR em atraso ou com pendência',
      'Sem comprovante de atividade rural recente',
      'Sem CAR regular ou com retificação pendente',
    ],
    resumo_curto:
      'Cadastro básico no banco mas com pendências documentais. Comitê pode bloquear antes de analisar mérito.',
  },
  {
    id: 'atualizado_incompleto',
    nome: 'Atualizado incompleto',
    teto_score: 80,
    delta_adicional: 0,
    requisitos_cumpridos: [
      'CPF/CNPJ regular',
      'Algumas certidões válidas',
      'IR em dia',
    ],
    requisitos_faltantes: [
      'Sem CAR regular E ITR dos últimos 5 exercícios',
      'Sem matrícula atualizada (>90 dias) E extrato SCR 24 meses',
      'Sem certidões negativas completas (Federal/Estadual/Municipal/FGTS/Trabalhista)',
    ],
    resumo_curto:
      'Tem o essencial mas falta um documento crítico. Score travado em 80 até completar.',
  },
  {
    id: 'padrao_agrobridge',
    nome: 'Padrão AgroBridge',
    teto_score: 100,
    delta_adicional: 15,
    requisitos_cumpridos: [
      'Todas as certidões negativas completas',
      'CAR regular + ITR + matrícula atualizada',
      'Extrato SCR 24 meses analisado',
      'Laudo técnico-agronômico com ART',
      'Memorial descritivo da operação',
      'Organograma societário (se PJ)',
      'Projeto técnico (se investimento)',
      'CPR modelo AgroBridge (com cláusulas de comitê)',
      'Balanço patrimonial / declaração de bens',
    ],
    requisitos_faltantes: [],
    resumo_curto:
      'Pacote completo da mesa técnica AgroBridge. Score destrava até 100 e bônus +15.',
  },
]

export function getNivelCadastro(id: CadastroNivelId): CadastroNivel | undefined {
  return CADASTRO_NIVEIS.find((n) => n.id === id)
}
