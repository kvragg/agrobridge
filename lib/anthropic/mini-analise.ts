// Server-only — Mini-analise Sonnet para o freemium.
// Disparada quando um lead tier=free atinge 5 perguntas. Persiste em
// perfis_lead.mini_analise_texto como cache (nao regenera).
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import {
  sugerirLinhasPorPerfil,
  comportamentoGenericoParaMiniAnalise,
  documentosCriticosPorPerfil,
  tipoGenericoInstituicao,
  type FinalidadeCredito,
} from '@/lib/mcr'
import type { PerfilLead } from '@/types/perfil-lead'

const SONNET = 'claude-sonnet-4-6' as const

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY nao configurada')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM = `Voce e consultor senior em credito rural no Brasil. Vai escrever uma analise curta (2 a 3 paragrafos, 180-260 palavras) para um lead que ainda nao pagou o AgroBridge.

REGRAS:
- NUNCA cite nome comercial de banco ou cooperativa (nem BB, Sicredi, Caixa, etc.). Use sempre "o banco", "a cooperativa", "o banco alvo", "o credor".
- NAO prometa aprovacao nem negue: "sujeito a analise", "em condicoes favoraveis", "historicamente".
- Tom: pratico, direto, de quem conhece o MCR de verdade. Sem floreios.
- Se nao houver dado confiavel sobre banco ou linha, seja cauteloso e generico.

ESTRUTURA OBRIGATORIA:
1) Paragrafo 1 — Linha de credito sugerida + justificativa em 1 linha + faixa de taxa aproximada 2026 com ressalva.
2) Paragrafo 2 — Comportamento tipico do banco/cooperativa alvo (generico) + 2-3 documentos criticos que o lead precisa preparar.
3) Paragrafo 3 (ou final do 2) — CTA natural: "Pra eu redigir a defesa tecnica e montar o roteiro de comite, escolha um plano abaixo."

Escreva em portugues do Brasil. Numeros com separador: R$ 850.000,00.`

interface ContextoMini {
  nome: string
  fazenda_resumo: string
  cultura: string
  finalidade: FinalidadeCredito | null
  valor: number | null
  linhas_sugeridas: string
  perfil_banco: string
  documentos_criticos: string
}

function montarContexto(perfil: PerfilLead): ContextoMini {
  const linhas = sugerirLinhasPorPerfil({
    valor_pretendido: perfil.valor_pretendido ?? null,
    finalidade: (perfil.finalidade_credito as FinalidadeCredito | null) ?? null,
    estado_uf: perfil.estado_uf ?? null,
  })
  const linhasResumo = linhas.length
    ? linhas
        .map((l) => {
          const taxa = l.taxa_estimada_aa
            ? ` (faixa aprox. ${l.taxa_estimada_aa.min}-${l.taxa_estimada_aa.max}% a.a., sujeito a analise)`
            : ''
          return `- ${l.nome}: ${l.publico_alvo}${taxa}. Nota MCR: ${l.notas_mcr}`
        })
        .join('\n')
    : '(sem linha obvia — sugira cautelosamente uma linha geral de credito rural ou recomende aguardar mais dados)'

  const comp = comportamentoGenericoParaMiniAnalise({
    banco_alvo_livre: perfil.banco_alvo ?? null,
  })
  const perfilBanco = comp
    ? `Tipo: ${tipoGenericoInstituicao(comp.tipo)}. Perfil: ${comp.perfil_generico}. Documentos extras tipicos: ${comp.documentos_extras.join('; ')}. Pontos de atencao: ${comp.pontos_atencao.join('; ')}.`
    : '(nenhum banco alvo informado ainda; comente em termos genericos)'

  const docs = documentosCriticosPorPerfil({
    finalidade: (perfil.finalidade_credito as FinalidadeCredito | null) ?? null,
    valor_pretendido: perfil.valor_pretendido ?? null,
    cultura_principal: perfil.cultura_principal ?? null,
  })
  const docsTxt = docs.map((d) => `- ${d.nome}: ${d.por_que}`).join('\n')

  const fazendaPartes: string[] = []
  if (perfil.fazenda_nome) fazendaPartes.push(perfil.fazenda_nome)
  if (perfil.fazenda_area_ha) fazendaPartes.push(`${perfil.fazenda_area_ha} ha`)
  if (perfil.municipio || perfil.estado_uf) {
    fazendaPartes.push(`em ${perfil.municipio ?? ''}${perfil.municipio && perfil.estado_uf ? '/' : ''}${perfil.estado_uf ?? ''}`)
  }

  return {
    nome: perfil.nome ?? 'produtor(a)',
    fazenda_resumo: fazendaPartes.join(' - ') || 'propriedade ainda nao detalhada',
    cultura: perfil.cultura_principal ?? 'atividade ainda nao detalhada',
    finalidade: (perfil.finalidade_credito as FinalidadeCredito | null) ?? null,
    valor: perfil.valor_pretendido ?? null,
    linhas_sugeridas: linhasResumo,
    perfil_banco: perfilBanco,
    documentos_criticos: docsTxt || '(perfil ainda muito incipiente; peca mais dados antes do checklist completo)',
  }
}

// Gera a mini-analise. Lanca em caso de falha da API — o caller decide
// se trata (em geral: grava indicativo de falha e permite retry).
export async function gerarMiniAnalise(perfil: PerfilLead): Promise<string> {
  const ctx = montarContexto(perfil)

  const user = `Dados do lead ate agora:
- Nome: ${ctx.nome}
- Fazenda: ${ctx.fazenda_resumo}
- Atividade: ${ctx.cultura}
- Finalidade do credito: ${ctx.finalidade ?? 'ainda nao informada'}
- Valor pretendido: ${ctx.valor ? `R$ ${ctx.valor.toLocaleString('pt-BR')}` : 'ainda nao informado'}

Shortlist MCR de linhas candidatas:
${ctx.linhas_sugeridas}

Perfil tipico do credor alvo (generico, sem citar marca):
${ctx.perfil_banco}

Documentos criticos mapeados para o perfil:
${ctx.documentos_criticos}

Escreva a mini-analise agora seguindo a estrutura obrigatoria.`

  const res = await getClient().messages.create({
    model: SONNET,
    max_tokens: 900,
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  })
  const bloco = res.content[0]
  if (!bloco || bloco.type !== 'text') {
    throw new Error('Resposta inesperada do Sonnet')
  }
  return bloco.text.trim()
}
