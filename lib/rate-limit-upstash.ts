import 'server-only'
import { rateLimit, type ResultadoRateLimit } from './rate-limit'

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
