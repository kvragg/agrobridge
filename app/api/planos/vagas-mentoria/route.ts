import { createClient } from '@/lib/supabase/server'
import { capturarErroProducao } from '@/lib/logger'

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

  // Graceful degradation (ONDA 6): se a view falhar (Supabase down,
  // RLS bug, view dropada), retornamos vagas conservadoras (limite
  // cheio, todas disponíveis) com flag `degraded:true`. UI da página
  // /planos continua funcional — pior caso o user tenta comprar Ouro
  // mesmo que esteja esgotado, e o webhook recusa via outra camada
  // (compras é fonte-de-verdade, não a view).
  if (error) {
    capturarErroProducao(error, {
      modulo: 'planos/vagas-mentoria',
      userId: user.id,
      extra: { etapa: 'query_view' },
    })
    return Response.json(
      {
        limite_mensal: 6,
        vagas_usadas: 0,
        vagas_restantes: 6,
        mes_referencia: new Date().toISOString(),
        degraded: true,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
          Pragma: 'no-cache',
        },
      },
    )
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
        // Resposta é o mesmo número pra todos os users autenticados, mas
        // marcamos `private` pra não vazar pelo CDN (auth required).
        // 30s reduz QPS pro Supabase em 30x em pico de tráfego /planos
        // sem impacto perceptível (vagas mudam só quando alguém compra).
        'Cache-Control': 'private, max-age=30',
      },
    },
  )
}
