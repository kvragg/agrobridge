import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit'
import { capturarErroProducao } from '@/lib/logger'

// DELETE — soft-delete de um processo do próprio user, em cascata
// atomica via RPC `soft_delete_processo` (SECURITY DEFINER).
//
// Fluxo:
//   1) createClient() — confirma auth.getUser() e que o processo
//      pertence ao user (pelo lookup passando por RLS).
//   2) createAdminClient().rpc('soft_delete_processo') — executa
//      cascata em uma transacao atomica (mensagens + checklist_itens
//      + uploads + processos), bypassando RLS para nao cair no bug
//      onde filhos ficam orfaos apos o pai ser soft-deletado.
//   3) audit fire-and-forget.
//
// Idempotente: segundo DELETE retorna 204 mesmo resultado.
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

  // Confirma ownership via RLS (filtra deleted_at IS NULL).
  const { data: procCheck, error: checkErr } = await supabase
    .from('processos')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (checkErr) {
    capturarErroProducao(checkErr, {
      modulo: 'processos/DELETE',
      userId: user.id,
      extra: { etapa: 'ownership_lookup', processoId: id },
    })
    return NextResponse.json(
      { erro: 'Erro ao verificar processo' },
      { status: 500 }
    )
  }

  if (!procCheck) {
    // Inexistente, já excluído ou não é do user — idempotente.
    return new NextResponse(null, { status: 204 })
  }

  // Cascata via RPC admin (única transação, bypassa RLS).
  const admin = createAdminClient()
  const { data: resumo, error: rpcErr } = await admin.rpc(
    'soft_delete_processo',
    {
      p_processo_id: id,
      p_user_id: user.id,
    }
  )

  if (rpcErr) {
    capturarErroProducao(rpcErr, {
      modulo: 'processos/DELETE',
      userId: user.id,
      extra: { etapa: 'rpc_soft_delete', processoId: id },
    })
    return NextResponse.json(
      { erro: 'Erro ao excluir processo' },
      { status: 500 }
    )
  }

  void logAuditEvent({
    userId: user.id,
    eventType: 'processo_excluido',
    targetId: id,
    request,
    payload: {
      resumo: Array.isArray(resumo) ? resumo[0] : resumo,
    },
  })

  return new NextResponse(null, { status: 204 })
}
