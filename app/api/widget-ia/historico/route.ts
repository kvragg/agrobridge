// Retorna últimas 30 mensagens do chat do usuário — usado pelo widget
// flutuante pra carregar histórico ao abrir.
// Reusa a mesma tabela `mensagens` do /entrevista — chat é único.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const HISTORICO_MAX = 30

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Nao autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('mensagens')
    .select('role, content')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(HISTORICO_MAX)

  if (error) {
    console.error('[widget-ia/historico] erro:', error)
    return Response.json({ erro: 'Falha ao carregar historico' }, { status: 500 })
  }

  const mensagens = (data ?? [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  return Response.json({ mensagens })
}
