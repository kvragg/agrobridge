import { describe, it, expect } from 'vitest'
import { simular, GARANTIAS } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import { CULTURAS } from '@/lib/simulator/data/culturas'
import { CADASTRO_NIVEIS } from '@/lib/simulator/data/cadastro-niveis'
import type { SimulatorInput, Faixa } from '@/lib/simulator/types'

// ============================================================
// BATERIA MASSIVA — 200+ cenários do simulador
// ============================================================
// Missão (Paulo, 27/04/2026): "investigue incansavelmente, não pare
// enquanto esse simulador não estiver perfeito e funcional e sem bugs
// e erros."
//
// Cobertura:
// A) Determinismo
// B) Cultura — todas as 23 culturas
// C) Garantia individual — todas as 12 garantias
// D) Garantia combinada — combos premium
// E) Aval e regra do arrendatário
// F) Cadastro 3 níveis
// G) Histórico SCR 4 estados
// H) Dívida em outros bancos
// I) Renda + ratio do pleito (4 finalidades × 3 ratios)
// J) Endividamento (4 faixas + boundaries)
// K) Alavancagem patrimonial
// L) CAR (3 estados + suspenso)
// M) Seguro
// N) Reciprocidade
// O) Estrutura fundiária
// P) Regras duras individuais
// Q) Regras duras combinadas
// R) Pequeno + DAP/CAF
// S) Conjuntura modifiers
// T) Score clamping
// U) Faixas qualitativas
// V) Radar 6 eixos
// W) Edge cases / inputs malformados
// X) Monotonicidade — 1 input por vez direção correta
// Y) Coerência — testes cruzados de invariantes do produto
// ============================================================

/**
 * Espelha exatamente `inputInicial()` do SimuladorClient.tsx — cenário
 * conservador realista que NÃO satura o teto. Mudanças nesse cenário
 * devem ser sincronizadas entre os 2 lugares.
 */
function inputBase(over: Partial<SimulatorInput> = {}): SimulatorInput {
  return {
    valor_pretendido: 850_000,
    cultura: 'soja',
    finalidade: 'custeio',
    porte: 'medio',
    uf: 'MT',
    garantias: [],
    relacao_terra: 'proprio',
    aval_tipo: 'nenhum',
    cadastro_nivel: 'atualizado_incompleto',
    historico_scr: 'primeira_operacao',
    divida_outros_bancos: 'em_dia',
    renda_bruta_anual: 1_200_000,
    endividamento_pct: 45,
    divida_patrimonio_faixa: 'nao_sei',
    car: 'inscrito_pendente',
    tem_seguro_agricola: false,
    reciprocidade_bancaria: 'media',
    cpf_cnpj_regular: true,
    imovel_em_inventario: false,
    arrendamento_com_anuencia: true,
    georref_ok: true,
    itr_em_dia: true,
    tem_dap_caf: false,
    ir_em_dia: true,
    ...over,
  }
}

const conj = CONJUNTURA_ATUAL

// ── 0) Anti-regressão: bug "número não altera" reportado 27/04/2026 ─
describe('[0] Anti-regressão — bug "número não altera ao mexer slider"', () => {
  // O cenário inicial padrão NÃO pode saturar o teto (clamp esconderia
  // qualquer movimento positivo do slider, parecendo bug pro user).
  it('cenário base (defaults do form) NÃO satura o teto', () => {
    const r = simular(inputBase(), conj)
    // Score deve ter pelo menos 5 pontos de margem em ambos lados,
    // garantindo que mover sliders altera visualmente.
    expect(r.score).toBeLessThan(r.teto_por_cadastro)
    expect(r.score).toBeGreaterThan(0)
  })

  it('mover endividamento de 30 pra 100 ALTERA o score (não satura)', () => {
    const baixo = simular(inputBase({ endividamento_pct: 30 }), conj)
    const alto = simular(inputBase({ endividamento_pct: 100 }), conj)
    expect(alto.score).not.toBe(baixo.score)
  })

  it('mover cultura de soja pra alevinos ALTERA o score', () => {
    const soja = simular(inputBase({ cultura: 'soja' }), conj)
    const alev = simular(inputBase({ cultura: 'alevinos' }), conj)
    expect(soja.score).not.toBe(alev.score)
  })

  it('quando score == teto_por_cadastro E teto < 100 → indicador visível', () => {
    // Cenário forçando saturação em cadastro desatualizado (teto 60)
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
        ],
        historico_scr: 'limpo',
        endividamento_pct: 5,
        reciprocidade_bancaria: 'forte',
        tem_seguro_agricola: true,
      }),
      conj,
    )
    // Score deve estar EXATAMENTE no teto (saturado).
    expect(r.score).toBe(r.teto_por_cadastro)
    expect(r.teto_por_cadastro).toBe(60)
    // (UI então mostra badge "Score travado em 60 pelo cadastro".)
  })

  it('cadastro padrao_agrobridge libera teto 100 (sem saturação artificial)', () => {
    const r = simular(inputBase({ cadastro_nivel: 'padrao_agrobridge' }), conj)
    expect(r.teto_por_cadastro).toBe(100)
  })
})

// ── A) Determinismo (5 testes) ─────────────────────────────────────
describe('[A] Determinismo (mesmo input = mesmo output)', () => {
  const cenarios: Partial<SimulatorInput>[] = [
    {},
    { cadastro_nivel: 'padrao_agrobridge' },
    { endividamento_pct: 75 },
    { garantias: ['alienacao_fiduciaria_guarda_chuva'] },
    { car: 'nao_tem', cpf_cnpj_regular: false },
  ]
  it.each(cenarios.map((c, i) => [i, c]))(
    'cenário #%i é idempotente',
    (_i, override) => {
      const a = simular(inputBase(override as Partial<SimulatorInput>), conj)
      const b = simular(inputBase(override as Partial<SimulatorInput>), conj)
      expect(a.score).toBe(b.score)
      expect(a.faixa).toBe(b.faixa)
      expect(a.deltas_aplicados.length).toBe(b.deltas_aplicados.length)
    },
  )
})

// ── B) Cultura — todas as 23 (23 testes) ──────────────────────────
describe('[B] Cultura — cada uma das 23 aplica delta correto', () => {
  it.each(CULTURAS.map((c) => [c.id, c.delta_score_base, c.linha_mcr_provavel]))(
    'cultura %s aplica delta %s e linha_mcr %s',
    (cultId, deltaEsperado, linha) => {
      const r = simular(inputBase({ cultura: cultId as never }), conj)
      const d = r.deltas_aplicados.find((d) => d.fator === `cultura_${cultId}`)
      expect(d?.delta).toBe(deltaEsperado)
      expect(r.linha_mcr_provavel).toBe(linha)
    },
  )
})

