import { describe, expect, it } from 'vitest'
import { simular } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import type { SimulatorInput } from '@/lib/simulator/types'

// Cenário neutro base — nada bom nem ruim. Usado como referência.
function inputNeutro(): SimulatorInput {
  return {
    valor_pretendido: 500_000,
    cultura: 'soja',
    finalidade: 'custeio',
    porte: 'medio',
    uf: 'MT',
    garantias: [],
    relacao_terra: 'proprio',
    aval_tipo: 'nenhum',
    cadastro_nivel: 'atualizado_incompleto',
    historico_scr: 'primeira_operacao',
    endividamento_pct: 40,
    car: 'inscrito_pendente',
    tem_seguro_agricola: false,
    reciprocidade_bancaria: 'media',
    cpf_cnpj_regular: true,
    imovel_em_inventario: false,
    itr_em_dia: true,
    ir_em_dia: true,
  }
}

describe('Simulator engine', () => {
  it('cenário neutro (cadastro incompleto, sem garantia, primeira operação) → score baixo a médio', () => {
    const r = simular(inputNeutro(), CONJUNTURA_ATUAL)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    // Com soja (+5), próprio (+8), reciprocidade média (+4), cadastro
    // incompleto (0), CAR pendente (-4), primeira op (-3) = base 50 +
    // ajustes pequenos. Esperado: faixa baixa-média.
    expect(['baixa', 'media']).toContain(r.faixa)
  })

  it('soja + hipoteca 1º grau + cadastro padrão + SCR limpo + reciprocidade forte → score alto (>85)', () => {
    const r = simular(
      {
        ...inputNeutro(),
        garantias: ['hipoteca_1grau'],
        cadastro_nivel: 'padrao_agrobridge',
        historico_scr: 'limpo',
        car: 'regular_averbado',
        tem_seguro_agricola: true,
        reciprocidade_bancaria: 'forte',
      },
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeGreaterThan(85)
    expect(r.faixa).toBe('muito_alta')
  })

  it('100% arrendatário sem aval → score baixo + aviso crítico', () => {
    const r = simular(
      {
        ...inputNeutro(),
        relacao_terra: 'totalmente_arrendado',
        aval_tipo: 'nenhum',
      },
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeLessThan(50)
    const temCritico = r.avisos.some((a) => a.tipo === 'critico')
    expect(temCritico).toBe(true)
  })

  it('100% arrendatário + aval amplo → score médio + aviso "chance moderada"', () => {
    const r = simular(
      {
        ...inputNeutro(),
        relacao_terra: 'totalmente_arrendado',
        aval_tipo: 'amplo_amparo_patrimonial',
      },
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeGreaterThan(30)
    const temAvisoModerada = r.avisos.some((a) =>
      a.texto.toLowerCase().includes('moderada'),
    )
    expect(temAvisoModerada).toBe(true)
  })

  it('cadastro desatualizado nunca passa de 60 (teto)', () => {
    const r = simular(
      {
        ...inputNeutro(),
        cadastro_nivel: 'desatualizado',
        garantias: ['alienacao_fiduciaria_guarda_chuva', 'cessao_creditorios_aaa'],
        historico_scr: 'limpo',
        car: 'regular_averbado',
        tem_seguro_agricola: true,
        reciprocidade_bancaria: 'forte',
      },
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeLessThanOrEqual(60)
    expect(r.teto_por_cadastro).toBe(60)
  })

  it('CAR ausente vira regra dura — penaliza mas não bloqueia', () => {
    const r = simular(
      {
        ...inputNeutro(),
        car: 'nao_tem',
      },
      CONJUNTURA_ATUAL,
    )
    expect(r.regras_duras_violadas.length).toBeGreaterThan(0)
    // Score puxa pra baixo mas sigo com result válido
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('conjuntura atual penaliza penhor sem seguro além do delta isolado', () => {
    const semConjuntura = simular(
      {
        ...inputNeutro(),
        garantias: ['penhor_safra_sem_seguro'],
      },
      { ...CONJUNTURA_ATUAL, modificadores: {} },
    )
    const comConjuntura = simular(
      {
        ...inputNeutro(),
        garantias: ['penhor_safra_sem_seguro'],
      },
      CONJUNTURA_ATUAL,
    )
    expect(comConjuntura.score).toBeLessThan(semConjuntura.score)
  })

  it('combinação de 2 garantias premium dá +5 (sem guarda-chuva)', () => {
    // Cenário com headroom — sem reciprocidade, sem seguro, com endividamento
    // moderado pra evitar bater no teto e poder medir o efeito do combo
    const base = {
      ...inputNeutro(),
      cadastro_nivel: 'padrao_agrobridge' as const,
      reciprocidade_bancaria: 'nenhuma' as const,
      endividamento_pct: 70,
    }
    const comCombo = simular(
      { ...base, garantias: ['hipoteca_1grau', 'fianca_bancaria'] },
      CONJUNTURA_ATUAL,
    )
    // Verifica que existe o delta de combo isolado nos deltas aplicados
    const combo = comCombo.deltas_aplicados.find(
      (d) => d.fator === 'combo_garantias_premium',
    )
    expect(combo?.delta).toBe(5)
  })

  it('combinação com guarda-chuva dá +8 em vez de +5', () => {
    const r = simular(
      {
        ...inputNeutro(),
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'hipoteca_1grau',
        ],
      },
      CONJUNTURA_ATUAL,
    )
    const combo = r.deltas_aplicados.find(
      (d) => d.fator === 'combo_garantias_premium',
    )
    expect(combo?.delta).toBe(8)
  })

  it('endividamento >100% puxa score pra baixo significativamente', () => {
    const baixo = simular(
      { ...inputNeutro(), endividamento_pct: 10 },
      CONJUNTURA_ATUAL,
    )
    const alto = simular(
      { ...inputNeutro(), endividamento_pct: 130 },
      CONJUNTURA_ATUAL,
    )
    expect(alto.score).toBeLessThan(baixo.score - 10)
  })

  it('radar sempre tem 6 eixos com valores entre 0 e 100', () => {
    const r = simular(inputNeutro(), CONJUNTURA_ATUAL)
    expect(r.radar).toHaveLength(6)
    for (const eixo of r.radar) {
      expect(eixo.valor).toBeGreaterThanOrEqual(0)
      expect(eixo.valor).toBeLessThanOrEqual(100)
    }
  })

  it('plano de subida nunca tem mais de 4 ações e está ordenado por impacto', () => {
    const r = simular(inputNeutro(), CONJUNTURA_ATUAL)
    expect(r.plano_de_subida.length).toBeLessThanOrEqual(4)
    if (r.plano_de_subida.length >= 2) {
      const a = r.plano_de_subida[0]
      const b = r.plano_de_subida[1]
      expect(
        a.ganho_estimado / a.prazo_dias,
      ).toBeGreaterThanOrEqual(b.ganho_estimado / b.prazo_dias)
    }
  })

  it('score muito alto (>=85) não retorna plano de subida', () => {
    const r = simular(
      {
        ...inputNeutro(),
        garantias: ['alienacao_fiduciaria_guarda_chuva'],
        cadastro_nivel: 'padrao_agrobridge',
        historico_scr: 'limpo',
        car: 'regular_averbado',
        tem_seguro_agricola: true,
        reciprocidade_bancaria: 'forte',
      },
      CONJUNTURA_ATUAL,
    )
    if (r.score >= 85) {
      expect(r.plano_de_subida).toHaveLength(0)
    }
  })
})
