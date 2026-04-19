import { createClient } from '@/lib/supabase/server'
import { gerarDefesa } from '@/lib/anthropic/defesa'
import { montarDossiePDF } from '@/lib/dossie/pdf'
import { enviarDossiePronto } from '@/lib/email/resend'
import type { PerfilEntrevista } from '@/types/entrevista'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Gera (ou regenera) o dossiê em PDF do processo:
 *  1. Chama Sonnet para redigir a defesa técnica (cacheada em perfil_json._defesa_md)
 *  2. Monta o PDF com pdfkit
 *  3. Faz upload ao bucket "documentos" em {user_id}/{processo_id}/dossie.pdf
 *  4. Retorna URL assinada por 1h
 */
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
    forcar?: boolean
  }
  const processoId = body.processo_id
  const forcar = body.forcar === true
  if (!processoId) {
    return Response.json({ erro: 'processo_id obrigatório' }, { status: 400 })
  }

  const { data: processo, error: errProc } = await supabase
    .from('processos')
    .select('id, perfil_json, banco, valor, status')
    .eq('id', processoId)
    .single()

  if (errProc || !processo) {
    return Response.json({ erro: 'Processo não encontrado' }, { status: 404 })
  }

  const perfilJson = (processo.perfil_json as Record<string, unknown> | null) ?? {}
  const perfil = perfilJson as unknown as PerfilEntrevista
  const checklistMd =
    typeof perfilJson._checklist_md === 'string' ? perfilJson._checklist_md : ''

  if (!perfilJson.perfil) {
    return Response.json({ erro: 'Entrevista ainda não concluída' }, { status: 422 })
  }
  if (!checklistMd) {
    return Response.json(
      { erro: 'Checklist ainda não foi gerado para este processo' },
      { status: 422 }
    )
  }

  // 1. Defesa técnica (cacheada)
  let defesaMd =
    typeof perfilJson._defesa_md === 'string' ? perfilJson._defesa_md : ''
  if (!defesaMd || forcar) {
    try {
      defesaMd = await gerarDefesa(perfil)
    } catch (err) {
      const e = err as { status?: number; message?: string }
      console.error('[api/dossie] erro Sonnet defesa', e.status, e.message)
      return Response.json(
        { erro: 'Falha ao gerar defesa técnica. Tente novamente.' },
        { status: 502 }
      )
    }
    await supabase
      .from('processos')
      .update({ perfil_json: { ...perfilJson, _defesa_md: defesaMd } })
      .eq('id', processoId)
  }

  // 2. Listar documentos enviados para anexar ao PDF
  const documentos: { nome: string; tamanho: number; enviado: boolean }[] = []
  const prefixoUser = `${user.id}/${processoId}`
  const { data: arquivosRaiz } = await supabase.storage
    .from('documentos')
    .list(prefixoUser, { limit: 200 })
  if (arquivosRaiz) {
    for (const f of arquivosRaiz) {
      // f pode ser pasta (sem metadata.size) — pular
      if (!f.metadata || !f.metadata.size) continue
      if (f.name === 'dossie.pdf') continue
      documentos.push({
        nome: f.name.replace(/^\d+_/, ''),
        tamanho: f.metadata.size as number,
        enviado: true,
      })
    }
  }
  // Subpastas por slug
  const subpastas = (arquivosRaiz ?? []).filter((f) => !f.metadata)
  for (const pasta of subpastas) {
    const { data: arquivosSub } = await supabase.storage
      .from('documentos')
      .list(`${prefixoUser}/${pasta.name}`, { limit: 50 })
    for (const f of arquivosSub ?? []) {
      if (!f.metadata || !f.metadata.size) continue
      documentos.push({
        nome: `${pasta.name} · ${f.name.replace(/^\d+_/, '')}`,
        tamanho: f.metadata.size as number,
        enviado: true,
      })
    }
  }

  // 3. Montar PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await montarDossiePDF({
      produtor: {
        nome: perfil.perfil?.nome || user.email?.split('@')[0] || 'Produtor',
        cpf: perfil.perfil?.cpf || '',
        email: user.email,
      },
      processoId,
      banco: processo.banco as string | null,
      valor: processo.valor as number | null,
      perfil,
      defesaMd,
      checklistMd,
      documentos,
    })
  } catch (err) {
    console.error('[api/dossie] falha ao montar PDF', err)
    return Response.json({ erro: 'Erro ao montar PDF do dossiê' }, { status: 500 })
  }

  // 4. Upload no storage (upsert para permitir regeração)
  const path = `${user.id}/${processoId}/dossie.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('documentos')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErr) {
    console.error('[api/dossie] upload falhou', uploadErr)
    return Response.json({ erro: 'Falha ao salvar dossiê' }, { status: 500 })
  }

  // Marca status=concluido e guarda timestamp
  await supabase
    .from('processos')
    .update({
      status: 'concluido',
      perfil_json: {
        ...perfilJson,
        _defesa_md: defesaMd,
        _dossie_gerado_em: new Date().toISOString(),
      },
    })
    .eq('id', processoId)

  const { data: signed } = await supabase.storage
    .from('documentos')
    .createSignedUrl(path, 60 * 60)

  // Envia email "dossiê pronto" só na primeira geração (não em regerações forçadas)
  const jaNotificado = typeof perfilJson._dossie_gerado_em === 'string'
  if (!jaNotificado && user.email) {
    const perfilBloco = (perfilJson.perfil ?? {}) as { nome?: string }
    const nome = perfilBloco.nome || user.email.split('@')[0]
    try {
      await enviarDossiePronto({ to: user.email, nome, processoId })
    } catch (err) {
      console.error('[api/dossie] falha email dossiê pronto', err)
    }
  }

  return Response.json({
    url: signed?.signedUrl ?? null,
    gerado_em: new Date().toISOString(),
  })
}
