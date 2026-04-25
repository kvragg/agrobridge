import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizarTexto } from '@/lib/validation'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'

// PATCH /api/conta/perfil-tipo
//   Body: { lead_type: 'pf' | 'pj', cnpj?: string, razao_social?: string }
//
// Troca o tipo do lead. Quando muda pra PF, limpa cnpj/razao_social.
// Quando muda pra PJ, exige cnpj + razao_social.
//
// Self-service. RLS garante isolamento; usamos admin client pra centralizar
// auditoria.

const MAX_OPS = 20
const JANELA_MS = 60 * 60 * 1000

async function sessaoUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

function validarCNPJ(cnpj: unknown): { ok: true; digitos: string } | { ok: false; erro: string } {
  if (typeof cnpj !== 'string') return { ok: false, erro: 'CNPJ inválido.' }
  const digitos = cnpj.replace(/\D/g, '')
  if (digitos.length !== 14) return { ok: false, erro: 'CNPJ deve ter 14 dígitos.' }
  if (/^(\d)\1{13}$/.test(digitos)) return { ok: false, erro: 'CNPJ inválido.' }
  return { ok: true, digitos }
}

export async function PATCH(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const limite = await rateLimitRemoto(`perfil-tipo:${user.id}`, MAX_OPS, JANELA_MS)
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Muitas alterações. Tente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  let body: { lead_type?: unknown; cnpj?: unknown; razao_social?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  if (body.lead_type !== 'pf' && body.lead_type !== 'pj') {
    return NextResponse.json(
      { erro: 'lead_type deve ser "pf" ou "pj".' },
      { status: 400 },
    )
  }

  const update: Record<string, string | null> = { lead_type: body.lead_type }

  if (body.lead_type === 'pj') {
    const v = validarCNPJ(body.cnpj)
    if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 })
    update.cnpj = v.digitos

    const razao = sanitizarTexto(body.razao_social, 200)
    if (razao.length < 3) {
      return NextResponse.json(
        { erro: 'Razão social inválida.' },
        { status: 400 },
      )
    }
    update.razao_social = razao
  } else {
    update.cnpj = null
    update.razao_social = null
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('perfis_lead')
    .update(update)
    .eq('user_id', user.id)

  if (error) {
    capturarErroProducao(error, {
      modulo: 'conta/perfil-tipo',
      userId: user.id,
      extra: { etapa: 'update', lead_type: body.lead_type },
    })
    return NextResponse.json(
      { erro: 'Falha ao salvar. Tente de novo.' },
      { status: 500 },
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: {
      campos_alterados: Object.keys(update),
      novo_lead_type: body.lead_type,
    },
  })

  return NextResponse.json({ ok: true, lead_type: body.lead_type })
}
