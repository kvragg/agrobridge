// Tipo do registro perfis_lead (1:1 com auth.users). Representa o conhecimento
// acumulado da IA AgroBridge sobre cada lead.

export interface PerfilLead {
  user_id: string
  nome: string | null
  cpf: string | null
  telefone: string | null
  estado_uf: string | null
  municipio: string | null
  fazenda_nome: string | null
  fazenda_area_ha: number | null
  cultura_principal: string | null
  finalidade_credito: string | null
  valor_pretendido: number | null
  banco_alvo: string | null
  historico_credito: string | null
  memoria_ia: Record<string, unknown>
  perguntas_respondidas_gratis: number
  mini_analise_gerada_em: string | null
  mini_analise_texto: string | null
  criado_em: string
  atualizado_em: string
  deleted_at: string | null
}

// Campos do perfil que podem ser sobrescritos direto pela extracao de fatos.
// Nao inclui memoria_ia (vai por deep-merge).
export type PerfilLeadCamposDiretos = Pick<
  PerfilLead,
  | 'nome'
  | 'cpf'
  | 'telefone'
  | 'estado_uf'
  | 'municipio'
  | 'fazenda_nome'
  | 'fazenda_area_ha'
  | 'cultura_principal'
  | 'finalidade_credito'
  | 'valor_pretendido'
  | 'banco_alvo'
  | 'historico_credito'
>
