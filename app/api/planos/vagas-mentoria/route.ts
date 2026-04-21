import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// ============================================================
// GET /api/planos/vagas-mentoria
// ============================================================
// Retorna a contagem de vagas de Mentoria disponíveis no mês
// corrente (UTC). Limite fixo: 6/mês. Consumido por /planos para
// desabilitar o CTA da Mentoria quando não há vagas e pelo dash
// admin (futuro). Auth obrigatória — user precisa estar logado
// para saber se pode comprar.
// ============================================================

interface VagasMentoriaRow {
  limite_mensal: number
  vagas_usadas: number
  vagas_restantes: number
  mes_referencia: string
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('vagas_mentoria_mes_corrente')
    .select('limite_mensal, vagas_usadas, vagas_restantes, mes_referencia')
    .maybeSingle<VagasMentoriaRow>()

  if (error) {
    console.error('[api/planos/vagas-mentoria] falha query view', error.message)
    return Response.json({ erro: 'Falha ao consultar vagas' }, { status: 500 })
  }

  // A view é um SELECT com agregação — sempre retorna 1 linha mesmo
  // com zero compras (COUNT(*) = 0). `maybeSingle` devolve null só
  // em erro; fallback defensivo mesmo assim.
  const vagas = data ?? {
    limite_mensal: 6,
    vagas_usadas: 0,
    vagas_restantes: 6,
    mes_referencia: new Date().toISOString(),
  }

  return Response.json(
    {
      limite_mensal: vagas.limite_mensal,
      vagas_usadas: vagas.vagas_usadas,
      vagas_restantes: vagas.vagas_restantes,
      mes_referencia: vagas.mes_referencia,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
        Pragma: 'no-cache',
      },
    }
  )
}
