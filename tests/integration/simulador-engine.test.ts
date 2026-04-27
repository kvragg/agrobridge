import { describe, it, expect } from 'vitest'
import { simular } from '@/lib/simulator/engine'
import { CONJUNTURA_ATUAL } from '@/lib/simulator/data/conjuntura'
import { CULTURAS } from '@/lib/simulator/data/culturas'
import { GARANTIAS } from '@/lib/simulator/data/garantias'
import { CADASTRO_NIVEIS } from '@/lib/simulator/data/cadastro-niveis'
import type { SimulatorInput } from '@/lib/simulator/types'

// ============================================================
// [SIM] Motor do Simulador — propriedades e regras-chave
// ============================================================
// Função pura: mesmo input + mesma conjuntura = mesmo output.
// Cobertura: deltas, regras duras, teto por cadastro, faixas,
// radar, plano de subida.
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

describe('Determinismo', () => {
  it('mesmo input + mesma conjuntura = mesmo output (idempotente)', () => {
    const a = simular(inputBase(), CONJUNTURA_ATUAL)
    const b = simular(inputBase(), CONJUNTURA_ATUAL)
    expect(a.score).toBe(b.score)
    expect(a.faixa).toBe(b.faixa)
    expect(a.deltas_aplicados.length).toBe(b.deltas_aplicados.length)
  })
})

describe('Score sempre clampeado [0..100]', () => {
  it('cenário maximamente positivo não passa de 100', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        historico_scr: 'limpo',
        endividamento_pct: 5,
        car: 'regular_averbado',
        tem_seguro_agricola: true,
        reciprocidade_bancaria: 'forte',
        garantias: ['hipoteca_1grau', 'cpr_f_registrada', 'alienacao_fiduciaria_guarda_chuva'],
        relacao_terra: 'proprio',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(0)
  })

  it('cenário maximamente negativo não fica abaixo de 0', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        historico_scr: 'com_restricao_ativa',
        endividamento_pct: 200,
        car: 'nao_tem',
        car_suspenso: true,
        tem_seguro_agricola: false,
        reciprocidade_bancaria: 'nenhuma',
        garantias: [],
        relacao_terra: 'totalmente_arrendado',
        aval_tipo: 'puro_sem_respaldo',
        arrendamento_com_anuencia: false,
        cpf_cnpj_regular: false,
        imovel_em_inventario: true,
        itr_em_dia: false,
        ir_em_dia: false,
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeGreaterThanOrEqual(0)
  })
})

describe('Teto por cadastro', () => {
  it('cadastro desatualizado tem teto baixo (<= teto_score)', () => {
    const nivel = CADASTRO_NIVEIS.find((n) => n.id === 'desatualizado')!
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        // Tudo positivo pra empurrar score pro alto — teto deve segurar
        garantias: ['hipoteca_1grau', 'cpr_f_registrada'],
        historico_scr: 'limpo',
        reciprocidade_bancaria: 'forte',
        endividamento_pct: 10,
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.score).toBeLessThanOrEqual(nivel.teto_score)
  })

  it('padrao_agrobridge desbloqueia teto 100', () => {
    const r = simular(
      inputBase({ cadastro_nivel: 'padrao_agrobridge' }),
      CONJUNTURA_ATUAL,
    )
    expect(r.teto_por_cadastro).toBe(100)
  })
})

