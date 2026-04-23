import 'server-only'
import { rateLimit, rateLimitIA, type ResultadoRateLimit } from './rate-limit'
import type { PlanoComercial } from './plano'
import { LIMITES_MENSAGENS_POR_HORA, type TierParaRateLimit } from './anthropic/model'

// ============================================================
// Rate limit distribuído — Upstash Redis via REST (sem SDK)
// ============================================================
// Fallback automático para o `rateLimit` in-memory quando
// `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` não estão
// definidas — permite ambiente local seguir funcionando sem infra.
//
// Em produção Vercel (múltiplas instâncias, cold starts) o
// in-memory não compartilha contadores — essa função é o caminho
// correto para endpoints críticos (auth, pagamento, exportação,
// exclusão LGPD).
//
// Protocolo usado: pipeline Upstash REST.
//   POST https://<host>/pipeline  (token via Bearer)
//   body = JSON [ ["INCR", key], ["PEXPIRE", key, ms, "NX"] ]
// ============================================================

interface UpstashPipelineItem {
  result?: unknown
  error?: string
}

function envConfigurada(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

async function executarPipeline(
  comandos: unknown[][]
): Promise<UpstashPipelineItem[] | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comandos),
      // Upstash é em região us-east-1 por padrão; dá timeout curto
      // para não segurar o request principal em caso de falha.
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return null
    return (await res.json()) as UpstashPipelineItem[]
  } catch {
    return null
  }
}

// ----------------------------------------------------------------
// rateLimitRemoto — versão async. Use em novas rotas críticas.
//
//   const r = await rateLimitRemoto(`auth:signup:${ip}`, 5, 60_000)
//   if (!r.ok) return 429
//
// Em caso de falha de rede/timeout do Upstash, cai automaticamente
// para `rateLimit` in-memory (best-effort na mesma instância).
// Log warn para observabilidade.
// ----------------------------------------------------------------
export async function rateLimitRemoto(
  chave: string,
  max: number,
  janelaMs: number
): Promise<ResultadoRateLimit> {
  if (!envConfigurada()) {
    return rateLimit(chave, max, janelaMs)
  }

  const resultado = await executarPipeline([
    ['INCR', chave],
    ['PEXPIRE', chave, janelaMs, 'NX'],
    ['PTTL', chave],
  ])
  if (!resultado || resultado.length < 3) {
    console.warn('[rate-limit-upstash] fallback in-memory (falha pipeline)', chave)
    return rateLimit(chave, max, janelaMs)
  }

  const [incrItem, , pttlItem] = resultado
  const count = typeof incrItem.result === 'number' ? incrItem.result : 0
  const pttl = typeof pttlItem.result === 'number' ? pttlItem.result : janelaMs

  if (count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil(pttl / 1000))
    return { ok: false, retryAfterSeconds, remaining: 0 }
  }

  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, max - count),
  }
}

// ----------------------------------------------------------------
// rateLimitIARemoto — versão distribuída do rateLimitIA.
//
// Igual ao sync `rateLimitIA` (lib/rate-limit.ts) mas usando Upstash
// como backend quando configurado. Fallback pra in-memory se as envs
// não existirem (dev local) OU se a pipeline Upstash falhar.
//
// Chave canônica: `ia:<canal>:<user_id>`, janela deslizante 1h.
// Limites (definidos em lib/anthropic/model.ts):
//   Free 10/h · Bronze 25/h · Prata 50/h · Ouro 100/h.
// ----------------------------------------------------------------
const UMA_HORA_MS = 60 * 60 * 1000

function planoParaTier(p: PlanoComercial): TierParaRateLimit {
  if (p === 'Bronze') return 'bronze'
  if (p === 'Prata') return 'prata'
  if (p === 'Ouro') return 'ouro'
  return 'free'
}

export async function rateLimitIARemoto(params: {
  userId: string
  plano: PlanoComercial
  canal?: string
}): Promise<ResultadoRateLimit & { tier: TierParaRateLimit; limite: number }> {
  const tier = planoParaTier(params.plano)
  const limite = LIMITES_MENSAGENS_POR_HORA[tier]
  const canal = params.canal ?? 'msg'

  if (!envConfigurada()) {
    // Dev local / Upstash não configurado — delega pro sync in-memory.
    const sync = rateLimitIA({ userId: params.userId, plano: params.plano, canal })
    return sync
  }

  const resultado = await rateLimitRemoto(`ia:${canal}:${params.userId}`, limite, UMA_HORA_MS)
  return { ...resultado, tier, limite }
}
