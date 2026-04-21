import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/audit'
import { enviarExportacaoPronta } from '@/lib/email/resend'

export const runtime = 'nodejs'
export const maxDuration = 30

// ============================================================
// GET /api/conta/exportar — Direito de portabilidade (LGPD Art. 18 V)
// ============================================================
// Retorna JSON consolidado com todos os dados do user. Signed URLs
// dos documentos têm TTL de 15 min (tempo suficiente pra download
// mas curto o suficiente pra não vazar se o arquivo ficar em cache
// ou proxy de navegador de terceiros).
//
// Rate limit 1/dia por user — gerar a exportação lê storage e pode
// ser pesado. Suficiente pra LGPD (prazo de 15 dias).
// ============================================================

interface UploadComUrl {
  id: string
  nome_arquivo: string
  mime_type: string
  tamanho_bytes: number
  checklist_item_id: string
  created_at: string
  download_url: string | null
  download_expira_em: string | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // 1/dia por user. Chave inclui user.id para não colidir com IP compartilhado.
  const limite = rateLimit(`conta:exportar:${user.id}`, 1, 24 * 60 * 60 * 1000)
  if (!limite.ok) {
    return Response.json(
      {
        erro: 'Você já gerou uma exportação nas últimas 24 horas. Tente novamente amanhã.',
      },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const admin = createAdminClient()

  // Processos, mensagens, checklist, uploads, compras — todos filtrados
  // por user (admin bypass RLS mas filtro manual garante isolamento).
  const [procRes, msgRes, chkRes, upRes, compRes] = await Promise.all([
    admin
      .from('processos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    admin
      .from('mensagens')
      .select('*, processos!inner(user_id)')
      .eq('processos.user_id', user.id)
      .order('created_at', { ascending: true }),
    admin
      .from('checklist_itens')
      .select('*, processos!inner(user_id)')
      .eq('processos.user_id', user.id)
      .order('created_at', { ascending: true }),
    admin
      .from('uploads')
      .select('id, nome_arquivo, mime_type, tamanho_bytes, checklist_item_id, storage_path, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    admin
      .from('compras')
      .select(
        'id, provider, provider_product_id, tier, status, amount_cents, paid_at, created_at, metadata'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (procRes.error || msgRes.error || chkRes.error || upRes.error || compRes.error) {
    console.error('[api/conta/exportar] falha query', {
      proc: procRes.error?.message,
      msg: msgRes.error?.message,
      chk: chkRes.error?.message,
      up: upRes.error?.message,
      comp: compRes.error?.message,
    })
    return Response.json({ erro: 'Falha ao gerar exportação' }, { status: 500 })
  }

  // Gera signed URLs para cada upload (TTL 15 min)
  const uploadsComUrl: UploadComUrl[] = await Promise.all(
    (upRes.data ?? []).map(async (u) => {
      const { data: signed } = await admin.storage
        .from('documentos')
        .createSignedUrl(u.storage_path, 60 * 15)
      return {
        id: u.id,
        nome_arquivo: u.nome_arquivo,
        mime_type: u.mime_type,
        tamanho_bytes: u.tamanho_bytes,
        checklist_item_id: u.checklist_item_id,
        created_at: u.created_at,
        download_url: signed?.signedUrl ?? null,
        download_expira_em: signed?.signedUrl
          ? new Date(Date.now() + 60 * 15 * 1000).toISOString()
          : null,
      }
    })
  )

  const payload = {
    _metadata: {
      gerado_em: new Date().toISOString(),
      versao_schema: 1,
      base_legal: 'LGPD Art. 18 incisos II (acesso) e V (portabilidade)',
      aviso:
        'Este arquivo contém seus dados pessoais. Guarde em local seguro. Os links dos documentos expiram em 15 minutos — baixe os arquivos antes de fechar.',
    },
    usuario: {
      id: user.id,
      email: user.email,
      criado_em: user.created_at,
      ultimo_login: user.last_sign_in_at,
      metadata: user.user_metadata ?? null,
    },
    processos: procRes.data ?? [],
    mensagens: msgRes.data ?? [],
    checklist_itens: chkRes.data ?? [],
    uploads: uploadsComUrl,
    compras: compRes.data ?? [],
  }

  // Audit event + email de confirmação (fire-and-forget)
  void logAuditEvent({
    userId: user.id,
    eventType: 'conta_exportada',
    request,
    payload: {
      processos: (procRes.data ?? []).length,
      mensagens: (msgRes.data ?? []).length,
      checklist_itens: (chkRes.data ?? []).length,
      uploads: uploadsComUrl.length,
      compras: (compRes.data ?? []).length,
    },
  })

  if (user.email) {
    const nome =
      (typeof user.user_metadata?.nome === 'string' && user.user_metadata.nome) ||
      user.email.split('@')[0]
    void enviarExportacaoPronta({ to: user.email, nome }).catch((err) =>
      console.error('[api/conta/exportar] falha email confirmacao', err)
    )
  }

  const filename = `agrobridge-meus-dados-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      Pragma: 'no-cache',
    },
  })
}