describe('Regras duras (penalizam mas não bloqueiam)', () => {
  it('CPF/CNPJ irregular gera regra dura', () => {
    const r = simular(inputBase({ cpf_cnpj_regular: false }), CONJUNTURA_ATUAL)
    expect(r.regras_duras_violadas.length).toBeGreaterThan(0)
    expect(r.regras_duras_violadas.join(' ').toLowerCase()).toMatch(/cpf|cnpj/)
  })

  it('imóvel em inventário gera regra dura', () => {
    const r = simular(inputBase({ imovel_em_inventario: true }), CONJUNTURA_ATUAL)
    expect(r.regras_duras_violadas.join(' ').toLowerCase()).toMatch(/inventário/)
  })

  it('CAR ausente gera regra dura', () => {
    const r = simular(inputBase({ car: 'nao_tem' }), CONJUNTURA_ATUAL)
    expect(r.regras_duras_violadas.join(' ').toLowerCase()).toMatch(/car/)
  })

  it('ITR em atraso aparece em regras_duras como "último exercício"', () => {
    const r = simular(inputBase({ itr_em_dia: false }), CONJUNTURA_ATUAL)
    const txt = r.regras_duras_violadas.join(' ')
    expect(txt).toMatch(/ITR/i)
    // Anti-regressão: depois da correção do dia, não pode mais falar em "5 exercícios"
    expect(txt).not.toMatch(/5 exercícios/)
  })

  it('arrendatário sem anuência gera regra dura', () => {
    const r = simular(
      inputBase({
        relacao_terra: 'totalmente_arrendado',
        arrendamento_com_anuencia: false,
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.regras_duras_violadas.join(' ').toLowerCase()).toMatch(/anuência|anuencia/)
  })
})

describe('Reciprocidade bancária', () => {
  // Importante: cenário base usa cadastro 'desatualizado' (teto 50) NÃO,
  // não — usa cenário onde score está abaixo do teto pra ver o efeito real
  // de cada nível de reciprocidade. Endividamento alto + cadastro
  // 'atualizado_incompleto' (teto 80) NÃO deixa espaço pra distinguir.
  // Soluciono usando um cenário com mais "espaço" no score.
  it('forte > média > nenhuma (em score, abaixo do teto)', () => {
    const cenarioBase: Partial<SimulatorInput> = {
      // Endividamento moderado pra puxar score pra baixo do teto
      endividamento_pct: 60,
      // Sem garantias premium pra deixar score baixo
      garantias: [],
      car: 'inscrito_pendente',
      tem_seguro_agricola: false,
    }
    const forte = simular(
      inputBase({ ...cenarioBase, reciprocidade_bancaria: 'forte' }),
      CONJUNTURA_ATUAL,
    ).score
    const media = simular(
      inputBase({ ...cenarioBase, reciprocidade_bancaria: 'media' }),
      CONJUNTURA_ATUAL,
    ).score
    const nenhuma = simular(
      inputBase({ ...cenarioBase, reciprocidade_bancaria: 'nenhuma' }),
      CONJUNTURA_ATUAL,
    ).score
    expect(forte).toBeGreaterThan(media)
    expect(media).toBeGreaterThan(nenhuma)
  })
})

describe('Faixas qualitativas', () => {
  it('baixa probabilidade quando muitas regras duras', () => {
    const r = simular(
      inputBase({
        cpf_cnpj_regular: false,
        imovel_em_inventario: true,
        itr_em_dia: false,
        car: 'nao_tem',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(['muito_baixa', 'baixa']).toContain(r.faixa)
  })

  it('alta probabilidade no cenário ideal', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        historico_scr: 'limpo',
        reciprocidade_bancaria: 'forte',
        endividamento_pct: 10,
        garantias: ['hipoteca_1grau', 'cpr_f_registrada'],
      }),
      CONJUNTURA_ATUAL,
    )
    expect(['alta', 'muito_alta']).toContain(r.faixa)
  })
})

describe('Radar tem sempre 6 eixos com valores [0..100]', () => {
  it('inputs random retornam radar bem formado', () => {
    const r = simular(inputBase(), CONJUNTURA_ATUAL)
    expect(r.radar.length).toBe(6)
    const labels = r.radar.map((e) => e.eixo)
    expect(labels).toContain('Garantia')
    expect(labels).toContain('Cultura')
    expect(labels).toContain('Cadastro')
    expect(labels).toContain('Histórico')
    expect(labels).toContain('Capacidade')
    expect(labels).toContain('Documentação')
    for (const e of r.radar) {
      expect(e.valor).toBeGreaterThanOrEqual(0)
      expect(e.valor).toBeLessThanOrEqual(100)
    }
  })
})

describe('Plano de subida', () => {
  it('vazio quando score já é muito alto (>=85)', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'padrao_agrobridge',
        historico_scr: 'limpo',
        reciprocidade_bancaria: 'forte',
        endividamento_pct: 5,
        garantias: ['hipoteca_1grau', 'cpr_f_registrada', 'alienacao_fiduciaria_guarda_chuva'],
      }),
      CONJUNTURA_ATUAL,
    )
    if (r.score >= 85) {
      expect(r.plano_de_subida).toEqual([])
    }
  })

  it('inclui ação de quitar ITR (último exercício) quando em atraso', () => {
    const r = simular(inputBase({ itr_em_dia: false }), CONJUNTURA_ATUAL)
    const acoes = r.plano_de_subida.map((a) => a.acao).join(' ')
    expect(acoes).toMatch(/ITR/i)
    expect(acoes).toMatch(/último exercício/i)
    // Anti-regressão
    expect(acoes).not.toMatch(/5 exercícios/)
  })

  it('inclui ação de inscrever CAR quando "nao_tem"', () => {
    const r = simular(inputBase({ car: 'nao_tem' }), CONJUNTURA_ATUAL)
    expect(r.plano_de_subida.some((a) => /CAR/i.test(a.acao))).toBe(true)
  })

  it('máximo 4 ações no plano (UX — não overwhelm)', () => {
    const r = simular(
      inputBase({
        cadastro_nivel: 'desatualizado',
        car: 'nao_tem',
        tem_seguro_agricola: false,
        reciprocidade_bancaria: 'nenhuma',
        endividamento_pct: 150,
        itr_em_dia: false,
        ir_em_dia: false,
        garantias: [],
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.plano_de_subida.length).toBeLessThanOrEqual(4)
  })
})

