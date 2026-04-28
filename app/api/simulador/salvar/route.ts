// POST /api/simulador/salvar — registra uma simulação na tabela simulacoes.
// Gating: tier ≥ Bronze. RLS protege via auth.uid().

import { createClient } from '@/lib/supabase/server'
import { getPlanoAtual } from '@/lib/plano'
import { simular } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import { simulatorInputSchema } from '@/lib/simulator/schema'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
import { capturarErroProducao } from '@/lib/logger'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const plano = await getPlanoAtual()
  if (plano.tier === null) {
    return Response.json(
      { erro: 'Salvar simulações disponível a partir do plano Bronze.' },
      { status: 403 },
    )
  }

  // Rate-limit pra evitar spam de salvar (chave separada do chat)
  const rl = await rateLimitRemoto(`simulador:salvar:${user.id}`, 60, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { erro: 'Muitas simulações salvas — aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { input?: unknown }
  try {
    body = (await request.json()) as { input?: unknown }
  } catch {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  // Validação rigorosa via Zod — barra payloads malformados ou
  // adversariais antes de tocar no engine. Defense-in-depth: o engine
  // já tem normalização defensiva, mas qualquer dado lixo chegando aqui
  // poderia ser persistido no jsonb sem sentido.
  const parsed = simulatorInputSchema.safeParse(body.input)
  if (!parsed.success) {
    return Response.json(
      {
        erro: 'Input inválido',
        detalhes: parsed.error.issues.slice(0, 5).map((i) => ({
          campo: i.path.join('.'),
          motivo: i.message,
        })),
      },
      { status: 400 },
    )
  }
  const input = parsed.data

  const output = simular(input, CONJUNTURA_ATUAL)

  const { data, error } = await supabase
    .from('simulacoes')
    .insert({
      user_id: user.id,
      input,
      output,
      score: output.score,
      cultura: input.cultura,
      valor_pretendido: input.valor_pretendido,
    })
    .select('id, created_at')
    .single()

  if (error || !data) {
    capturarErroProducao(error ?? new Error('simulacao row ausente'), {
      modulo: 'simulador/salvar',
      userId: user.id,
      extra: { etapa: 'insert_simulacoes' },
    })
    return Response.json({ erro: 'Falha ao salvar' }, { status: 500 })
  }

  return Response.json({
    ok: true,
    id: data.id,
    created_at: data.created_at,
    score: output.score,
  })
}
