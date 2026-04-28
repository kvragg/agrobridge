import { describe, it, expect } from 'vitest'
import { simular } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import { simulatorInputSchema } from '@/lib/simulator/schema'
import type { SimulatorInput } from '@/lib/simulator/types'

// ============================================================
// [SIM] Robustez do motor + schema — anti-regressão NaN/lixo
// ============================================================
// Origem: ONDA 1 da auditoria (2026-04-28). Bug latente: payload
// adversarial via /api/simulador/salvar com endividamento_pct
// não-numérico produzia NaN no eixo Capacidade do radar e era
// persistido no jsonb `simulacoes.output`. Schema Zod barra na
// rota; engine normaliza defensivamente como segunda camada.
// ============================================================

function inputBase(over: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    valor_pretendido: 850_000,
    cultura: 'soja',
    finalidade: 'custeio',
    porte: 'medio',
    uf: 'MT',
    garantias: ['hipoteca_1grau'],
    relacao_terra: 'proprio',
    aval_tipo: 'nenhum',
    cadastro_nivel: 'atualizado_incompleto',
    historico_scr: 'limpo',
    endividamento_pct: 35,
    car: 'regular_averbado',
    tem_seguro_agricola: true,
    reciprocidade_bancaria: 'media',
    cpf_cnpj_regular: true,
    imovel_em_inventario: false,
    arrendamento_com_anuencia: true,
    georref_ok: true,
    itr_em_dia: true,
    ir_em_dia: true,
    ...over,
  }
}

describe('Engine — coerção defensiva contra NaN', () => {
  it('endividamento_pct = NaN não propaga pro radar', () => {
    const r = simular(
      inputBase({ endividamento_pct: NaN }),
      CONJUNTURA_ATUAL,
    )
    for (const eixo of r.radar) {
      expect(Number.isFinite(eixo.valor)).toBe(true)
    }
    expect(Number.isFinite(r.score)).toBe(true)
  })

  it('endividamento_pct undefined (forçado) é tratado como 0', () => {
    const r = simular(
      inputBase({ endividamento_pct: undefined as unknown as number }),
      CONJUNTURA_ATUAL,
    )
    expect(Number.isFinite(r.score)).toBe(true)
    for (const eixo of r.radar) {
      expect(Number.isFinite(eixo.valor)).toBe(true)
    }
  })

  it('valor_pretendido inválido vira 0 sem quebrar', () => {
    const r = simular(
      inputBase({ valor_pretendido: 'abc' as unknown as number }),
      CONJUNTURA_ATUAL,
    )
    expect(Number.isFinite(r.score)).toBe(true)
  })

  it('endividamento_pct acima de 200 é clampado', () => {
    const r = simular(
      inputBase({ endividamento_pct: 9999 }),
      CONJUNTURA_ATUAL,
    )
    // Score finito; eixo capacidade vai pro fundo da régua sem explodir.
    expect(Number.isFinite(r.score)).toBe(true)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('renda_bruta_anual = Infinity é tratado como 0', () => {
    const r = simular(
      inputBase({ renda_bruta_anual: Infinity }),
      CONJUNTURA_ATUAL,
    )
    expect(Number.isFinite(r.score)).toBe(true)
  })
})

describe('Schema Zod — payload adversarial barrado na entrada', () => {
  it('aceita input legítimo', () => {
    const r = simulatorInputSchema.safeParse(inputBase())
    expect(r.success).toBe(true)
  })

  it('rejeita endividamento_pct como string', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      endividamento_pct: 'abc',
    })
    expect(r.success).toBe(false)
  })

  it('rejeita endividamento_pct = NaN', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      endividamento_pct: NaN,
    })
    expect(r.success).toBe(false)
  })

  it('rejeita endividamento_pct fora do range 0..200', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      endividamento_pct: 250,
    })
    expect(r.success).toBe(false)
  })

  it('rejeita cultura desconhecida', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      cultura: 'planta_inventada',
    })
    expect(r.success).toBe(false)
  })

  it('rejeita UF mal formada', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      uf: 'mt',
    })
    expect(r.success).toBe(false)
  })

  it('rejeita garantia desconhecida no array', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      garantias: ['hipoteca_1grau', 'token_falso'],
    })
    expect(r.success).toBe(false)
  })

  it('rejeita valor_pretendido = Infinity', () => {
    const r = simulatorInputSchema.safeParse({
      ...inputBase(),
      valor_pretendido: Infinity,
    })
    expect(r.success).toBe(false)
  })
})