describe('Sanity check dos data files', () => {
  it('soja existe em CULTURAS', () => {
    expect(CULTURAS.find((c) => c.id === 'soja')).toBeDefined()
  })

  it('hipoteca_1grau existe em GARANTIAS', () => {
    expect(GARANTIAS.find((g) => g.id === 'hipoteca_1grau')).toBeDefined()
  })

  it('todos os IDs de cultura são únicos', () => {
    const ids = CULTURAS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos os IDs de garantia são únicos', () => {
    const ids = GARANTIAS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('CADASTRO_NIVEIS tem os 3 níveis esperados', () => {
    const ids = CADASTRO_NIVEIS.map((n) => n.id).sort()
    expect(ids).toEqual(['atualizado_incompleto', 'desatualizado', 'padrao_agrobridge'])
  })
})

describe('Auditoria 100% funcional — calibrações finais', () => {
  it('aval não duplica: aval_tipo NÃO bate com lista de garantias', () => {
    // Os 4 IDs aval_* foram removidos da lista GARANTIAS pra evitar
    // que aparecessem na UI + somassem em duplicidade com aval_tipo.
    const idsRemovidos = [
      'aval_amplo_patrimonio',
      'aval_ate_100k',
      'aval_terceiro_fraco',
      'aval_puro_sem_respaldo',
    ]
    for (const id of idsRemovidos) {
      expect(GARANTIAS.find((g) => g.id === id)).toBeUndefined()
    }
  })

  it('comercialização tem teto 2× renda (mais conservador que custeio)', () => {
    // Pleito 3× renda em comercialização = acima do padrão (teto 2)
    const r = simular(
      inputBase({
        valor_pretendido: 1_500_000,
        renda_bruta_anual: 500_000,
        finalidade: 'comercializacao',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_acima_padrao')).toBe(true)
  })

  it('industrialização aceita até 5× renda (similar a investimento)', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 4_000_000,
        renda_bruta_anual: 1_000_000,
        finalidade: 'industrializacao',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_acima_padrao')).toBe(false)
  })

  it('valor_pretendido = 0 não dispara delta de pleito_compativel', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 0,
        renda_bruta_anual: 1_000_000,
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_compativel')).toBe(false)
  })

  it('combo de 3 garantias premium escala (8+3 = 11 com guarda-chuva)', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_guarda_chuva',
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
        ],
      }),
      CONJUNTURA_ATUAL,
    )
    const combo = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(combo?.delta).toBe(11) // 8 (guarda-chuva) + 3 (3ª)
  })

  it('combo de 4 garantias premium escala teto (sem guarda-chuva = 5+3+3 = 11)', () => {
    const r = simular(
      inputBase({
        garantias: [
          'alienacao_fiduciaria_rural',
          'investimento_garantia',
          'cessao_creditorios_aaa',
          'fianca_bancaria',
        ],
      }),
      CONJUNTURA_ATUAL,
    )
    const combo = r.deltas_aplicados.find((d) => d.fator === 'combo_garantias_premium')
    expect(combo?.delta).toBe(11) // 5 base + 2 extras × 3 = 11
  })

  it('plano de subida prioriza regras duras (CAR ausente antes de seguro/recip)', () => {
    const r = simular(
      inputBase({
        car: 'nao_tem',
        tem_seguro_agricola: false,
        reciprocidade_bancaria: 'nenhuma',
        cadastro_nivel: 'atualizado_incompleto',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.plano_de_subida.length).toBeGreaterThan(0)
    // CAR (regra dura) deve estar antes de Seguro (otimização normal)
    const idxCar = r.plano_de_subida.findIndex((a) => /CAR/i.test(a.acao))
    const idxSeguro = r.plano_de_subida.findIndex((a) => /seguro/i.test(a.acao))
    if (idxCar >= 0 && idxSeguro >= 0) {
      expect(idxCar).toBeLessThan(idxSeguro)
    }
  })
})

