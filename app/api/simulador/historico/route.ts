// GET /api/simulador/historico — lista simulações do user
// DELETE /api/simulador/historico — limpa TODAS (LGPD em /conta/dados)

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cultura = searchParams.get('cultura')

  let query = supabase
    .from('simulacoes')
    .select('id, score, cultura, valor_pretendido, created_at, input, output')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (cultura) {
    query = query.eq('cultura', cultura)
  }

  const { data, error } = await query
  if (error) {
    return Response.json({ erro: 'Falha ao listar' }, { status: 500 })
  }
  return Response.json({ simulacoes: data ?? [] })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { error, count } = await supabase
    .from('simulacoes')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ erro: 'Falha ao excluir' }, { status: 500 })
  }
  return Response.json({ ok: true, removidas: count ?? 0 })
}
