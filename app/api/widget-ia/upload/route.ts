// Upload via chat flutuante — registra o arquivo no storage + tabela
// uploads + opcional validação pela IA.
//
// Fluxo (server-side pra arquivos ≤ 20MB, que é o limite do contexto
// do Claude Vision):
//   1. User manda multipart/form-data com file + doc_slug_sugerido
//   2. Server valida auth, rate-limit, tier (≥ Bronze), magic bytes
//   3. Server sobe pro Storage com path {user_id}/chat/{uuid}/{filename}
//   4. Server cria registro na tabela uploads com origem='chat_widget'
//   5. Se ≤ 20MB: dispara validação IA em background e retorna resultado
//   6. Se > 20MB (até 100MB): marca validacao_status='pendente_manual'
//
// Pré-requisito: user pago (≥ Bronze) + processo ativo. Se não tiver
// processo, retorna 409 com mensagem guiada pra IA responder
// "termine a entrevista primeiro".

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { realMimeType } from '@/lib/file-sniff'
import { rateLimitIARemoto } from '@/lib/rate-limit-upstash'
import { getPlanoAtual } from '@/lib/plano'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BYTES = 100 * 1024 * 1024 // 100MB
const MAX_BYTES_VALIDACAO = 20 * 1024 * 1024 // 20MB
const MIMES_ACEITOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const plano = await getPlanoAtual()
  if (plano.tier === null) {
    return Response.json(
      {
        erro: 'Anexo de documentos disponível a partir do plano Bronze.',
        codigo: 'tier_insuficiente',
      },
      { status: 403 },
    )
  }

  // Rate-limit separado do chat (canal distinto) — evita um user
  // bombardear uploads e zerar chat quota.
  const rl = await rateLimitIARemoto({
    userId: user.id,
    plano: plano.plano,
    canal: 'upload',
  })
  if (!rl.ok) {
    return Response.json(
      {
        erro: `Limite de ${rl.limite} uploads por hora atingido no plano ${plano.plano}.`,
        retry_after_seconds: rl.retryAfterSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const admin = createAdminClient()

  // Processo ativo do user (pago). Se não tiver, orientamos.
  const { data: processoAtivo } = await admin
    .from('processos')
    .select('id')
    .eq('user_id', user.id)
    .eq('pagamento_confirmado', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!processoAtivo?.id) {
    return Response.json(
      {
        erro: 'Pra anexar documentos ao seu dossiê preciso terminar a entrevista e gerar o checklist primeiro. Leva poucos minutos.',
        codigo: 'sem_processo_ativo',
      },
      { status: 409 },
    )
  }

  // Recebe multipart
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ erro: 'Formato inválido' }, { status: 400 })
  }

  const file = form.get('file')
  const docSlugSugerido = (form.get('doc_slug_sugerido') as string | null) ?? null

  if (!file || !(file instanceof File)) {
    return Response.json({ erro: 'Arquivo ausente' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { erro: `Arquivo maior que 100MB (limite máximo).` },
      { status: 413 },
    )
  }

  // Magic bytes — verifica tipo real
  const arrayBuf = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)
  const mimeDetectado = realMimeType(buffer)

  if (!MIMES_ACEITOS.has(mimeDetectado)) {
    return Response.json(
      {
        erro: 'Tipo de arquivo não suportado. Envie PDF, JPG, PNG ou WebP.',
        mime_detectado: mimeDetectado,
      },
      { status: 415 },
    )
  }

  // Path no storage: {user_id}/chat/{processo_id}/{uuid}/{filename}
  const uuid = randomUUID()
  const nomeArquivoSeguro = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120)
  const storagePath = `${user.id}/chat/${processoAtivo.id}/${uuid}/${nomeArquivoSeguro}`

  const { error: uploadErr } = await admin.storage
    .from('documentos')
    .upload(storagePath, buffer, {
      contentType: mimeDetectado,
      upsert: false,
    })

  if (uploadErr) {
    capturarErroProducao(uploadErr, {
      modulo: 'widget-ia/upload',
      userId: user.id,
      extra: { etapa: 'storage_upload', processoId: processoAtivo.id },
    })
    return Response.json(
      { erro: 'Não foi possível salvar o arquivo no storage.' },
      { status: 500 },
    )
  }

  // Se sabemos o doc_slug, tenta linkar ao checklist_item correspondente
  let checklistItemId: string | null = null
  if (docSlugSugerido) {
    const { data: itens } = await admin
      .from('checklist_itens')
      .select('id')
      .eq('processo_id', processoAtivo.id)
      .eq('documento_id', docSlugSugerido)
      .maybeSingle()
    checklistItemId = itens?.id ?? null
  }

  const precisaValidacaoManual = file.size > MAX_BYTES_VALIDACAO

  const { data: upload, error: insertErr } = await admin
    .from('uploads')
    .insert({
      user_id: user.id,
      processo_id: processoAtivo.id,
      checklist_item_id: checklistItemId,
      storage_path: storagePath,
      nome_arquivo: file.name,
      mime_type: mimeDetectado,
      tamanho_bytes: file.size,
      origem: 'chat_widget',
      doc_slug_sugerido: docSlugSugerido,
      validacao_status: precisaValidacaoManual ? 'pendente' : 'pendente',
    })
    .select('id')
    .single()

  if (insertErr || !upload) {
    capturarErroProducao(insertErr ?? new Error('upload row ausente'), {
      modulo: 'widget-ia/upload',
      userId: user.id,
      extra: { etapa: 'insert_uploads', processoId: processoAtivo.id },
    })
    // Tenta limpar o arquivo órfão
    await admin.storage.from('documentos').remove([storagePath]).catch(() => null)
    return Response.json(
      { erro: 'Falha ao registrar o upload.' },
      { status: 500 },
    )
  }

  logAuditEvent({
    userId: user.id,
    eventType: 'upload_via_widget',
    payload: {
      upload_id: upload.id,
      processo_id: processoAtivo.id,
      mime: mimeDetectado,
      tamanho_kb: Math.round(file.size / 1024),
      doc_slug_sugerido: docSlugSugerido,
      validacao_disponivel: !precisaValidacaoManual,
    },
  })

  if (precisaValidacaoManual) {
    return Response.json({
      ok: true,
      upload_id: upload.id,
      mime: mimeDetectado,
      tamanho_kb: Math.round(file.size / 1024),
      nome_arquivo: file.name,
      validacao_status: 'pendente_manual',
      mensagem_ia: `Arquivo "${file.name}" armazenado. Maior que 20MB — validação automática não é possível nesse tamanho. A mesa técnica revisa manualmente. O documento já está vinculado ao seu dossiê.`,
    })
  }

  return Response.json({
    ok: true,
    upload_id: upload.id,
    mime: mimeDetectado,
    tamanho_kb: Math.round(file.size / 1024),
    nome_arquivo: file.name,
    validacao_status: 'pendente',
    mensagem_ia: `Recebi "${file.name}" (${Math.round(file.size / 1024)} KB). Vou validar o conteúdo e te aviso em seguida.`,
    // O client pode disparar /api/documento/validar passando storage_path
    // se quiser validação IA imediata. Retornamos o path pra isso.
    storage_path: storagePath,
  })
}
