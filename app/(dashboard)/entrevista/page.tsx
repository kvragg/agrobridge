import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getPlanoAtual } from '@/lib/plano'
import type { PerfilLead } from '@/types/perfil-lead'
import { ChatClient } from './ChatClient'

export const dynamic = 'force-dynamic'

interface MensagemDb {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default async function EntrevistaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/entrevista')

  const admin = createAdminClient()

  const [{ data: perfilRaw }, { data: historicoRaw }, plano] = await Promise.all([
    admin.from('perfis_lead').select('*').eq('user_id', user.id).maybeSingle(),
    admin
      .from('mensagens')
      .select('role, content, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200),
    getPlanoAtual(),
  ])

  const perfil = (perfilRaw ?? null) as PerfilLead | null
  const historico = (historicoRaw ?? []) as MensagemDb[]

  const isFree = plano.tier === null
  const perguntasUsadas = perfil?.perguntas_respondidas_gratis ?? 0
  const miniAnalise = perfil?.mini_analise_texto ?? null
  const gateAtivo = isFree && perguntasUsadas >= 5

  return (
    <ChatClient
      plano={plano.plano}
      isFree={isFree}
      perguntasUsadas={perguntasUsadas}
      limite={5}
      historicoInicial={historico.map((m) => ({ role: m.role, content: m.content }))}
      miniAnalise={miniAnalise}
      gateAtivo={gateAtivo}
    />
  )
}
