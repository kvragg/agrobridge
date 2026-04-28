// Health check público pra monitoramento externo (UptimeRobot,
// BetterStack, etc.). Sem DB, sem IA, sem auth — só prova que a
// função serverless está viva e respondendo.
//
// Resposta intencionalmente leve:
//   { ok: true, env: "production", commit: "abc1234", ts: "..." }
//
// Não vaza nada sensível. Commit SHA e env já são visíveis em headers
// HTTP do Vercel pra qualquer um que olhe.
//
// ONDA 6 — runtime edge (não nodejs): cold start 30-80ms vs 500ms+.
// UptimeRobot reportava 552ms p50 com nodejs. Edge runtime é compatível
// porque a função não usa fs, crypto.createHash, ou Sentry server SDK.

import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      ts: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        // Garante que CDN/proxy nunca cache health check.
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
