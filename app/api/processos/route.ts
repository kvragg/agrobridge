import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { data: processo, error } = await supabase
    .from('processos')
    .insert({ user_id: user.id, status: 'entrevista' })
    .select('id')
    .single()

  if (error || !processo) {
    return NextResponse.json(
      { erro: 'Erro ao criar processo' },
      { status: 500 }
    )
  }

  // Audit (E4): fire-and-forget.
  void logAuditEvent({
    userId: user.id,
    eventType: 'processo_criado',
    targetId: processo.id,
    request,
  })

  return NextResponse.json({ id: processo.id })
}
