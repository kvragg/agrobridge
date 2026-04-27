import { describe, it, expect, vi } from 'vitest'

// v1.1 — Frente A: smoke test do detector de lembretes.
//
// Foco: validar comportamento não-determinístico delicado — anti-
// duplicate (1 do mesmo tipo a cada 7 dias) e exclusão de tier
// 'diagnostico' (Bronze não tem dossiê).
//
// Cenários complexos (ratio de completude, supabase storage list)
// ficam pra v1.1.1 com infra de mock mais robusta.

vi.mock('@/lib/dossie/status', () => ({
  calcularCompletude: vi.fn(),
  extrairDocumentosDoChecklist: vi.fn(),
}))

vi.mock('@/lib/email/enderecos', () => ({
  getEnderecosUsuario: vi.fn(async () => null),
}))

interface MockQuery {
  select: () => MockQuery
  eq: () => MockQuery
  is: () => MockQuery
  in: () => MockQuery
  lt: () => MockQuery
  gte: () => MockQuery
  limit: (n: number) => MockQuery
  maybeSingle: () => Promise<{ data: unknown }>
  then: (cb: (r: { data: unknown }) => unknown) => Promise<unknown>
}

function criarStubMinimal(opts: {
  processos?: unknown[]
  entregas?: unknown[]
  lembretesRecentes?: boolean
  perfis?: { user_id: string; nome: string }[]
}) {
  const tabelas: Record<string, unknown[]> = {
    processos: opts.processos ?? [],
    dossie_entregas: opts.entregas ?? [],
    lembretes_agendados: opts.lembretesRecentes
      ? [{ id: 'log1', enviado_em: new Date().toISOString() }]
      : [],
    perfis_lead: opts.perfis ?? [],
  }

  function makeQuery(tabela: string): MockQuery {
    const data = tabelas[tabela] ?? []
    const result = { data }
    const q: MockQuery = {
      select: () => q,
      eq: () => q,
      is: () => q,
      in: () => q,
      lt: () => q,
      gte: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: data[0] ?? null }),
      then: (cb) => Promise.resolve(cb(result)),
    }
    return q
  }

  return {
    from: (tabela: string) => makeQuery(tabela),
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({
          data: {
            user: {
              id: 'u1',
              email: 'lead@example.com',
              raw_user_meta_data: { nome: 'João Silva' },
            },
          },
        })),
      },
    },
  } as unknown as Parameters<
    typeof import('@/lib/lembretes/detector').detectarDossiesNaoBaixados
  >[0]
}

describe('[LEMB] detector de dossie_pronto_nao_baixado', () => {
  it('retorna vazio quando não há entregas prontas há >24h', async () => {
    const { detectarDossiesNaoBaixados } = await import(
      '@/lib/lembretes/detector'
    )
    const stub = criarStubMinimal({ entregas: [] })
    const candidatos = await detectarDossiesNaoBaixados(stub)
    expect(candidatos).toEqual([])
  })

  it('inclui entrega elegível como candidato', async () => {
    const { detectarDossiesNaoBaixados } = await import(
      '@/lib/lembretes/detector'
    )
    const ontem = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
    const stub = criarStubMinimal({
      entregas: [
        {
          processo_id: 'p1',
          user_id: 'u1',
          ready_at: ontem,
          tier_snapshot: 'dossie',
        },
      ],
    })
    const candidatos = await detectarDossiesNaoBaixados(stub)
    expect(candidatos.length).toBe(1)
    expect(candidatos[0]?.tipo).toBe('dossie_pronto_nao_baixado')
    expect(candidatos[0]?.contexto.tier).toBe('dossie')
  })

  it('exclui se já enviou lembrete do mesmo tipo nos últimos 7d', async () => {
    const { detectarDossiesNaoBaixados } = await import(
      '@/lib/lembretes/detector'
    )
    const ontem = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
    const stub = criarStubMinimal({
      entregas: [
        {
          processo_id: 'p1',
          user_id: 'u1',
          ready_at: ontem,
          tier_snapshot: 'dossie',
        },
      ],
      lembretesRecentes: true,
    })
    const candidatos = await detectarDossiesNaoBaixados(stub)
    expect(candidatos).toEqual([])
  })

  it('exclui Bronze (diagnostico) — Bronze não tem dossiê', async () => {
    const { detectarDossiesNaoBaixados } = await import(
      '@/lib/lembretes/detector'
    )
    const ontem = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
    const stub = criarStubMinimal({
      entregas: [
        {
          processo_id: 'p1',
          user_id: 'u1',
          ready_at: ontem,
          tier_snapshot: 'diagnostico',
        },
      ],
    })
    const candidatos = await detectarDossiesNaoBaixados(stub)
    expect(candidatos).toEqual([])
  })
})
