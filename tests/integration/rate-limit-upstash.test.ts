import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// [R1] rate-limit-upstash — fallback e pipeline
// ============================================================
// Garante que:
//  1. Sem env vars UPSTASH_* → usa rateLimit in-memory (mesmo
//     shape de resposta).
//  2. Com env vars → chama pipeline Upstash via fetch. Ok/429
//     baseado em count retornado.
//  3. Falha de rede no pipeline → fallback in-memory com warn.
// ============================================================

const urlOriginal = process.env.UPSTASH_REDIS_REST_URL
const tokenOriginal = process.env.UPSTASH_REDIS_REST_TOKEN

describe('rateLimitRemoto — fallback quando env vars ausentes', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.resetModules()
  })

  afterEach(() => {
    if (urlOriginal) process.env.UPSTASH_REDIS_REST_URL = urlOriginal
    if (tokenOriginal) process.env.UPSTASH_REDIS_REST_TOKEN = tokenOriginal
  })

  it('sem env vars, ok na primeira chamada, 429 na (max+1)ª', async () => {
    const { rateLimitRemoto } = await import('@/lib/rate-limit-upstash')
    const chave = `test:fallback:${Date.now()}`
    const r1 = await rateLimitRemoto(chave, 2, 60_000)
    const r2 = await rateLimitRemoto(chave, 2, 60_000)
    const r3 = await rateLimitRemoto(chave, 2, 60_000)

    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    expect(r3.ok).toBe(false)
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
  })
})

describe('rateLimitRemoto — pipeline Upstash (fetch mockado)', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    vi.resetModules()
  })

  afterEach(() => {
    if (urlOriginal) process.env.UPSTASH_REDIS_REST_URL = urlOriginal
    else delete process.env.UPSTASH_REDIS_REST_URL
    if (tokenOriginal) process.env.UPSTASH_REDIS_REST_TOKEN = tokenOriginal
    else delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.restoreAllMocks()
  })

  it('ok quando count ≤ max', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([{ result: 2 }, { result: 1 }, { result: 45_000 }]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const { rateLimitRemoto } = await import('@/lib/rate-limit-upstash')
    const r = await rateLimitRemoto('chave:x', 5, 60_000)
    expect(r.ok).toBe(true)
    expect(r.remaining).toBe(3) // max=5, count=2 → 3 restantes
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('429 quando count > max, retryAfterSeconds vem do PTTL', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([{ result: 11 }, { result: 0 }, { result: 30_000 }]),
        { status: 200 }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const { rateLimitRemoto } = await import('@/lib/rate-limit-upstash')
    const r = await rateLimitRemoto('chave:y', 10, 60_000)
    expect(r.ok).toBe(false)
    expect(r.retryAfterSeconds).toBe(30) // PTTL=30_000ms → 30s
  })

  it('falha de rede cai pro in-memory', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network down')
    })
    vi.stubGlobal('fetch', fetchMock)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { rateLimitRemoto } = await import('@/lib/rate-limit-upstash')
    const r = await rateLimitRemoto(`chave:fallback:${Date.now()}`, 2, 60_000)

    expect(r.ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })
})