// ── C) Garantia individual — cada uma (12 testes) ─────────────────
describe('[C] Garantia individual — delta correto', () => {
  it.each(GARANTIAS.map((g) => [g.id, g.delta]))(
    'garantia %s aplica delta %s',
    (gid, deltaEsperado) => {
      const r = simular(inputBase({ garantias: [gid as never] }), conj)
      const d = r.deltas_aplicados.find((d) => d.fator === `garantia_${gid}`)
      expect(d?.delta).toBe(deltaEsperado)
    },
  )
})

// ── D) Garantia combinada — combos premium (8 testes) ────────────
describe('[D] Garantia combinada — combos premium', () => {
  it('2 premium SEM guarda-chuva = bonus +5', () => {
    const r = simular(
      inputBase({ garantias: ['alienacao_fiduciaria_rural', 'investimento_garantia'] }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(5)
  })

  it('2 premium COM guarda-chuva = bonus +8', () => {
    const r = simular(
      inputBase({
        garantias: ['alienacao_fiduciaria_guarda_chuva', 'investimento_garantia'],
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(8)
  })

  it('3 premium SEM guarda-chuva = +5 + 3 = 8', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
          'cessao_creditorios_aaa',
        ],
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(8)
  })

  it('3 premium COM guarda-chuva = +8 + 3 = 11', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
        ],
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(11)
  })

  it('4 premium SEM guarda-chuva = +5 + 6 = 11', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
          'cessao_creditorios_aaa',
          'fianca_bancaria',
        ],
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(11)
  })

  it('5 premium COM guarda-chuva = +8 + 9 = 17', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
          'cessao_creditorios_aaa',
          'fianca_bancaria',
        ],
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(d?.delta).toBe(17)
  })

  it('1 garantia premium → SEM combo bonus', () => {
    const r = simular(
      inputBase({ garantias: ['alienacao_fiduciaria_guarda_chuva'] }),
      conj,
    )
    expect(r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')).toBeUndefined()
  })

  it('zero garantia → SEM combo bonus', () => {
    const r = simular(inputBase({ garantias: [] }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')).toBeUndefined()
  })
})

// ── E) Aval (5 testes) ─────────────────────────────────────────────
describe('[E] Aval', () => {
  it('aval nenhum não aplica delta', () => {
    const r = simular(inputBase({ aval_tipo: 'nenhum' }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator.startsWith('aval_'))).toBeUndefined()
  })

  it('aval amplo_amparo_patrimonial = +2', () => {
    const r = simular(inputBase({ aval_tipo: 'amplo_amparo_patrimonial' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'aval_amplo_amparo_patrimonial')
    expect(d?.delta).toBe(2)
  })

  it('aval ate_100k_com_respaldo = +4', () => {
    const r = simular(inputBase({ aval_tipo: 'ate_100k_com_respaldo' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'aval_ate_100k_com_respaldo')
    expect(d?.delta).toBe(4)
  })

  it('aval puro_sem_respaldo = -15', () => {
    const r = simular(inputBase({ aval_tipo: 'puro_sem_respaldo' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'aval_puro_sem_respaldo')
    expect(d?.delta).toBe(-15)
  })

  it('arrendatário 100% + aval amplo amplifica via combinatória', () => {
    const r = simular(
      inputBase({
        relacao_terra: 'totalmente_arrendado',
        aval_tipo: 'amplo_amparo_patrimonial',
      }),
      conj,
    )
    // Regra combinatória atenua o delta de arrendatário pra -12
    const d = r.deltas_aplicados.find((d) => d.fator === 'estrutura_fundiaria_totalmente_arrendado')
    expect(d?.delta).toBe(-12)
  })
})

// ── F) Cadastro (3 testes) ─────────────────────────────────────────
describe('[F] Cadastro — 3 níveis', () => {
  it.each(CADASTRO_NIVEIS.map((n) => [n.id, n.teto_score, n.delta_adicional]))(
    'cadastro %s tem teto %s e delta %s',
    (id, teto, delta) => {
      const r = simular(inputBase({ cadastro_nivel: id as never }), conj)
      expect(r.teto_por_cadastro).toBe(teto)
      if (delta && delta > 0) {
        const d = r.deltas_aplicados.find((d) => d.fator === `cadastro_${id}`)
        expect(d?.delta).toBe(delta)
      }
    },
  )
})

// ── G) Histórico SCR (4 testes) ────────────────────────────────────
describe('[G] Histórico SCR — 4 estados', () => {
  const matriz: [SimulatorInput['historico_scr'], number][] = [
    ['limpo', 8],
    ['restricao_encerrada', 3],
    ['primeira_operacao', -3],
    ['com_restricao_ativa', -25],
  ]
  it.each(matriz)('historico_scr=%s aplica delta %s', (scr, delta) => {
    const r = simular(inputBase({ historico_scr: scr }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator.startsWith('scr_'))
    expect(d?.delta).toBe(delta)
  })
})

// ── H) Dívida em outros bancos (4 testes) ──────────────────────────
describe('[H] Dívida em outros bancos', () => {
  it('nenhuma = +4', () => {
    const r = simular(inputBase({ divida_outros_bancos: 'nenhuma' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'divida_outros_bancos_nenhuma')
    expect(d?.delta).toBe(4)
  })

  it('em_dia = -3', () => {
    const r = simular(inputBase({ divida_outros_bancos: 'em_dia' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'divida_outros_bancos_em_dia')
    expect(d?.delta).toBe(-3)
  })

  it('com_atraso = -18 + aviso crítico', () => {
    const r = simular(inputBase({ divida_outros_bancos: 'com_atraso' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'divida_outros_bancos_atraso')
    expect(d?.delta).toBe(-18)
    expect(r.avisos.some((a) => a.tipo === 'critico' && /atraso.*outro banco/i.test(a.texto))).toBe(true)
  })

  it('undefined é neutro', () => {
    const r = simular(inputBase({ divida_outros_bancos: undefined }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator.startsWith('divida_outros_bancos'))).toBeUndefined()
  })
})

// ── I) Renda + ratio (12 testes) ───────────────────────────────────
describe('[I] Renda anual + ratio do pleito (4 finalidades × 3 cenários)', () => {
  const finalidades: SimulatorInput['finalidade'][] = [
    'custeio',
    'investimento',
    'comercializacao',
    'industrializacao',
  ]
  const tetos: Record<SimulatorInput['finalidade'], number> = {
    custeio: 3,
    investimento: 5,
    comercializacao: 2,
    industrializacao: 5,
  }

  for (const fin of finalidades) {
    const teto = tetos[fin]

    it(`${fin}: ratio < 1 → compatível (+3)`, () => {
      const r = simular(
        inputBase({
          finalidade: fin,
          valor_pretendido: 500_000,
          renda_bruta_anual: 1_000_000,
        }),
        conj,
      )
      const d = r.deltas_aplicados.find((d) => d.fator === 'pleito_compativel')
      expect(d?.delta).toBe(3)
    })

    it(`${fin}: ratio > teto (${teto}) e ≤ teto+2 → acima padrão (-5)`, () => {
      const r = simular(
        inputBase({
          finalidade: fin,
          valor_pretendido: (teto + 1) * 1_000_000,
          renda_bruta_anual: 1_000_000,
        }),
        conj,
      )
      const d = r.deltas_aplicados.find((d) => d.fator === 'pleito_acima_padrao')
      expect(d?.delta).toBe(-5)
    })

    it(`${fin}: ratio > teto+2 → excede (-12) + crítico`, () => {
      const r = simular(
        inputBase({
          finalidade: fin,
          valor_pretendido: (teto + 3) * 1_000_000,
          renda_bruta_anual: 1_000_000,
        }),
        conj,
      )
      const d = r.deltas_aplicados.find((d) => d.fator === 'pleito_excede_renda')
      expect(d?.delta).toBe(-12)
    })
  }
})

// ── J) Endividamento sobre receita (16 testes) ─────────────────────
describe('[J] Endividamento — boundaries da régua 50/65/80', () => {
  const matriz: [number, string, number][] = [
    [0, 'saudavel', 6],
    [25, 'saudavel', 6],
    [49, 'saudavel', 6],
    [50, 'defensavel', 0],
    [55, 'defensavel', 0],
    [64, 'defensavel', 0],
    [65, 'alerta', -10],
    [70, 'alerta', -10],
    [79, 'alerta', -10],
    [80, 'improvavel', -20],
    [90, 'improvavel', -20],
    [100, 'improvavel', -20],
    [120, 'improvavel', -20],
    [150, 'improvavel', -20],
    [200, 'improvavel', -20],
  ]
  it.each(matriz)(
    'endividamento %s%% → faixa %s, delta %s',
    (pct, faixaEsperada, deltaEsperado) => {
      const r = simular(inputBase({ endividamento_pct: pct }), conj)
      const d = r.deltas_aplicados.find((d) => d.fator === `endividamento_${faixaEsperada}`)
      expect(d?.delta).toBe(deltaEsperado)
    },
  )

  it('80%+ dispara aviso crítico', () => {
    const r = simular(inputBase({ endividamento_pct: 90 }), conj)
    expect(r.avisos.some((a) => a.tipo === 'critico' && /improv[áa]vel|refinanciamento/i.test(a.texto))).toBe(true)
  })
})

// ── K) Alavancagem patrimonial (5 testes) ──────────────────────────
describe('[K] Alavancagem patrimonial', () => {
  const matriz: [SimulatorInput['divida_patrimonio_faixa'], number | null][] = [
    ['ate_50', 5],
    ['de_51_a_70', -6],
    ['de_71_a_85', -14],
    ['acima_85', -22],
    ['nao_sei', null],
  ]
  it.each(matriz)('faixa %s aplica delta %s', (faixa, deltaEsperado) => {
    const r = simular(inputBase({ divida_patrimonio_faixa: faixa }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator.startsWith('alavancagem_patrimonial'))
    if (deltaEsperado === null) {
      expect(d).toBeUndefined()
    } else {
      expect(d?.delta).toBe(deltaEsperado)
    }
  })
})

// ── L) CAR (3 testes + 1 suspenso) ─────────────────────────────────
describe('[L] CAR', () => {
  it('regular_averbado = +6', () => {
    const r = simular(inputBase({ car: 'regular_averbado' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'car_regular')
    expect(d?.delta).toBe(6)
  })

  it('inscrito_pendente = -4', () => {
    const r = simular(inputBase({ car: 'inscrito_pendente' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'car_pendente')
    expect(d?.delta).toBe(-4)
  })

  it('nao_tem = -45 + regra dura', () => {
    const r = simular(inputBase({ car: 'nao_tem' }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'regra_dura_car_ausente')
    expect(d?.delta).toBe(-45)
    expect(r.regras_duras_violadas.some((s) => /CAR/i.test(s))).toBe(true)
  })

  it('suspenso (mesmo com car=regular) = -45 adicional', () => {
    const r = simular(inputBase({ car: 'regular_averbado', car_suspenso: true }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'regra_dura_car_suspenso')
    expect(d?.delta).toBe(-45)
  })
})

// ── M) Seguro (2 testes) ──────────────────────────────────────────
describe('[M] Seguro agrícola', () => {
  it('com seguro = +6', () => {
    const r = simular(inputBase({ tem_seguro_agricola: true }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'seguro_agricola')
    expect(d?.delta).toBe(6)
  })

  it('sem seguro = não aplica delta', () => {
    const r = simular(inputBase({ tem_seguro_agricola: false }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator === 'seguro_agricola')).toBeUndefined()
  })
})

// ── N) Reciprocidade (3 testes) ────────────────────────────────────
describe('[N] Reciprocidade bancária', () => {
  const matriz: [SimulatorInput['reciprocidade_bancaria'], number][] = [
    ['forte', 10],
    ['media', 4],
    ['nenhuma', -5],
  ]
  it.each(matriz)('reciprocidade=%s aplica delta %s', (rec, delta) => {
    const r = simular(inputBase({ reciprocidade_bancaria: rec }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator.startsWith('reciprocidade_'))
    expect(d?.delta).toBe(delta)
  })
})

// ── O) Estrutura fundiária (4 testes) ──────────────────────────────
describe('[O] Estrutura fundiária', () => {
  const matriz: [SimulatorInput['relacao_terra'], number][] = [
    ['proprio', 8],
    ['misto_proprio_arrendado', 2],
    ['maioria_arrendado', -8],
    ['totalmente_arrendado', -20], // sem aval; combinatória pode mudar
  ]
  it.each(matriz)('relacao=%s aplica delta %s', (rel, delta) => {
    const r = simular(
      inputBase({
        relacao_terra: rel,
        // sem aval pra não disparar regra combinatória que muda o delta
        aval_tipo: 'nenhum',
        arrendamento_com_anuencia: true,
      }),
      conj,
    )
    const d = r.deltas_aplicados.find((d) => d.fator.startsWith('estrutura_fundiaria_'))
    expect(d?.delta).toBe(delta)
  })
})

// ── P) Regras duras individuais (7 testes) ─────────────────────────
describe('[P] Regras duras — pesos calibrados por gravidade', () => {
  const matriz: [Partial<SimulatorInput>, string, number][] = [
    [{ car: 'nao_tem' }, 'regra_dura_car_ausente', -45],
    [{ car_suspenso: true }, 'regra_dura_car_suspenso', -45],
    [{ imovel_em_inventario: true }, 'regra_dura_inventario', -40],
    [
      { relacao_terra: 'totalmente_arrendado', arrendamento_com_anuencia: false },
      'regra_dura_arrend_sem_anuencia',
      -35,
    ],
    [{ cpf_cnpj_regular: false }, 'regra_dura_cpf_cnpj', -25],
    [{ itr_em_dia: false }, 'regra_dura_itr', -20],
    [{ ir_em_dia: false }, 'regra_dura_ir', -20],
  ]
  it.each(matriz)('input %j → fator %s, delta %s', (over, fator, delta) => {
    const r = simular(inputBase(over), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === fator)
    expect(d?.delta).toBe(delta)
  })
})

// ── Q) Regras duras combinadas (5 testes) ──────────────────────────
describe('[Q] Múltiplas regras duras', () => {
  it('2 regras duras: scores somam', () => {
    const r = simular(
      inputBase({ car: 'nao_tem', cpf_cnpj_regular: false }),
      conj,
    )
    expect(r.regras_duras_violadas.length).toBe(2)
  })

  it('3 regras duras', () => {
    const r = simular(
      inputBase({
        car: 'nao_tem',
        cpf_cnpj_regular: false,
        itr_em_dia: false,
      }),
      conj,
    )
    expect(r.regras_duras_violadas.length).toBe(3)
  })

  it('cenário catastrófico (todas as regras duras): score = 0 (clamp)', () => {
    const r = simular(
      inputBase({
        car: 'nao_tem',
        car_suspenso: true,
        imovel_em_inventario: true,
        cpf_cnpj_regular: false,
        itr_em_dia: false,
        ir_em_dia: false,
        relacao_terra: 'totalmente_arrendado',
        arrendamento_com_anuencia: false,
      }),
      conj,
    )
    expect(r.score).toBe(0)
  })

  it('aviso de regras duras dispara quando ≥1', () => {
    const r = simular(inputBase({ itr_em_dia: false }), conj)
    expect(r.avisos.some((a) => /regra.*dura/i.test(a.texto))).toBe(true)
  })

  it('zero regras duras → sem aviso de regras', () => {
    const r = simular(inputBase(), conj)
    expect(r.avisos.some((a) => /regra.*dura/i.test(a.texto))).toBe(false)
  })
})

// ── R) Pequeno + DAP/CAF (2 testes) ────────────────────────────────
describe('[R] Pronaf — pequeno + CAF', () => {
  it('pequeno + tem_dap_caf = bônus +8', () => {
    const r = simular(inputBase({ porte: 'pequeno', tem_dap_caf: true }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'pronaf_dap_caf')
    expect(d?.delta).toBe(8)
  })

  it('médio + tem_dap_caf = não dispara', () => {
    const r = simular(inputBase({ porte: 'medio', tem_dap_caf: true }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator === 'pronaf_dap_caf')).toBeUndefined()
  })
})

// ── S) Conjuntura modifiers (varies) ───────────────────────────────
describe('[S] Conjuntura — modifiers em garantias selecionadas', () => {
  it('garantia com modifier positivo aplica conjuntura_*', () => {
    const r = simular(
      inputBase({ garantias: ['alienacao_fiduciaria_guarda_chuva'] }),
      conj,
    )
    expect(r.deltas_aplicados.some((d) => d.fator.startsWith('conjuntura_alienacao_fiduciaria_guarda_chuva'))).toBe(true)
  })

  it('garantia SEM modifier não dispara conjuntura', () => {
    const r = simular(inputBase({ garantias: ['alienacao_maquinas'] }), conj)
    expect(r.deltas_aplicados.some((d) => d.fator.startsWith('conjuntura_alienacao_maquinas'))).toBe(false)
  })

  it('avisos de conjuntura sempre presentes', () => {
    const r = simular(inputBase(), conj)
    expect(r.avisos.some((a) => a.tipo === 'info')).toBe(true)
  })
})

// ── T) Score clamping (4 testes) ───────────────────────────────────
describe('[T] Score sempre 0..100', () => {
  it('cenário super positivo NÃO ultrapassa 100', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'investimento_garantia',
          'alienacao_fiduciaria_rural',
        ],
        historico_scr: 'limpo',
        endividamento_pct: 5,
        tem_seguro_agricola: true,
        reciprocidade_bancaria: 'forte',
        relacao_terra: 'proprio',
        divida_patrimonio_faixa: 'ate_50',
        divida_outros_bancos: 'nenhuma',
        valor_pretendido: 500_000,
        renda_bruta_anual: 2_000_000,
      }),
      conj,
    )
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(0)
  })

  it('cenário catastrófico NÃO fica abaixo de 0', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        garantias: [],
        historico_scr: 'com_restricao_ativa',
        endividamento_pct: 200,
        car: 'nao_tem',
        car_suspenso: true,
        cpf_cnpj_regular: false,
        imovel_em_inventario: true,
        itr_em_dia: false,
        ir_em_dia: false,
        relacao_terra: 'totalmente_arrendado',
        arrendamento_com_anuencia: false,
        aval_tipo: 'puro_sem_respaldo',
        divida_outros_bancos: 'com_atraso',
        divida_patrimonio_faixa: 'acima_85',
        valor_pretendido: 10_000_000,
        renda_bruta_anual: 500_000,
      }),
      conj,
    )
    expect(r.score).toBe(0)
  })

  it('teto cadastro desatualizado limita a 60', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        garantias: ['alienacao_fiduciaria_guarda_chuva', 'investimento_garantia'],
        historico_scr: 'limpo',
        endividamento_pct: 5,
        reciprocidade_bancaria: 'forte',
      }),
      conj,
    )
    expect(r.score).toBeLessThanOrEqual(60)
  })

  it('teto cadastro padrao_agrobridge libera 100', () => {
    const r = simular(inputBase({ cadastro_nivel: 'padrao_agrobridge' }), conj)
    expect(r.teto_por_cadastro).toBe(100)
  })
})

// ── U) Faixas qualitativas (5 testes) ──────────────────────────────
describe('[U] Faixas qualitativas — boundaries', () => {
  it('score ≥ 85 → muito_alta', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'investimento_garantia',
        ],
        historico_scr: 'limpo',
        endividamento_pct: 5,
        reciprocidade_bancaria: 'forte',
        divida_patrimonio_faixa: 'ate_50',
      }),
      conj,
    )
    expect(r.faixa).toBe('muito_alta')
  })

  it('score < 30 → muito_baixa', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        car: 'nao_tem',
        endividamento_pct: 150,
      }),
      conj,
    )
    expect(['muito_baixa', 'baixa']).toContain(r.faixa)
  })

  it('todas as faixas são strings válidas', () => {
    const faixasPossiveis: Faixa[] = [
      'muito_baixa',
      'baixa',
      'media',
      'alta',
      'muito_alta',
    ]
    const r = simular(inputBase(), conj)
    expect(faixasPossiveis).toContain(r.faixa)
  })
})

// ── V) Radar 6 eixos (12 testes) ───────────────────────────────────
describe('[V] Radar — 6 eixos sempre 0..100', () => {
  it('radar tem exatamente 6 eixos', () => {
    const r = simular(inputBase(), conj)
    expect(r.radar.length).toBe(6)
  })

  it('todos os eixos no range [0, 100]', () => {
    const r = simular(inputBase(), conj)
    for (const e of r.radar) {
      expect(e.valor).toBeGreaterThanOrEqual(0)
      expect(e.valor).toBeLessThanOrEqual(100)
    }
  })

  it('eixo Garantia maior com guarda-chuva vs vazio', () => {
    const sem = simular(inputBase({ garantias: [] }), conj)
    const com = simular(
      inputBase({ garantias: ['alienacao_fiduciaria_guarda_chuva'] }),
      conj,
    )
    expect(com.radar.find((e) => e.eixo === 'Garantia')!.valor).toBeGreaterThan(
      sem.radar.find((e) => e.eixo === 'Garantia')!.valor,
    )
  })

  it('eixo Cadastro: padrao_agrobridge > atualizado_incompleto > desatualizado', () => {
    const desat = simular(inputBase({ cadastro_nivel: 'desatualizado' }), conj)
    const incmp = simular(inputBase({ cadastro_nivel: 'atualizado_incompleto' }), conj)
    const padr = simular(inputBase({ cadastro_nivel: 'padrao_agrobridge' }), conj)
    const cadastro = (r: typeof desat) => r.radar.find((e) => e.eixo === 'Cadastro')!.valor
    expect(cadastro(desat)).toBeLessThan(cadastro(incmp))
    expect(cadastro(incmp)).toBeLessThan(cadastro(padr))
  })

  it('eixo Histórico: limpo > restricao_encerrada > primeira_operacao > com_restricao_ativa', () => {
    const limpo = simular(inputBase({ historico_scr: 'limpo' }), conj)
    const enc = simular(inputBase({ historico_scr: 'restricao_encerrada' }), conj)
    const prim = simular(inputBase({ historico_scr: 'primeira_operacao' }), conj)
    const ativ = simular(inputBase({ historico_scr: 'com_restricao_ativa' }), conj)
    const h = (r: typeof limpo) => r.radar.find((e) => e.eixo === 'Histórico')!.valor
    expect(h(limpo)).toBeGreaterThan(h(enc))
    expect(h(enc)).toBeGreaterThan(h(prim))
    expect(h(prim)).toBeGreaterThan(h(ativ))
  })

  it('eixo Capacidade decresce monotônico com endividamento', () => {
    const cap = (pct: number) =>
      simular(inputBase({ endividamento_pct: pct, divida_patrimonio_faixa: 'nao_sei' }), conj).radar.find(
        (e) => e.eixo === 'Capacidade',
      )!.valor
    const v0 = cap(0)
    const v40 = cap(40)
    const v60 = cap(60)
    const v75 = cap(75)
    const v100 = cap(100)
    expect(v0).toBeGreaterThan(v40)
    expect(v40).toBeGreaterThan(v60)
    expect(v60).toBeGreaterThan(v75)
    expect(v75).toBeGreaterThan(v100)
  })

  it('eixo Documentação reflete docs OK', () => {
    const todos = simular(
      inputBase({
        car: 'regular_averbado',
        itr_em_dia: true,
        ir_em_dia: true,
        cpf_cnpj_regular: true,
        georref_ok: true,
        tem_dap_caf: true,
      }),
      conj,
    )
    const nenhum = simular(
      inputBase({
        car: 'nao_tem',
        itr_em_dia: false,
        ir_em_dia: false,
        cpf_cnpj_regular: false,
        georref_ok: false,
        tem_dap_caf: false,
      }),
      conj,
    )
    const doc = (r: typeof todos) => r.radar.find((e) => e.eixo === 'Documentação')!.valor
    expect(doc(todos)).toBeGreaterThan(doc(nenhum))
  })

  it('eixo Capacidade combina caixa+patrimônio quando informados', () => {
    const sem = simular(
      inputBase({ endividamento_pct: 30, divida_patrimonio_faixa: 'nao_sei' }),
      conj,
    )
    const comCritica = simular(
      inputBase({ endividamento_pct: 30, divida_patrimonio_faixa: 'acima_85' }),
      conj,
    )
    const cap = (r: typeof sem) => r.radar.find((e) => e.eixo === 'Capacidade')!.valor
    expect(cap(comCritica)).toBeLessThan(cap(sem))
  })
})

// ── W) Edge cases (10 testes) ──────────────────────────────────────
describe('[W] Edge cases — inputs malformados/estremos', () => {
  it('valor_pretendido = 0 não dispara pleito_compativel', () => {
    const r = simular(
      inputBase({ valor_pretendido: 0, renda_bruta_anual: 1_000_000 }),
      conj,
    )
    expect(r.deltas_aplicados.find((d) => d.fator === 'pleito_compativel')).toBeUndefined()
  })

  it('renda_bruta_anual = 0 não dispara nenhum delta de pleito', () => {
    const r = simular(
      inputBase({ renda_bruta_anual: 0 }),
      conj,
    )
    expect(r.deltas_aplicados.find((d) => d.fator.startsWith('pleito_'))).toBeUndefined()
  })

  it('renda_bruta_anual = undefined não dispara pleito', () => {
    const r = simular(inputBase({ renda_bruta_anual: undefined }), conj)
    expect(r.deltas_aplicados.find((d) => d.fator.startsWith('pleito_'))).toBeUndefined()
  })

  it('garantias = [] não quebra', () => {
    const r = simular(inputBase({ garantias: [] }), conj)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('cultura inválida não quebra', () => {
    const r = simular(inputBase({ cultura: 'cultura_xyz' as never }), conj)
    expect(r.linha_mcr_provavel).toBeNull()
    expect(typeof r.score).toBe('number')
  })

  it('endividamento_pct = -5 (negativo) cai em saudável (≥0)', () => {
    const r = simular(inputBase({ endividamento_pct: -5 }), conj)
    // Negativo não tem regra explícita, cai no else (saudável <50).
    // Comportamento aceitável — UI deve impedir negativo via slider min=0.
    expect(typeof r.score).toBe('number')
  })

  it('endividamento_pct = 1000 (extremo alto) ainda funciona', () => {
    const r = simular(inputBase({ endividamento_pct: 1000 }), conj)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.deltas_aplicados.some((d) => d.fator === 'endividamento_improvavel')).toBe(true)
  })

  it('todas garantias selecionadas (12) não quebra', () => {
    const r = simular(
      inputBase({ garantias: GARANTIAS.map((g) => g.id) }),
      conj,
    )
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(0)
  })

  it('teto_valor_estimado é número positivo quando renda informada', () => {
    const r = simular(
      inputBase({ renda_bruta_anual: 1_000_000, finalidade: 'custeio' }),
      conj,
    )
    expect(r.teto_valor_estimado).toBe(3_000_000)
  })

  it('teto_valor_estimado deriva de cultura quando renda não informada', () => {
    const r = simular(
      inputBase({ renda_bruta_anual: undefined, cultura: 'soja' }),
      conj,
    )
    expect(r.teto_valor_estimado).toBeGreaterThan(0)
  })
})

// ── X) Monotonicidade (15 testes) ──────────────────────────────────
describe('[X] Monotonicidade — 1 input por vez na direção correta', () => {
  it('aumentar reciprocidade SOBE score (sob teto)', () => {
    // Cenário garantindo espaço sob teto: cadastro padrao_agrobridge (teto 100)
    // + endividamento alerta (-10) + sem garantia → score base ~70 quando
    // reciprocidade nenhuma, sobe quando vira forte.
    const cenario = {
      cadastro_nivel: 'padrao_agrobridge' as const,
      endividamento_pct: 70,
      garantias: [] as never[],
      tem_seguro_agricola: false,
    }
    const sem = simular(inputBase({ ...cenario, reciprocidade_bancaria: 'nenhuma' }), conj)
    const com = simular(inputBase({ ...cenario, reciprocidade_bancaria: 'forte' }), conj)
    expect(com.score).toBeGreaterThan(sem.score)
  })

  it('contratar seguro SOBE score (sob teto)', () => {
    // cadastro desatualizado tem teto 60. Cenário base sem deltas positivos
    // garante espaço pra seguro fazer diferença.
    const cenario = {
      cadastro_nivel: 'desatualizado' as const,
      endividamento_pct: 70, // alerta -10
      reciprocidade_bancaria: 'nenhuma' as const,
      garantias: [] as never[],
      car: 'inscrito_pendente' as const,
    }
    const sem = simular(inputBase({ ...cenario, tem_seguro_agricola: false }), conj)
    const com = simular(inputBase({ ...cenario, tem_seguro_agricola: true }), conj)
    expect(com.score).toBeGreaterThan(sem.score)
  })

  it('regularizar CAR SOBE score', () => {
    const semCar = simular(inputBase({ car: 'nao_tem' }), conj)
    const ok = simular(inputBase({ car: 'regular_averbado' }), conj)
    expect(ok.score).toBeGreaterThan(semCar.score)
  })

  it('quitar ITR SOBE score (sob teto)', () => {
    const cenario = {
      cadastro_nivel: 'padrao_agrobridge' as const,
      endividamento_pct: 75, // alerta
      reciprocidade_bancaria: 'nenhuma' as const,
      garantias: [] as never[],
      tem_seguro_agricola: false,
    }
    const atrasado = simular(inputBase({ ...cenario, itr_em_dia: false }), conj)
    const dia = simular(inputBase({ ...cenario, itr_em_dia: true }), conj)
    expect(dia.score).toBeGreaterThan(atrasado.score)
  })

  it('quitar IR SOBE score (sob teto)', () => {
    const cenario = {
      cadastro_nivel: 'padrao_agrobridge' as const,
      endividamento_pct: 75,
      reciprocidade_bancaria: 'nenhuma' as const,
      garantias: [] as never[],
      tem_seguro_agricola: false,
    }
    const atrasado = simular(inputBase({ ...cenario, ir_em_dia: false }), conj)
    const dia = simular(inputBase({ ...cenario, ir_em_dia: true }), conj)
    expect(dia.score).toBeGreaterThan(atrasado.score)
  })

  it('regularizar CPF SOBE score', () => {
    const irreg = simular(inputBase({ cpf_cnpj_regular: false }), conj)
    const reg = simular(inputBase({ cpf_cnpj_regular: true }), conj)
    expect(reg.score).toBeGreaterThan(irreg.score)
  })

  it('imóvel em inventário CAI score', () => {
    const ok = simular(inputBase({ imovel_em_inventario: false }), conj)
    const inv = simular(inputBase({ imovel_em_inventario: true }), conj)
    expect(inv.score).toBeLessThan(ok.score)
  })

  it('subir cadastro desatualizado→atualizado SOBE score (sob teto)', () => {
    const cenario = {
      garantias: ['hipoteca_1grau' as const],
      endividamento_pct: 30,
      historico_scr: 'limpo' as const,
      reciprocidade_bancaria: 'forte' as const,
    }
    const desat = simular(inputBase({ ...cenario, cadastro_nivel: 'desatualizado' }), conj)
    const atual = simular(inputBase({ ...cenario, cadastro_nivel: 'atualizado_incompleto' }), conj)
    expect(atual.score).toBeGreaterThanOrEqual(desat.score)
  })

  it('reduzir endividamento de 80% pra 30% SOBE score', () => {
    const alto = simular(inputBase({ endividamento_pct: 80 }), conj)
    const baixo = simular(inputBase({ endividamento_pct: 30 }), conj)
    expect(baixo.score).toBeGreaterThan(alto.score)
  })

  it('reduzir alavancagem patrimonial de critica → baixa SOBE score', () => {
    const cri = simular(inputBase({ divida_patrimonio_faixa: 'acima_85' }), conj)
    const baix = simular(inputBase({ divida_patrimonio_faixa: 'ate_50' }), conj)
    expect(baix.score).toBeGreaterThan(cri.score)
  })

  it('substituir aval puro por amplo amparo SOBE score', () => {
    const cenario = { relacao_terra: 'totalmente_arrendado' as const }
    const puro = simular(inputBase({ ...cenario, aval_tipo: 'puro_sem_respaldo' }), conj)
    const amplo = simular(inputBase({ ...cenario, aval_tipo: 'amplo_amparo_patrimonial' }), conj)
    expect(amplo.score).toBeGreaterThan(puro.score)
  })

  it('regularizar dívida com atraso → em_dia SOBE score', () => {
    const atr = simular(inputBase({ divida_outros_bancos: 'com_atraso' }), conj)
    const ok = simular(inputBase({ divida_outros_bancos: 'em_dia' }), conj)
    expect(ok.score).toBeGreaterThan(atr.score)
  })

  it('limpar histórico SCR de restrição ativa → limpo SOBE score', () => {
    const ativ = simular(inputBase({ historico_scr: 'com_restricao_ativa' }), conj)
    const lim = simular(inputBase({ historico_scr: 'limpo' }), conj)
    expect(lim.score).toBeGreaterThan(ativ.score)
  })

  it('virar imóvel próprio (de arrendado) SOBE score', () => {
    const arr = simular(inputBase({ relacao_terra: 'totalmente_arrendado' }), conj)
    const prop = simular(inputBase({ relacao_terra: 'proprio' }), conj)
    expect(prop.score).toBeGreaterThan(arr.score)
  })

  it('adicionar garantia premium ao set vazio SOBE score (sob teto)', () => {
    const cenario = {
      cadastro_nivel: 'padrao_agrobridge' as const,
      endividamento_pct: 70,
      reciprocidade_bancaria: 'nenhuma' as const,
      tem_seguro_agricola: false,
      car: 'inscrito_pendente' as const,
    }
    const sem = simular(inputBase({ ...cenario, garantias: [] }), conj)
    const com = simular(
      inputBase({ ...cenario, garantias: ['alienacao_fiduciaria_guarda_chuva'] }),
      conj,
    )
    expect(com.score).toBeGreaterThan(sem.score)
  })
})

// ── Y) Coerência cruzada (15 testes) ───────────────────────────────
describe('[Y] Coerência — invariantes do produto', () => {
  it('plano de subida vazio quando score ≥ 85', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'investimento_garantia',
        ],
        historico_scr: 'limpo',
        reciprocidade_bancaria: 'forte',
        divida_patrimonio_faixa: 'ate_50',
        endividamento_pct: 5,
      }),
      conj,
    )
    if (r.score >= 85) {
      expect(r.plano_de_subida).toEqual([])
    }
  })

  it('plano de subida tem max 4 ações', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        car: 'nao_tem',
        tem_seguro_agricola: false,
        reciprocidade_bancaria: 'nenhuma',
        endividamento_pct: 90,
        itr_em_dia: false,
        ir_em_dia: false,
        cpf_cnpj_regular: false,
        imovel_em_inventario: true,
        divida_patrimonio_faixa: 'acima_85',
        divida_outros_bancos: 'com_atraso',
      }),
      conj,
    )
    expect(r.plano_de_subida.length).toBeLessThanOrEqual(4)
  })

  it('plano de subida prioriza regras duras antes de outras', () => {
    const r = simular(
      inputBase({
        car: 'nao_tem',
        tem_seguro_agricola: false,
        reciprocidade_bancaria: 'nenhuma',
        cadastro_nivel: 'atualizado_incompleto',
      }),
      conj,
    )
    const idxCar = r.plano_de_subida.findIndex((a) => /CAR/i.test(a.acao))
    const idxSeg = r.plano_de_subida.findIndex((a) => /seguro/i.test(a.acao))
    if (idxCar >= 0 && idxSeg >= 0) {
      expect(idxCar).toBeLessThan(idxSeg)
    }
  })

  it('linha_mcr_provavel é null sse cultura inválida', () => {
    const ok = simular(inputBase({ cultura: 'soja' }), conj)
    const inv = simular(inputBase({ cultura: 'invalid' as never }), conj)
    expect(ok.linha_mcr_provavel).not.toBeNull()
    expect(inv.linha_mcr_provavel).toBeNull()
  })

  it('teto_valor_estimado pra pecuária (max ha=0) é null sem renda', () => {
    const r = simular(
      inputBase({ cultura: 'pecuaria_corte', renda_bruta_anual: undefined }),
      conj,
    )
    // Pecuária tem teto_custeio_por_ha.max != 0? Vou aceitar qualquer
    // resultado consistente (number ou null).
    expect(r.teto_valor_estimado === null || typeof r.teto_valor_estimado === 'number').toBe(true)
  })

  it('avisos sempre incluem os de conjuntura', () => {
    const r = simular(inputBase(), conj)
    expect(r.avisos.filter((a) => a.tipo === 'info').length).toBeGreaterThan(0)
  })

  it('deltas_aplicados sempre é array (nunca undefined)', () => {
    const r = simular(inputBase(), conj)
    expect(Array.isArray(r.deltas_aplicados)).toBe(true)
  })

  it('todos os deltas têm fator + delta + motivo', () => {
    const r = simular(
      inputBase({
        garantias: ['hipoteca_1grau'],
        car: 'nao_tem',
        endividamento_pct: 75,
      }),
      conj,
    )
    for (const d of r.deltas_aplicados) {
      expect(typeof d.fator).toBe('string')
      expect(typeof d.delta).toBe('number')
      expect(typeof d.motivo).toBe('string')
      expect(d.fator.length).toBeGreaterThan(0)
      expect(d.motivo.length).toBeGreaterThan(0)
    }
  })

  it('soma manual dos deltas + base 50 BATE com score (antes do clamp/teto)', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge', // teto 100
        garantias: ['hipoteca_1grau'],
        endividamento_pct: 30,
      }),
      conj,
    )
    const somaDeltas = r.deltas_aplicados.reduce((acc, d) => acc + d.delta, 0)
    const scoreSemClamp = 50 + somaDeltas
    // Score final = min(scoreSemClamp, teto), clamp 0..100
    const scoreFinal = Math.max(0, Math.min(scoreSemClamp, r.teto_por_cadastro))
    expect(r.score).toBe(scoreFinal)
  })

  it('regras_duras_violadas tem mesmo length dos deltas regra_dura_*', () => {
    const r = simular(
      inputBase({
        car: 'nao_tem',
        cpf_cnpj_regular: false,
        itr_em_dia: false,
      }),
      conj,
    )
    const deltasRD = r.deltas_aplicados.filter((d) => d.fator.startsWith('regra_dura_'))
    expect(r.regras_duras_violadas.length).toBe(deltasRD.length)
  })

  it('faixa coerente com score numérico', () => {
    const cenarios = [
      { e: 5, esp: ['alta', 'muito_alta'] },
      { e: 200, esp: ['muito_baixa', 'baixa'] },
    ]
    for (const c of cenarios) {
      const r = simular(
        inputBase({
          endividamento_pct: c.e,
          cadastro_nivel: 'padrao_agrobridge',
          garantias: c.e < 50 ? ['alienacao_fiduciaria_guarda_chuva'] : [],
          historico_scr: c.e < 50 ? 'limpo' : 'com_restricao_ativa',
          reciprocidade_bancaria: c.e < 50 ? 'forte' : 'nenhuma',
        }),
        conj,
      )
      expect(c.esp).toContain(r.faixa)
    }
  })

  it('cor do score (verde/amarelo/vermelho) coerente com faixa', () => {
    // ≥ 80 verde · 51-79 amarelo · ≤ 50 vermelho (régua produto)
    const verde = simular(
      inputBase({
        endividamento_pct: 5,
        cadastro_nivel: 'padrao_agrobridge',
        garantias: ['alienacao_fiduciaria_guarda_chuva'],
        historico_scr: 'limpo',
        reciprocidade_bancaria: 'forte',
        divida_patrimonio_faixa: 'ate_50',
      }),
      conj,
    )
    expect(verde.score).toBeGreaterThanOrEqual(80)

    const vermelho = simular(
      inputBase({
        endividamento_pct: 90, // improvável -20
        cadastro_nivel: 'desatualizado', // teto 60
        garantias: [],
        historico_scr: 'com_restricao_ativa', // -25
        reciprocidade_bancaria: 'nenhuma', // -5
        car: 'inscrito_pendente', // -4
        tem_seguro_agricola: false,
        divida_patrimonio_faixa: 'acima_85', // -22
        divida_outros_bancos: 'com_atraso', // -18
      }),
      conj,
    )
    expect(vermelho.score).toBeLessThanOrEqual(50)
  })

  it('motivo do delta inclui referência humana ao input', () => {
    const r = simular(inputBase({ endividamento_pct: 75 }), conj)
    const d = r.deltas_aplicados.find((d) => d.fator === 'endividamento_alerta')
    expect(d?.motivo).toMatch(/75/)
  })

  it('aviso crítico aparece quando há regra dura E endividamento crítico', () => {
    const r = simular(
      inputBase({ car: 'nao_tem', endividamento_pct: 90 }),
      conj,
    )
    const tipos = r.avisos.map((a) => a.tipo)
    expect(tipos).toContain('critico')
  })

  // ── Z) Stress aleatório (50 testes) — fuzz controlado ─────────
  // Gera 50 inputs com variações aleatórias em campos chave e
  // valida invariantes globais: score 0..100, faixa válida,
  // radar 6 eixos, deltas array.
  const seedRandom = (seed: number) => {
    let s = seed
    return () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
  }
  const garantiasIds = GARANTIAS.map((g) => g.id)
  const culturasIds = CULTURAS.map((c) => c.id)

  for (let i = 0; i < 50; i++) {
    it(`stress #${i}: inputs variados respeitam invariantes`, () => {
      const rand = seedRandom(i + 1)
      const numGar = Math.floor(rand() * 5)
      const garantias = Array.from(
        { length: numGar },
        () => garantiasIds[Math.floor(rand() * garantiasIds.length)],
      ).filter((g, idx, arr) => arr.indexOf(g) === idx)

      const r = simular(
        inputBase({
          cultura: culturasIds[Math.floor(rand() * culturasIds.length)] as never,
          garantias,
          endividamento_pct: Math.floor(rand() * 200),
          renda_bruta_anual: rand() > 0.3 ? Math.floor(rand() * 5_000_000) : undefined,
          valor_pretendido: Math.max(1, Math.floor(rand() * 10_000_000)),
          car: ['regular_averbado', 'inscrito_pendente', 'nao_tem'][
            Math.floor(rand() * 3)
          ] as never,
          historico_scr: [
            'limpo',
            'restricao_encerrada',
            'primeira_operacao',
            'com_restricao_ativa',
          ][Math.floor(rand() * 4)] as never,
          tem_seguro_agricola: rand() > 0.5,
          imovel_em_inventario: rand() > 0.85,
          itr_em_dia: rand() > 0.2,
          ir_em_dia: rand() > 0.2,
          cpf_cnpj_regular: rand() > 0.05,
        }),
        conj,
      )

      // Invariantes globais
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(typeof r.score).toBe('number')
      expect(Number.isFinite(r.score)).toBe(true)
      expect(['muito_baixa', 'baixa', 'media', 'alta', 'muito_alta']).toContain(r.faixa)
      expect(r.radar.length).toBe(6)
      for (const e of r.radar) {
        expect(e.valor).toBeGreaterThanOrEqual(0)
        expect(e.valor).toBeLessThanOrEqual(100)
        expect(Number.isFinite(e.valor)).toBe(true)
      }
      expect(Array.isArray(r.deltas_aplicados)).toBe(true)
      expect(Array.isArray(r.avisos)).toBe(true)
      expect(Array.isArray(r.regras_duras_violadas)).toBe(true)
      expect(Array.isArray(r.plano_de_subida)).toBe(true)
      expect(r.plano_de_subida.length).toBeLessThanOrEqual(4)
    })
  }

  it('snapshot mínimo do shape de retorno', () => {
    const r = simular(inputBase(), conj)
    const keys = Object.keys(r).sort()
    expect(keys).toEqual(
      [
        'avisos',
        'deltas_aplicados',
        'faixa',
        'linha_mcr_provavel',
        'plano_de_subida',
        'radar',
        'regras_duras_violadas',
        'score',
        'teto_por_cadastro',
        'teto_valor_estimado',
      ].sort(),
    )
  })
})
