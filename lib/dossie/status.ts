import type { SupabaseClient } from '@supabase/supabase-js'
import { slugDocumento } from '@/lib/validation'

export interface DocumentoStatus {
  categoria: string
  nome_esperado: string
  doc_slug: string
  enviado: boolean
  storage_path?: string
  validacao?: {
    status: 'ok' | 'atencao' | 'invalido'
    tipo_detectado?: string
    resumo?: string
    pendencias?: string[]
    observacao_banco?: string
    validade?: string
  }
}

export interface ChecklistCompletude {
  total: number
  anexados: number
  pendentes: DocumentoStatus[]
  documentos: DocumentoStatus[]
}

interface ValidacaoRegistro {
  status: 'ok' | 'atencao' | 'invalido'
  tipo_detectado?: string
  resumo?: string
  pendencias?: string[]
  observacao_banco?: string
  validade?: string
  storage_path?: string
  validado_em?: string
}

const CATEGORIAS_NA_HORA = /NA HORA DA OPERA|REGULARIZAR ANTES DE IR AO BANCO/i

export function extrairDocumentosDoChecklist(checklistMd: string): {
  categoria: string
  nome: string
}[] {
  const linhas = checklistMd.split('\n')
  const resultado: { categoria: string; nome: string }[] = []
  let categoria = 'Outros'
  let dentroDeNaHora = false

  for (const bruta of linhas) {
    const l = bruta.trim()
    if (!l) continue

    const h3 = l.match(/^###\s+(.+)$/)
    if (h3) {
      const titulo = h3[1].replace(/^\p{Emoji}\s*/u, '').trim()
      categoria = titulo
      dentroDeNaHora = CATEGORIAS_NA_HORA.test(titulo)
      continue
    }

    if (dentroDeNaHora) continue

    const doc = l.match(/^\*\*([^*]+)\*\*\s*$/)
    if (doc) {
      const nome = doc[1].trim()
      // Heurística: ignora cabeçalhos de bloco como **Produtor:** etc.
      if (nome.endsWith(':')) continue
      resultado.push({ categoria, nome })
    }
  }

  return resultado
}

export async function calcularCompletude({
  supabase,
  userId,
  processoId,
  checklistMd,
  perfilJson,
}: {
  supabase: SupabaseClient
  userId: string
  processoId: string
  checklistMd: string
  perfilJson: Record<string, unknown>
}): Promise<ChecklistCompletude> {
  const docs = extrairDocumentosDoChecklist(checklistMd)
  const validacoesMap =
    (perfilJson._validacoes as Record<string, ValidacaoRegistro[]> | undefined) ?? {}

  const prefixoRaiz = `${userId}/${processoId}`
  const documentos: DocumentoStatus[] = []

  for (const d of docs) {
    const slug = slugDocumento(d.nome)
    const prefixo = `${prefixoRaiz}/${slug}`
    const { data: arquivos } = await supabase.storage
      .from('documentos')
      .list(prefixo, { limit: 5 })

    const primeiro = arquivos?.find((a) => a.metadata && a.metadata.size)
    const enviado = !!primeiro
    const storagePath = enviado ? `${prefixo}/${primeiro.name}` : undefined

    // Validação mais recente para esse storage_path
    const historico = validacoesMap[slug] ?? []
    const registro = historico.find((r) => r.storage_path === storagePath) ?? historico[0]
    const validacao = registro
      ? {
          status: registro.status,
          tipo_detectado: registro.tipo_detectado,
          resumo: registro.resumo,
          pendencias: registro.pendencias,
          observacao_banco: registro.observacao_banco,
          validade: registro.validade,
        }
      : undefined

    documentos.push({
      categoria: d.categoria,
      nome_esperado: d.nome,
      doc_slug: slug,
      enviado,
      storage_path: storagePath,
      validacao: enviado ? validacao : undefined,
    })
  }

  const anexados = documentos.filter((x) => x.enviado).length
  const pendentes = documentos.filter((x) => !x.enviado)

  return {
    total: documentos.length,
    anexados,
    pendentes,
    documentos,
  }
}
