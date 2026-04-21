import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit'

// DELETE — soft-delete de um processo do próprio user.
// Marca `deleted_at=now()` em cascata (processos + mensagens +
// checklist_itens + uploads) via RLS + policies filtrando
// `deleted_at IS NULL`. Idempotente: segundo DELETE retorna 204.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  // RLS já restringe por user_id; mesmo assim filtramos defensivamente.
  const agora = new Date().toISOString()

  const { data: proc, error: procErr } = await supabase
    .from('processos')
    .update({ deleted_at: agora })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (procErr) {
    return NextResponse.json(
      { erro: 'Erro ao excluir processo' },
      { status: 500 }
    )
  }

  if (!proc) {
    // Já excluído ou inexistente — idempotente.
    return new NextResponse(null, { status: 204 })
  }

  // Cascata nas tabelas filhas.
  await Promise.all([
    supabase
      .from('mensagens')
      .update({ deleted_at: agora })
      .eq('processo_id', id)
      .is('deleted_at', null),
    supabase
      .from('checklist_itens')
      .update({ deleted_at: agora })
      .eq('processo_id', id)
      .is('deleted_at', null),
    supabase
      .from('uploads')
      .update({ deleted_at: agora })
      .eq('processo_id', id)
      .is('deleted_at', null),
  ])

  void logAuditEvent({
    userId: user.id,
    eventType: 'processo_excluido',
    targetId: id,
    request,
  })

  return new NextResponse(null, { status: 204 })
}
