import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
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

  return NextResponse.json({ id: processo.id })
}
