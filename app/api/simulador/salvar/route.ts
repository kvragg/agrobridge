// POST /api/simulador/salvar — registra uma simulação na tabela simulacoes.
// Gating: tier ≥ Bronze. RLS protege via auth.uid().

import { createClient } from '@/lib/supabase/server'
import { getPlanoAtual } from '@/lib/plano'
import { simular } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import type { SimulatorInput } from '@/lib/simulator/types'
import { rateLimitRemoto } from '@/lib/rate-limit-upstash'
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

  let body: { input?: SimulatorInput }
  try {
    body = (await request.json()) as { input?: SimulatorInput }
  } catch {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  if (!body.input || typeof body.input.valor_pretendido !== 'number') {
    return Response.json({ erro: 'Input incompleto' }, { status: 400 })
  }

  const output = simular(body.input, CONJUNTURA_ATUAL)

  const { data, error } = await supabase
    .from('simulacoes')
    .insert({
      user_id: user.id,
      input: body.input,
      output,
      score: output.score,
      cultura: body.input.cultura,
      valor_pretendido: body.input.valor_pretendido,
    })
    .select('id, created_at')
    .single()

  if (error || !data) {
    console.error('[simulador/salvar] erro:', error)
    return Response.json({ erro: 'Falha ao salvar' }, { status: 500 })
  }

  return Response.json({
    ok: true,
    id: data.id,
    created_at: data.created_at,
    score: output.score,
  })
}
