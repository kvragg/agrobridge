import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarNome, sanitizarTexto } from '@/lib/validation'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'

// /api/conta/socios — CRUD de sócios da PJ
//
// GET    → lista sócios do user (ordenados por display_order)
// POST   → cria novo sócio { full_name, cpf, estado_civil }
// PATCH  → atualiza sócio existente { id, ...campos }
// DELETE → soft delete { id } (preserva docs anexados em caso de remoção acidental)
//
// Auth via session. RLS já garante isolamento, mas usamos admin client
// pra centralizar via auditEvent. Self-service: user só mexe nos próprios.

const ESTADO_CIVIL_VALIDOS = [
  'solteiro',
  'casado',
  'uniao_estavel',
  'divorciado',
  'viuvo',
] as const

const MAX_OPS = 30
const JANELA_MS = 60 * 60 * 1000 // 1h
const MAX_SOCIOS = 10 // teto sanidade — empresa rural raramente passa disso

async function sessaoUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

function validarCPF(cpf: unknown): { ok: true; digitos: string } | { ok: false; erro: string } {
  if (typeof cpf !== 'string') return { ok: false, erro: 'CPF inválido.' }
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11) return { ok: false, erro: 'CPF deve ter 11 dígitos.' }
  if (/^(\d)\1{10}$/.test(digitos)) return { ok: false, erro: 'CPF inválido.' }
  return { ok: true, digitos }
}

function validarEstadoCivil(v: unknown): v is (typeof ESTADO_CIVIL_VALIDOS)[number] {
  return typeof v === 'string' && (ESTADO_CIVIL_VALIDOS as readonly string[]).includes(v)
}

export async function GET() {
  const user = await sessaoUsuario()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('perfil_socios')
    .select('id, display_order, full_name, cpf, estado_civil, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) {
    capturarErroProducao(error, {
      modulo: 'conta/socios',
      userId: user.id,
      extra: { op: 'GET' },
    })
    return NextResponse.json({ erro: 'Falha ao carregar sócios.' }, { status: 500 })
  }

  return NextResponse.json({ socios: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const limite = await rateLimitRemoto(`socios:${user.id}`, MAX_OPS, JANELA_MS)
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Muitas alterações. Tente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  let body: { full_name?: unknown; cpf?: unknown; estado_civil?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  const fullName = sanitizarTexto(body.full_name, 100)
  const vNome = validarNome(fullName)
  if (!vNome.ok) return NextResponse.json({ erro: vNome.erro }, { status: 400 })

  const vCpf = validarCPF(body.cpf)
  if (!vCpf.ok) return NextResponse.json({ erro: vCpf.erro }, { status: 400 })

  if (!validarEstadoCivil(body.estado_civil)) {
    return NextResponse.json(
      { erro: 'Estado civil inválido.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  const { count } = await admin
    .from('perfil_socios')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if ((count ?? 0) >= MAX_SOCIOS) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_SOCIOS} sócios por empresa.` },
      { status: 400 },
    )
  }

  // CPF duplicado dentro da mesma empresa? Bloqueia (pegadinha de dedo bobo).
  const { data: dup } = await admin
    .from('perfil_socios')
    .select('id')
    .eq('user_id', user.id)
    .eq('cpf', vCpf.digitos)
    .is('deleted_at', null)
    .maybeSingle()
  if (dup) {
    return NextResponse.json(
      { erro: 'Esse CPF já está cadastrado como sócio.' },
      { status: 409 },
    )
  }

  const proximoOrder = (count ?? 0) + 1

  const { data, error } = await admin
    .from('perfil_socios')
    .insert({
      user_id: user.id,
      display_order: proximoOrder,
      full_name: fullName,
      cpf: vCpf.digitos,
      estado_civil: body.estado_civil,
    })
    .select('id, display_order, full_name, cpf, estado_civil, created_at, updated_at')
    .single()

  if (error || !data) {
    capturarErroProducao(error ?? new Error('insert sem retorno'), {
      modulo: 'conta/socios',
      userId: user.id,
      extra: { op: 'POST' },
    })
    return NextResponse.json({ erro: 'Falha ao salvar sócio.' }, { status: 500 })
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: { campos_alterados: ['perfil_socios'], op: 'create', socio_id: data.id },
  })

  return NextResponse.json({ socio: data })
}

export async function PATCH(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const limite = await rateLimitRemoto(`socios:${user.id}`, MAX_OPS, JANELA_MS)
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Muitas alterações. Tente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  let body: {
    id?: unknown
    full_name?: unknown
    cpf?: unknown
    estado_civil?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 })
  }

  if (typeof body.id !== 'string' || !body.id) {
    return NextResponse.json({ erro: 'ID do sócio é obrigatório.' }, { status: 400 })
  }

  const update: Record<string, string> = {}

  if (body.full_name !== undefined) {
    const fullName = sanitizarTexto(body.full_name, 100)
    const v = validarNome(fullName)
    if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 })
    update.full_name = fullName
  }

  if (body.cpf !== undefined) {
    const v = validarCPF(body.cpf)
    if (!v.ok) return NextResponse.json({ erro: v.erro }, { status: 400 })
    update.cpf = v.digitos
  }

  if (body.estado_civil !== undefined) {
    if (!validarEstadoCivil(body.estado_civil)) {
      return NextResponse.json({ erro: 'Estado civil inválido.' }, { status: 400 })
    }
    update.estado_civil = body.estado_civil
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ erro: 'Nada pra atualizar.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('perfil_socios')
    .update(update)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id, display_order, full_name, cpf, estado_civil, created_at, updated_at')
    .single()

  if (error || !data) {
    capturarErroProducao(error ?? new Error('update sem retorno'), {
      modulo: 'conta/socios',
      userId: user.id,
      extra: { op: 'PATCH', socio_id: body.id },
    })
    return NextResponse.json(
      { erro: 'Sócio não encontrado ou falha ao atualizar.' },
      { status: 404 },
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: {
      campos_alterados: ['perfil_socios'],
      op: 'update',
      socio_id: data.id,
      campos: Object.keys(update),
    },
  })

  return NextResponse.json({ socio: data })
}

export async function DELETE(request: NextRequest) {
  const user = await sessaoUsuario()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const limite = await rateLimitRemoto(`socios:${user.id}`, MAX_OPS, JANELA_MS)
  if (!limite.ok) {
    return NextResponse.json(
      { erro: 'Muitas alterações. Tente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } },
    )
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ erro: 'ID do sócio é obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('perfil_socios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { erro: 'Sócio não encontrado ou já removido.' },
      { status: 404 },
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'perfil_lead_atualizado',
    request,
    payload: { campos_alterados: ['perfil_socios'], op: 'delete', socio_id: id },
  })

  return NextResponse.json({ ok: true })
}
