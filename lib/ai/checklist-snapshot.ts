import 'server-only'

// Snapshot leve do estado do checklist pra IA do chat consumir como
// fonte oficial. Versão otimizada do `calcularCompletude` em
// `lib/dossie/status.ts` — esta lista UMA vez o storage do user
// (1 chamada) em vez de N chamadas por documento.
//
// Use no chat: lead pergunta "o que falta?" / "quais documentos já
// mandei?" — IA responde com lastro factual em vez de inventar.
//
// Não substitui `calcularCompletude` que é usado pelo gate de
// completude do dossiê (precisa do storage_path por doc + última
// validação). Esse aqui é só pra contar e listar nomes.

import type { SupabaseClient } from '@supabase/supabase-js'
import { extrairDocumentosDoChecklist } from '@/lib/dossie/status'
import { slugDocumento } from '@/lib/validation'

export interface ChecklistSnapshot {
  processoId: string
  total: number
  anexados: number
  pendentes: string[] // nomes humanos dos pendentes (max 12)
  validacoesProblematicas: {
    nome: string
    status: 'atencao' | 'invalido'
    resumo: string
  }[]
}

interface ValidacaoRegistro {
  status: 'ok' | 'atencao' | 'invalido'
  resumo?: string
  storage_path?: string
}

// Carrega o processo ativo mais recente do user que tem checklist
// gerado, calcula totais e devolve snapshot pra IA. Retorna null se
// não houver processo com checklist ainda.
export async function snapshotChecklistParaChat(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChecklistSnapshot | null> {
  const { data: processos } = await supabase
    .from('processos')
    .select('id, perfil_json')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)

  const processo = processos?.[0]
  if (!processo) return null

  const perfilJson = (processo.perfil_json ?? {}) as Record<string, unknown>
  const checklistMd =
    typeof perfilJson._checklist_md === 'string' ? perfilJson._checklist_md : ''
  if (!checklistMd) return null

  const docs = extrairDocumentosDoChecklist(checklistMd)
  if (docs.length === 0) return null

  // Lista todos arquivos sob ${userId}/${processoId}/ recursivamente.
  // Storage list não é nativamente recursivo — listamos pastas (1 nível
  // = um por slug) e depois iteramos arquivos. Como geralmente são <50
  // pastas, e a IA não precisa de detalhes por-arquivo, pegamos só os
  // diretórios pra saber QUAIS slugs têm pelo menos 1 arquivo.
  const prefixoRaiz = `${userId}/${processo.id}`
  const { data: pastas } = await supabase.storage
    .from('documentos')
    .list(prefixoRaiz, { limit: 200 })

  const slugsComArquivo = new Set<string>()
  for (const item of pastas ?? []) {
    // No supabase storage, "pastas" aparecem como itens sem id (ou com
    // metadata.size=0). Arquivos têm metadata.size. Aqui tratamos
    // ambos: se for pasta (sem size), o nome é o slug; se for arquivo
    // direto, ignoramos (não esperado nesta hierarquia).
    if (!item.metadata || !item.metadata.size) {
      slugsComArquivo.add(item.name)
    }
  }

  const validacoesMap =
    (perfilJson._validacoes as Record<string, ValidacaoRegistro[]> | undefined) ?? {}

  let anexados = 0
  const pendentes: string[] = []
  const problematicas: ChecklistSnapshot['validacoesProblematicas'] = []

  for (const d of docs) {
    const slug = slugDocumento(d.nome)
    const enviado = slugsComArquivo.has(slug)
    if (enviado) {
      anexados++
      const ultimaValidacao = validacoesMap[slug]?.[0]
      if (
        ultimaValidacao &&
        (ultimaValidacao.status === 'atencao' || ultimaValidacao.status === 'invalido')
      ) {
        problematicas.push({
          nome: d.nome,
          status: ultimaValidacao.status,
          resumo: (ultimaValidacao.resumo ?? '').slice(0, 140),
        })
      }
    } else {
      pendentes.push(d.nome)
    }
  }

  return {
    processoId: processo.id,
    total: docs.length,
    anexados,
    pendentes: pendentes.slice(0, 12),
    validacoesProblematicas: problematicas.slice(0, 6),
  }
}
