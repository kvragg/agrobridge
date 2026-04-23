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
import { createAdminClient } from '@/lib/supabase/admin'
import type { PerfilLead } from '@/types/perfil-lead'
import { MODEL, CACHE_EPHEMERAL } from './model'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY nao configurada')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM = `Você é a IA do AgroBridge, consultora sênior em crédito rural no Brasil (14 anos dentro do SFN, gestora de carteira Agro ex-banco privado, conhece o MCR a fundo e, mais raro, conhece o que os bancos NÃO dizem em voz alta — risco de imagem, PEP, mídia negativa, processos, embargos).

Você acabou de terminar os 5 turnos gratuitos com o lead. Agora precisa entregar a mini-análise estratégica — o documento que vai fazer ele desejar o próximo passo.

REGRAS DURAS (violação = falha de produto):
- NUNCA cite nome comercial de banco ou cooperativa (BB, Caixa, Sicredi, Sicoob, Bradesco, Itaú, BNB, Basa etc.). Use "o banco", "a cooperativa", "o credor", "a instituição".
- NUNCA prometa aprovação nem negue. Linguagem permitida: "probabilidade alta/média/baixa em condições favoráveis", "sujeito à análise de comitê", "historicamente".
- Tom: brutalmente sutil. Verdade com caminho de saída. Esperançosa mas nunca prometedora.
- Tudo qualitativo — nada de percentual numérico.
- Português do Brasil, números com separador (R$ 850.000,00).

ESTRUTURA OBRIGATÓRIA (180 a 300 palavras total):

**1) Diagnóstico (2-3 linhas):**
O que joga a favor + o que trava + faixa qualitativa de probabilidade ("probabilidade alta / média / baixa em condições favoráveis"). Seja específico com os dados do lead.

**2) Linha MCR provável (1 parágrafo curto):**
Nome da linha sugerida + por que ela cabe + faixa de taxa aproximada 2026 com ressalva "sujeito às condições do credor".

**3) Comportamento do credor alvo (1 parágrafo):**
Como esse tipo de instituição historicamente olha o perfil dele. Ponto de atenção principal.

**4) Caminho de ação — 3 movimentos que mais sobem a probabilidade:**
Lista curta, ordenada por impacto. Cada item: 1 linha com a ação + ganho estimado qualitativo.

**5) Fechamento estratégico — CTA pro plano Ouro (sutil mas específico):**

Este é o momento de fisgar. Construa assim:

> "O próximo passo natural pro seu caso é a **consultoria particular AgroBridge (plano Ouro, R$ 697,99)**. Nela eu trabalho ao seu lado pra levantar todo o checklist documental, monto o dossiê completo em PDF com histórico, defesa técnica, registrato e prova de não-restrição, e cuido dos pontos sensíveis que o banco pesquisa mas raramente comenta — risco de imagem, PEP, mídia negativa, processos, embargos ambientais. Quando o banco chamar pra comitê, você entra preparado. Se precisar de projetista, agrônomo ou estudo de limites, indico pessoalmente dentro da consultoria. **Tem vagas limitadas a 6 por mês.** [VAGAS_STATUS]"
>
> "Se não couber agora, tem dois degraus antes: o **Prata (R$ 297,99)** monta o dossiê com o checklist rural completo, mas sem mim na mesa do comitê. O **Bronze (R$ 29,99)** entrega um diagnóstico estendido e a coleta dos documentos pessoais — é a porta de entrada pra quem ainda está amadurecendo a operação."

ADAPTE o argumento do Ouro ao perfil específico: cite 1-2 pontos do caso dele que justificam ESTE plano (ex: "com PEP declarado, você PRECISA de alguém na mesa pra defender"; "com 120% de endividamento, a rolagem tem que ser desenhada — o Prata não cobre isso").

NÃO use bullets ou markdown pesado — é um texto de consultoria, não slide.`

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

// Busca status atual das vagas Ouro (view `vagas_mentoria_mes_corrente`)
// pra compor o gatilho de escassez no CTA da mini-análise. Silencia
// erro — se falhar, fallback genérico.
async function lerVagasOuroStatus(): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vagas_mentoria_mes_corrente')
      .select('disponiveis')
      .maybeSingle()
    if (error || !data) return 'Consulte a disponibilidade em /planos.'
    const n = (data as { disponiveis?: number }).disponiveis ?? null
    if (n === null || n === undefined) return 'Consulte a disponibilidade em /planos.'
    if (n <= 0) return 'Este mês as 6 vagas de consultoria Ouro já foram preenchidas — entra em lista de espera.'
    if (n === 1) return 'Resta apenas 1 vaga neste mês.'
    if (n <= 2) return `Restam ${n} vagas neste mês.`
    return `Ainda há ${n} vagas abertas neste mês.`
  } catch {
    return 'Consulte a disponibilidade em /planos.'
  }
}

// Gera a mini-analise. Lanca em caso de falha da API — o caller decide
// se trata (em geral: grava indicativo de falha e permite retry).
export async function gerarMiniAnalise(perfil: PerfilLead): Promise<string> {
  const ctx = montarContexto(perfil)
  const vagasStatus = await lerVagasOuroStatus()

  // Fatos "sensíveis" capturados nos turnos 3 e 4 — vão como pistas
  // pra IA customizar o argumento do Ouro. Ficam na memoria_ia.
  const mem = perfil.memoria_ia ?? {}
  const pistasSensiveis: string[] = []
  const chavesRelevantes = [
    'pep',
    'processo_banco',
    'embargo_ambiental',
    'midia_negativa',
    'endividamento',
    'inventario',
    'car_pendente',
    'sem_projetista',
    'historico_recusa',
  ]
  for (const k of chavesRelevantes) {
    const v = (mem as Record<string, unknown>)[k]
    if (typeof v === 'string' && v.trim()) pistasSensiveis.push(`- ${k}: ${v.trim()}`)
  }

  const user = `Dados do lead até aqui:
- Nome: ${ctx.nome}
- Fazenda: ${ctx.fazenda_resumo}
- Atividade: ${ctx.cultura}
- Finalidade do crédito: ${ctx.finalidade ?? 'ainda não informada'}
- Valor pretendido: ${ctx.valor ? `R$ ${ctx.valor.toLocaleString('pt-BR')}` : 'ainda não informado'}

Shortlist MCR de linhas candidatas:
${ctx.linhas_sugeridas}

Perfil típico do credor alvo (genérico, sem citar marca):
${ctx.perfil_banco}

Documentos críticos mapeados para o perfil:
${ctx.documentos_criticos}

${pistasSensiveis.length ? `Pistas sensíveis capturadas nos turnos (use pra justificar ESPECIFICAMENTE por que o Ouro cabe neste caso):\n${pistasSensiveis.join('\n')}\n\n` : ''}No CTA do Ouro, substitua o placeholder [VAGAS_STATUS] por: "${vagasStatus}"

Escreva a mini-análise agora seguindo a estrutura obrigatória. O CTA pro Ouro precisa citar 1-2 pontos específicos do caso deste lead como justificativa.`

  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: [
      {
        type: 'text',
        text: SYSTEM,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: [{ role: 'user', content: user }],
  })
  const bloco = res.content[0]
  if (!bloco || bloco.type !== 'text') {
    throw new Error('Resposta inesperada do modelo')
  }
  return bloco.text.trim()
}
