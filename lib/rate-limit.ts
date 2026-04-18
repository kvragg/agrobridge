// Rate limiter em memória — best-effort em serverless warm instances.
// Para garantias fortes em produção migrar para Upstash Redis / Supabase.

interface Registro {
  count: number
  resetAt: number
}

const buckets = new Map<string, Registro>()

export interface ResultadoRateLimit {
  ok: boolean
  retryAfterSeconds: number
  remaining: number
}

export function rateLimit(
  chave: string,
  max: number,
  janelaMs: number
): ResultadoRateLimit {
  const agora = Date.now()
  const atual = buckets.get(chave)

  if (!atual || atual.resetAt <= agora) {
    buckets.set(chave, { count: 1, resetAt: agora + janelaMs })
    return { ok: true, retryAfterSeconds: 0, remaining: max - 1 }
  }

  if (atual.count >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((atual.resetAt - agora) / 1000))
    return { ok: false, retryAfterSeconds, remaining: 0 }
  }

  atual.count += 1
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, max - atual.count),
  }
}

// Limpeza periódica de entradas expiradas (evita vazamento em warm instance)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const agora = Date.now()
    for (const [chave, reg] of buckets.entries()) {
      if (reg.resetAt <= agora) buckets.delete(chave)
    }
  }, 60_000).unref?.()
}