describe('Cultura inválida não quebra (defensivo)', () => {
  it('engine devolve resultado válido mesmo se cultura desconhecida', () => {
    // simular() faz `getCultura(input.cultura)` que pode retornar undefined.
    // Não deve crashar, só não aplicar o delta de cultura.
    const r = simular(
      inputBase({ cultura: 'cultura_inexistente_xyz' as never }),
      CONJUNTURA_ATUAL,
    )
    expect(typeof r.score).toBe('number')
    expect(r.linha_mcr_provavel).toBeNull()
  })
})

describe('Dívida ativa em outros bancos', () => {
  it('"nenhuma" bonifica vs "em_dia" (concentração) — sob teto', () => {
    // Sem garantia + endividamento moderado pra ficar abaixo do teto
    // do cadastro 'atualizado_incompleto' (80) — vê o efeito real.
    const cenario: Partial<SimulatorInput> = {
      garantias: [],
      reciprocidade_bancaria: 'nenhuma',
      tem_seguro_agricola: false,
      endividamento_pct: 80,
      car: 'inscrito_pendente',
    }
    const nenhuma = simular(
      inputBase({ ...cenario, divida_outros_bancos: 'nenhuma' }),
      CONJUNTURA_ATUAL,
    )
    const emDia = simular(
      inputBase({ ...cenario, divida_outros_bancos: 'em_dia' }),
      CONJUNTURA_ATUAL,
    )
    expect(nenhuma.score).toBeGreaterThan(emDia.score)
  })

  it('"com_atraso" gera aviso crítico + ação no plano', () => {
    const r = simular(
      inputBase({ divida_outros_bancos: 'com_atraso' }),
      CONJUNTURA_ATUAL,
    )
    expect(r.avisos.some((a) => a.tipo === 'critico' && /atraso.*outro banco/i.test(a.texto))).toBe(true)
    expect(r.plano_de_subida.some((a) => /regularizar.*outro banco/i.test(a.acao))).toBe(true)
  })

  it('campo opcional ausente é neutro (retrocompat)', () => {
    const semCampo = simular(inputBase(), CONJUNTURA_ATUAL)
    const naoInformado = simular(
      inputBase({ divida_outros_bancos: undefined }),
      CONJUNTURA_ATUAL,
    )
    expect(semCampo.score).toBe(naoInformado.score)
  })
})

describe('Renda bruta anual e ratio do pleito', () => {
  it('pleito até 3× renda em custeio = compatível (bonifica)', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 800_000,
        renda_bruta_anual: 1_500_000,
        finalidade: 'custeio',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_compativel')).toBe(true)
  })

  it('pleito 4× renda em custeio penaliza (acima do padrão)', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 4_000_000,
        renda_bruta_anual: 1_000_000,
        finalidade: 'custeio',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_acima_padrao')).toBe(true)
  })

  it('pleito 6× renda em custeio gera crítico + ação', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 6_000_000,
        renda_bruta_anual: 1_000_000,
        finalidade: 'custeio',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.avisos.some((a) => a.tipo === 'critico' && /múltiplo.*renda/i.test(a.texto))).toBe(true)
    expect(r.plano_de_subida.some((a) => /reduzir o pleito/i.test(a.acao))).toBe(true)
  })

  it('investimento aceita até 5× renda sem penalidade', () => {
    const r = simular(
      inputBase({
        valor_pretendido: 4_000_000,
        renda_bruta_anual: 1_000_000,
        finalidade: 'investimento',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.deltas_aplicados.some((d) => d.fator === 'pleito_acima_padrao')).toBe(false)
  })

  it('teto_valor_estimado deriva da renda quando informada', () => {
    const r = simular(
      inputBase({
        renda_bruta_anual: 2_000_000,
        finalidade: 'custeio',
      }),
      CONJUNTURA_ATUAL,
    )
    expect(r.teto_valor_estimado).toBe(6_000_000) // 3× renda
  })

  it('campo opcional ausente é neutro', () => {
    const semRenda = simular(inputBase(), CONJUNTURA_ATUAL)
    const comRendaUndefined = simular(
      inputBase({ renda_bruta_anual: undefined }),
      CONJUNTURA_ATUAL,
    )
    expect(semRenda.score).toBe(comRendaUndefined.score)
  })
})

