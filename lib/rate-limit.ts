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

// ─── Rate-limit por tier (uniformização Sonnet 4.6) ───
// Janela deslizante de 1h. Limites escolhidos por Paulo (2026-04-22).

import type { PlanoComercial } from '@/lib/plano'
import { LIMITES_MENSAGENS_POR_HORA, type TierParaRateLimit } from '@/lib/anthropic/model'

function planoToTier(p: PlanoComercial): TierParaRateLimit {
  if (p === 'Bronze') return 'bronze'
  if (p === 'Prata') return 'prata'
  if (p === 'Ouro') return 'ouro'
  return 'free'
}

const UMA_HORA_MS = 60 * 60 * 1000

/**
 * Aplica rate-limit de mensagens IA baseado no tier comercial do usuário.
 * Chave canônica: `ia:msg:<user_id>`.
 * Limites atuais: Free 10/h · Bronze 25/h · Prata 50/h · Ouro 100/h.
 */
export function rateLimitIA(params: {
  userId: string
  plano: PlanoComercial
  canal?: string // ex: 'chat', 'widget', 'entrevista' — pra separar contadores se quiser
}): ResultadoRateLimit & { tier: TierParaRateLimit; limite: number } {
  const tier = planoToTier(params.plano)
  const limite = LIMITES_MENSAGENS_POR_HORA[tier]
  const canal = params.canal ?? 'msg'
  const resultado = rateLimit(`ia:${canal}:${params.userId}`, limite, UMA_HORA_MS)
  return { ...resultado, tier, limite }
}
