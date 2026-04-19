import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validarDocumento } from '@/lib/anthropic/validador'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST { processo_id, doc_slug, nome_documento, storage_path }
// → baixa o arquivo do bucket "documentos" e valida com Claude Sonnet.
// Resultado é persistido em perfil_json._validacoes[doc_slug] para evitar recomputo.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    processo_id?: string
    doc_slug?: string
    nome_documento?: string
    storage_path?: string
  }
  const { processo_id, doc_slug, nome_documento, storage_path } = body
  if (!processo_id || !doc_slug || !nome_documento || !storage_path) {
    return Response.json(
      { erro: 'processo_id, doc_slug, nome_documento e storage_path obrigatórios' },
      { status: 400 }
    )
  }

  // Validar ownership: storage_path deve começar com {user.id}/{processo_id}/
  const prefixoEsperado = `${user.id}/${processo_id}/`
  if (!storage_path.startsWith(prefixoEsperado)) {
    return Response.json({ erro: 'Caminho inválido' }, { status: 403 })
  }

  const { data: processo } = await supabase
    .from('processos')
    .select('id, perfil_json, user_id')
    .eq('id', processo_id)
    .single()
  if (!processo || processo.user_id !== user.id) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  // Baixar arquivo
  const { data: fileBlob, error: dlErr } = await supabase.storage
    .from('documentos')
    .download(storage_path)
  if (dlErr || !fileBlob) {
    return Response.json({ erro: 'Arquivo não encontrado no storage' }, { status: 404 })
  }

  // Limite de tamanho para validação (evita estourar contexto do modelo)
  const MAX_BYTES = 8 * 1024 * 1024 // 8MB
  if (fileBlob.size > MAX_BYTES) {
    return Response.json(
      {
        erro: 'Arquivo grande demais para validação automática (>8MB). Envie uma versão reduzida ou prossiga sem validar.',
      },
      { status: 413 }
    )
  }

  const arrayBuf = await fileBlob.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)
  const mimeType = fileBlob.type || 'application/pdf'

  try {
    const resultado = await validarDocumento({
      esperado: nome_documento,
      arquivo: buffer,
      mimeType,
    })

    // Persistir em perfil_json._validacoes[doc_slug]
    const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
    const validacoes =
      (perfilJson._validacoes as Record<string, unknown> | undefined) ?? {}
    const registros = (validacoes[doc_slug] ?? []) as Array<Record<string, unknown>>

    const novoRegistro = {
      ...resultado,
      storage_path,
      validado_em: new Date().toISOString(),
    }

    // Mantém histórico curto (último + 2 anteriores)
    const novoHistorico = [novoRegistro, ...registros].slice(0, 3)

    await supabase
      .from('processos')
      .update({
        perfil_json: {
          ...perfilJson,
          _validacoes: { ...validacoes, [doc_slug]: novoHistorico },
        },
      })
      .eq('id', processo_id)

    return Response.json({ ok: true, resultado })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    console.error('[api/documento/validar]', e.status, e.message)
    const isCredito =
      e.message && /credit|balance|insufficient/i.test(e.message)
    return Response.json(
      {
        erro: isCredito
          ? 'Validação indisponível — saldo da IA esgotado.'
          : 'Falha ao validar documento. Tente novamente.',
      },
      { status: 502 }
    )
  }
}
