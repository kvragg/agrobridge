// v1.1 — Frente A: cron diário de lembretes inteligentes.
//
// Disparado pelo Vercel Cron às 09:00 BRT (= 12:00 UTC) via
// `vercel.json`. Vercel injeta header `Authorization: Bearer
// <CRON_SECRET>` — validamos antes de processar.
//
// Pipeline:
//   1. Detecta candidatos por tipo (processo_dormente,
//      dossie_pronto_nao_baixado)
//   2. Pra cada candidato, envia email + persiste log
//   3. Retorna sumário JSON (quantidade enviada, falhas, tempo)
//
// Idempotência: detector já filtra users que receberam lembrete do
// mesmo tipo nos últimos 7 dias. Logger captura toda falha.

import { createAdminClient } from '@/lib/supabase/admin'
import {
  detectarProcessosDormentes,
  detectarDossiesNaoBaixados,
} from '@/lib/lembretes/detector'
import { enviarLembrete } from '@/lib/lembretes/enviador'
import { capturarErroProducao } from '@/lib/logger'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5min — cap teórico, normalmente <30s

export async function GET(request: NextRequest) {
  // Vercel Cron envia: Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return Response.json({ erro: 'não autorizado' }, { status: 401 })
  }

  const t0 = Date.now()
  const admin = createAdminClient()

  let candidatosDormentes: Awaited<
    ReturnType<typeof detectarProcessosDormentes>
  > = []
  let candidatosDossie: Awaited<
    ReturnType<typeof detectarDossiesNaoBaixados>
  > = []

  try {
    candidatosDormentes = await detectarProcessosDormentes(admin)
  } catch (err) {
    capturarErroProducao(err, {
      modulo: 'cron-lembretes',
      extra: { etapa: 'detectar_dormentes' },
    })
  }
  try {
    candidatosDossie = await detectarDossiesNaoBaixados(admin)
  } catch (err) {
    capturarErroProducao(err, {
      modulo: 'cron-lembretes',
      extra: { etapa: 'detectar_dossie_nao_baixado' },
    })
  }

  const todos = [...candidatosDormentes, ...candidatosDossie]
  const resultados = await Promise.all(
    todos.map((c) => enviarLembrete(admin, c)),
  )

  const enviados = resultados.filter((r) => r.ok).length
  const falhas = resultados.filter((r) => !r.ok).length

  return Response.json({
    ok: true,
    duracao_ms: Date.now() - t0,
    detectados: {
      processo_dormente: candidatosDormentes.length,
      dossie_pronto_nao_baixado: candidatosDossie.length,
      total: todos.length,
    },
    enviados,
    falhas,
  })
}