describe('Alavancagem patrimonial (cenário 2026 — RJs em alta)', () => {
  it('até 50% bonifica score (folga patrimonial)', () => {
    const baixa = simular(
      inputBase({ divida_patrimonio_faixa: 'ate_50' }),
      CONJUNTURA_ATUAL,
    )
    const semInfo = simular(inputBase(), CONJUNTURA_ATUAL)
    expect(baixa.score).toBeGreaterThanOrEqual(semInfo.score)
  })

  it('51-70% penaliza moderadamente (sob teto cadastro)', () => {
    // Cenário com espaço sob o teto (sem garantia premium + endividamento
    // baixo) pra ver o efeito real do delta sem o teto mascarar.
    const cenarioCabe: Partial<SimulatorInput> = {
      garantias: [],
      endividamento_pct: 50,
      tem_seguro_agricola: false,
      reciprocidade_bancaria: 'nenhuma',
    }
    const moderada = simular(
      inputBase({ ...cenarioCabe, divida_patrimonio_faixa: 'de_51_a_70' }),
      CONJUNTURA_ATUAL,
    )
    const baixa = simular(
      inputBase({ ...cenarioCabe, divida_patrimonio_faixa: 'ate_50' }),
      CONJUNTURA_ATUAL,
    )
    expect(moderada.score).toBeLessThan(baixa.score)
  })

  it('71-85% gera aviso de alerta', () => {
    const r = simular(
      inputBase({ divida_patrimonio_faixa: 'de_71_a_85' }),
      CONJUNTURA_ATUAL,
    )
    const tiposAviso = r.avisos.map((a) => a.tipo)
    expect(tiposAviso).toContain('alerta')
    expect(r.avisos.some((a) => /alavancagem/i.test(a.texto))).toBe(true)
  })

  it('acima de 85% gera aviso crítico + ação no plano de subida', () => {
    const r = simular(
      inputBase({ divida_patrimonio_faixa: 'acima_85' }),
      CONJUNTURA_ATUAL,
    )
    const tiposAviso = r.avisos.map((a) => a.tipo)
    expect(tiposAviso).toContain('critico')
    const acoes = r.plano_de_subida.map((a) => a.acao).join(' ')
    expect(acoes).toMatch(/alavancagem|reduzir.*dívida/i)
  })

  it("'nao_sei' não aplica delta nem aviso (neutro)", () => {
    const semInfo = simular(inputBase(), CONJUNTURA_ATUAL)
    const naoSei = simular(
      inputBase({ divida_patrimonio_faixa: 'nao_sei' }),
      CONJUNTURA_ATUAL,
    )
    expect(naoSei.score).toBe(semInfo.score)
    expect(
      naoSei.avisos.filter((a) => /alavancagem/i.test(a.texto)).length,
    ).toBe(0)
  })

  it('eixo Capacidade do radar combina os dois endividamentos quando informados', () => {
    // Cenário: endividamento receita baixo (deveria dar capacidade alta)
    // mas alavancagem patrimonial crítica (deveria puxar pra baixo)
    const so_caixa = simular(
      inputBase({ endividamento_pct: 10 }),
      CONJUNTURA_ATUAL,
    )
    const com_alavancagem_critica = simular(
      inputBase({ endividamento_pct: 10, divida_patrimonio_faixa: 'acima_85' }),
      CONJUNTURA_ATUAL,
    )
    const eixoSoCaixa = so_caixa.radar.find((e) => e.eixo === 'Capacidade')!
    const eixoCombinado = com_alavancagem_critica.radar.find(
      (e) => e.eixo === 'Capacidade',
    )!
    expect(eixoCombinado.valor).toBeLessThan(eixoSoCaixa.valor)
  })
})

describe('teto_valor_estimado', () => {
  it('é null pra culturas com teto_custeio_por_ha.max=0 (pecuária etc)', () => {
    // Buscar uma cultura com max=0
    const semTeto = CULTURAS.find((c) => c.teto_custeio_por_ha.max === 0)
    if (semTeto) {
      const r = simular(
        inputBase({ cultura: semTeto.id as never }),
        CONJUNTURA_ATUAL,
      )
      expect(r.teto_valor_estimado).toBeNull()
    }
  })

  it('é numérico positivo pra cultura com teto definido (soja)', () => {
    const r = simular(inputBase({ cultura: 'soja' }), CONJUNTURA_ATUAL)
    expect(r.teto_valor_estimado).toBeGreaterThan(0)
  })
})
