// Motor de score do Simulador AgroBridge.
//
// Função pura — sem I/O, sem aleatoriedade, deterministicamente
// reproduzível. Mesmo input + mesma conjuntura = mesmo output.
//
// Pipeline:
//   1. base 50
//   2. deltas isolados (cultura, garantias, cadastro, histórico,
//      endividamento, CAR, seguro, reciprocidade, estrutura fundiária)
//   3. regra combinatória arrendatário+aval
//   4. regra combinatória garantias múltiplas
//   5. modificadores de conjuntura (sobre garantias)
//   6. teto por cadastro: min(score, teto)
//   7. regras duras (não bloqueiam — −40 cada)
//   8. clampa 0..100
//   9. faixa qualitativa
//  10. radar 6 eixos
//  11. avisos contextuais
//  12. plano de subida
//  13. teto de valor estimado

import {
  getCultura,
  type Cultura,
} from './data/culturas'
import {
  getGarantia,
  GARANTIAS_PREMIUM_COMPLEMENTARES,
} from './data/garantias'
import { getNivelCadastro } from './data/cadastro-niveis'
import type { ConjunturaEconomica } from './data/conjuntura'
import { aplicarRegraArrendatario } from './data/regras-combinatorias'
import type {
  SimulatorInput,
  SimulatorResult,
  Faixa,
  DeltaAplicado,
  AvisoCtx,
  RadarEixo,
  AcaoSubida,
} from './types'

const SCORE_BASE = 50

// Re-export para conveniência da UI
export { CULTURAS } from './data/culturas'
export { GARANTIAS } from './data/garantias'
export { CADASTRO_NIVEIS } from './data/cadastro-niveis'

export function simular(
  input: SimulatorInput,
  conjuntura: ConjunturaEconomica,
): SimulatorResult {
  const deltas: DeltaAplicado[] = []
  const avisos: AvisoCtx[] = []
  const regrasDurasViolades: string[] = []

  // ── 1) Cultura ────────────────────────────────────────────────
  const cultura = getCultura(input.cultura)
  if (cultura) {
    deltas.push({
      fator: `cultura_${cultura.id}`,
      delta: cultura.delta_score_base,
      motivo: `Cultura ${cultura.nome}: ${cultura.observacao}`,
    })
  }

  // ── 2) Garantias (deltas isolados) ────────────────────────────
  for (const gid of input.garantias) {
    const g = getGarantia(gid)
    if (!g) continue
    deltas.push({
      fator: `garantia_${g.id}`,
      delta: g.delta,
      motivo: `Garantia: ${g.nome}`,
    })
  }

  // ── 3) Aval (separado pra interagir com regra do arrendatário) ──
  if (input.aval_tipo === 'amplo_amparo_patrimonial') {
    deltas.push({
      fator: 'aval_amplo_amparo_patrimonial',
      delta: 2,
      motivo: 'Aval com amplo amparo patrimonial.',
    })
  } else if (input.aval_tipo === 'ate_100k_com_respaldo') {
    deltas.push({
      fator: 'aval_ate_100k_com_respaldo',
      delta: 4,
      motivo: 'Aval até R$ 100k com respaldo.',
    })
  } else if (input.aval_tipo === 'puro_sem_respaldo') {
    deltas.push({
      fator: 'aval_puro_sem_respaldo',
      delta: -15,
      motivo: 'Aval puro sem respaldo patrimonial.',
    })
  }

  // ── 4) Cadastro (delta adicional do nível) ────────────────────
  const nivel = getNivelCadastro(input.cadastro_nivel)
  if (nivel?.delta_adicional) {
    deltas.push({
      fator: `cadastro_${nivel.id}`,
      delta: nivel.delta_adicional,
      motivo: `Cadastro ${nivel.nome} — pacote completo da consultoria.`,
    })
  }

  // ── 5) Histórico SCR ──────────────────────────────────────────
  switch (input.historico_scr) {
    case 'limpo':
      deltas.push({
        fator: 'scr_limpo',
        delta: 8,
        motivo: 'Histórico bancário limpo no Bacen.',
      })
      break
    case 'restricao_encerrada':
      deltas.push({
        fator: 'scr_restricao_encerrada',
        delta: 3,
        motivo: 'Restrição já encerrada — comitê valoriza.',
      })
      break
    case 'primeira_operacao':
      deltas.push({
        fator: 'scr_primeira_operacao',
        delta: -3,
        motivo: 'Primeira operação — comitê pede mais comprovação.',
      })
      break
    case 'com_restricao_ativa':
      deltas.push({
        fator: 'scr_restricao_ativa',
        delta: -25,
        motivo: 'Restrição ativa no SCR — bloqueador frequente.',
      })
      break
  }

  // ── 6) Endividamento ──────────────────────────────────────────
  if (input.endividamento_pct >= 100) {
    deltas.push({
      fator: 'endividamento_alto',
      delta: -18,
      motivo: `Endividamento de ${input.endividamento_pct}% da receita anual.`,
    })
  } else if (input.endividamento_pct >= 60) {
    deltas.push({
      fator: 'endividamento_moderado',
      delta: -8,
      motivo: `Endividamento moderado (${input.endividamento_pct}%).`,
    })
  } else if (input.endividamento_pct <= 20) {
    deltas.push({
      fator: 'endividamento_baixo',
      delta: 5,
      motivo: `Endividamento baixo (${input.endividamento_pct}%) — capacidade de pagamento boa.`,
    })
  }

  // ── 7) CAR ────────────────────────────────────────────────────
  switch (input.car) {
    case 'regular_averbado':
      deltas.push({
        fator: 'car_regular',
        delta: 6,
        motivo: 'CAR regular e averbado.',
      })
      break
    case 'inscrito_pendente':
      deltas.push({
        fator: 'car_pendente',
        delta: -4,
        motivo: 'CAR inscrito mas com pendência.',
      })
      break
    case 'nao_tem':
      // Regra dura — penaliza forte mas não bloqueia
      regrasDurasViolades.push(
        'CAR ausente — bloqueador comum em comitês ambientais.',
      )
      deltas.push({
        fator: 'regra_dura_car_ausente',
        delta: -40,
        motivo: 'Sem CAR — regra dura, score puxado pra baixo.',
      })
      break
  }

  if (input.car_suspenso) {
    regrasDurasViolades.push('CAR suspenso — comitê verá embargo.')
    deltas.push({
      fator: 'regra_dura_car_suspenso',
      delta: -40,
      motivo: 'CAR suspenso por embargo ambiental.',
    })
  }

  // ── 8) Seguro agrícola ────────────────────────────────────────
  if (input.tem_seguro_agricola) {
    deltas.push({
      fator: 'seguro_agricola',
      delta: 6,
      motivo: 'Seguro agrícola contratado — comitê ama.',
    })
  }

  // ── 9) Reciprocidade bancária ─────────────────────────────────
  switch (input.reciprocidade_bancaria) {
    case 'forte':
      deltas.push({
        fator: 'reciprocidade_forte',
        delta: 10,
        motivo: 'Relacionamento bancário forte — gerente defende.',
      })
      break
    case 'media':
      deltas.push({
        fator: 'reciprocidade_media',
        delta: 4,
        motivo: 'Relacionamento bancário médio.',
      })
      break
    case 'nenhuma':
      deltas.push({
        fator: 'reciprocidade_zero',
        delta: -5,
        motivo: 'Sem relacionamento prévio — comitê pesa risco.',
      })
      break
  }

  // ── 10) Estrutura fundiária ───────────────────────────────────
  switch (input.relacao_terra) {
    case 'proprio':
      deltas.push({
        fator: 'estrutura_fundiaria_proprio',
        delta: 8,
        motivo: 'Imóvel próprio — base patrimonial sólida.',
      })
      break
    case 'misto_proprio_arrendado':
      deltas.push({
        fator: 'estrutura_fundiaria_misto',
        delta: 2,
        motivo: 'Misto próprio + arrendado.',
      })
      break
    case 'maioria_arrendado':
      deltas.push({
        fator: 'estrutura_fundiaria_maioria_arrendado',
        delta: -8,
        motivo: 'Maioria arrendado — comitê pede mais garantia.',
      })
      break
    case 'totalmente_arrendado':
      deltas.push({
        fator: 'estrutura_fundiaria_totalmente_arrendado',
        delta: -20,
        motivo: '100% arrendatário — sem base patrimonial.',
      })
      break
  }

  // Arrendamento com anuência do proprietário (se arrendado)
  if (
    (input.relacao_terra === 'maioria_arrendado' ||
      input.relacao_terra === 'totalmente_arrendado') &&
    input.arrendamento_com_anuencia === false
  ) {
    regrasDurasViolades.push(
      'Contrato de arrendamento sem anuência registrada.',
    )
    deltas.push({
      fator: 'regra_dura_arrend_sem_anuencia',
      delta: -40,
      motivo: 'Arrendamento sem anuência — bloqueador comum.',
    })
  }

  // ── 11) Regras duras adicionais ───────────────────────────────
  if (!input.cpf_cnpj_regular) {
    regrasDurasViolades.push('CPF/CNPJ irregular na Receita.')
    deltas.push({
      fator: 'regra_dura_cpf_cnpj',
      delta: -40,
      motivo: 'CPF/CNPJ irregular — bloqueador absoluto inicial.',
    })
  }
  if (input.imovel_em_inventario) {
    regrasDurasViolades.push('Imóvel em inventário — sem matrícula limpa.')
    deltas.push({
      fator: 'regra_dura_inventario',
      delta: -40,
      motivo: 'Imóvel em inventário — comitê não consegue garantia.',
    })
  }
  if (!input.itr_em_dia) {
    regrasDurasViolades.push('ITR em atraso (5 últimos exercícios).')
    deltas.push({
      fator: 'regra_dura_itr',
      delta: -40,
      motivo: 'ITR em atraso — barra acesso a algumas linhas.',
    })
  }
  if (!input.ir_em_dia) {
    regrasDurasViolades.push('IR em atraso.')
    deltas.push({
      fator: 'regra_dura_ir',
      delta: -40,
      motivo: 'IR em atraso — comitê desconfia.',
    })
  }

  // Pequeno + DAP/CAF — regra positiva
  if (input.porte === 'pequeno' && input.tem_dap_caf) {
    deltas.push({
      fator: 'pronaf_dap_caf',
      delta: 8,
      motivo: 'CAF ativa — destrava linhas Pronaf com taxas menores.',
    })
  }

  // ── 12) Regra combinatória — arrendatário + aval ──────────────
  const reg = aplicarRegraArrendatario(input, deltas)
  const tetoExtraArrend = reg.teto_extra
  avisos.push(...reg.avisos)

  // ── 13) Regra combinatória — garantias múltiplas ──────────────
  const numPremiumComp = input.garantias.filter((g) =>
    GARANTIAS_PREMIUM_COMPLEMENTARES.includes(g),
  ).length
  const temGuardaChuva = input.garantias.includes(
    'alienacao_fiduciaria_guarda_chuva',
  )
  if (numPremiumComp >= 2) {
    const bonus = temGuardaChuva ? 8 : 5
    deltas.push({
      fator: 'combo_garantias_premium',
      delta: bonus,
      motivo: temGuardaChuva
        ? 'Combinação de garantias com guarda-chuva — comitê adora.'
        : 'Combinação de garantias premium complementares.',
    })
  }

  // ── 14) Modificadores de conjuntura sobre garantias ───────────
  for (const [gid, mod] of Object.entries(conjuntura.modificadores)) {
    if (mod === undefined || mod === 0) continue
    if (input.garantias.includes(gid as never)) {
      deltas.push({
        fator: `conjuntura_${gid}`,
        delta: mod,
        motivo: `Conjuntura ${conjuntura.vigencia}: ajuste em ${gid}.`,
      })
    }
  }

  // ── 15) Soma e teto ───────────────────────────────────────────
  let score = SCORE_BASE
  for (const d of deltas) score += d.delta

  const tetoCadastro = nivel?.teto_score ?? 80
  const tetoEfetivo = Math.min(tetoCadastro, tetoExtraArrend ?? 100)
  if (score > tetoEfetivo) score = tetoEfetivo

  // ── 16) Clampa 0..100 ─────────────────────────────────────────
  if (score < 0) score = 0
  if (score > 100) score = 100

  // ── 17) Faixa ─────────────────────────────────────────────────
  const faixa = calcFaixa(score)

  // ── 18) Radar 6 eixos ─────────────────────────────────────────
  const radar = montarRadar(input, cultura)

  // ── 19) Avisos contextuais (além dos da regra arrendatário) ───
  if (input.endividamento_pct >= 100) {
    avisos.push({
      tipo: 'critico',
      texto: 'Endividamento acima de 100% — refinanciamento ou redução de pleito é quase obrigatório.',
    })
  }
  if (input.historico_scr === 'com_restricao_ativa') {
    avisos.push({
      tipo: 'critico',
      texto: 'Restrição ativa no SCR é o principal bloqueador. Resolva antes de protocolar.',
    })
  }
  if (regrasDurasViolades.length > 0) {
    avisos.push({
      tipo: 'alerta',
      texto: `${regrasDurasViolades.length} regra${regrasDurasViolades.length === 1 ? '' : 's'} dura${regrasDurasViolades.length === 1 ? '' : 's'} violada${regrasDurasViolades.length === 1 ? '' : 's'} — não bloqueia simulação, mas o comitê pode rejeitar.`,
    })
  }
  for (const aviso of conjuntura.avisos) {
    avisos.push({ tipo: 'info', texto: aviso })
  }

  // ── 20) Plano de subida ───────────────────────────────────────
  const planoDeSubida = montarPlanoSubida(deltas, input, score)

  // ── 21) Teto de valor estimado ────────────────────────────────
  const tetoValor = calcTetoValor(input, cultura)

  return {
    score,
    faixa,
    teto_por_cadastro: tetoCadastro,
    radar,
    deltas_aplicados: deltas,
    avisos,
    linha_mcr_provavel: cultura?.linha_mcr_provavel ?? null,
    plano_de_subida: planoDeSubida,
    regras_duras_violadas: regrasDurasViolades,
    teto_valor_estimado: tetoValor,
  }
}

function calcFaixa(score: number): Faixa {
  if (score < 30) return 'muito_baixa'
  if (score < 50) return 'baixa'
  if (score < 70) return 'media'
  if (score < 85) return 'alta'
  return 'muito_alta'
}

function montarRadar(
  input: SimulatorInput,
  cultura: Cultura | undefined,
): RadarEixo[] {
  // Garantia: maior delta de garantia + bonus de combo
  const deltasGar = input.garantias.map(
    (g) => getGarantia(g)?.delta ?? 0,
  )
  const maxGar = deltasGar.length ? Math.max(...deltasGar) : 0
  const eixoGarantia = clamp01(50 + maxGar * 1.5)

  const eixoCultura = cultura
    ? clamp01(50 + cultura.delta_score_base * 8)
    : 50

  const eixoCadastro = (() => {
    switch (input.cadastro_nivel) {
      case 'desatualizado':
        return 35
      case 'atualizado_incompleto':
        return 65
      case 'padrao_agrobridge':
        return 95
    }
  })()

  const eixoHistorico = (() => {
    switch (input.historico_scr) {
      case 'limpo':
        return 90
      case 'restricao_encerrada':
        return 70
      case 'primeira_operacao':
        return 55
      case 'com_restricao_ativa':
        return 15
    }
  })()

  const eixoCapacidade = clamp01(100 - input.endividamento_pct * 0.7)

  const docsOk = [
    input.car === 'regular_averbado',
    input.itr_em_dia,
    input.ir_em_dia,
    input.cpf_cnpj_regular,
    input.georref_ok ?? false,
    input.tem_dap_caf ?? false,
  ].filter(Boolean).length
  const eixoDocumentacao = clamp01((docsOk / 6) * 100)

  return [
    { eixo: 'Garantia', valor: Math.round(eixoGarantia) },
    { eixo: 'Cultura', valor: Math.round(eixoCultura) },
    { eixo: 'Cadastro', valor: Math.round(eixoCadastro) },
    { eixo: 'Histórico', valor: Math.round(eixoHistorico) },
    { eixo: 'Capacidade', valor: Math.round(eixoCapacidade) },
    { eixo: 'Documentação', valor: Math.round(eixoDocumentacao) },
  ]
}

function clamp01(v: number): number {
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}

function montarPlanoSubida(
  deltas: DeltaAplicado[],
  input: SimulatorInput,
  scoreAtual: number,
): AcaoSubida[] {
  if (scoreAtual >= 85) return [] // Já está em "muito alta"

  const acoes: AcaoSubida[] = []

  // Cadastro
  if (input.cadastro_nivel === 'desatualizado') {
    acoes.push({
      acao: 'Atualizar cadastro pra "Atualizado completo" — destrava teto pra 80',
      ganho_estimado: 20,
      prazo_dias: 7,
    })
  } else if (input.cadastro_nivel === 'atualizado_incompleto') {
    acoes.push({
      acao: 'Completar pacote AgroBridge — destrava teto pra 100 + bônus +15',
      ganho_estimado: 15,
      prazo_dias: 14,
    })
  }

  // CAR
  if (input.car === 'nao_tem') {
    acoes.push({
      acao: 'Inscrever no CAR (SICAR.gov.br) — sai do bloqueador ambiental',
      ganho_estimado: 40,
      prazo_dias: 30,
    })
  } else if (input.car === 'inscrito_pendente') {
    acoes.push({
      acao: 'Resolver pendência do CAR e averbar',
      ganho_estimado: 10,
      prazo_dias: 30,
    })
  }

  // Seguro
  if (!input.tem_seguro_agricola) {
    acoes.push({
      acao: 'Contratar seguro agrícola (Proagro / privado)',
      ganho_estimado: 6,
      prazo_dias: 5,
    })
  }

  // Reciprocidade
  if (input.reciprocidade_bancaria === 'nenhuma') {
    acoes.push({
      acao: 'Movimentar conta no banco-alvo por 90 dias antes de protocolar',
      ganho_estimado: 9,
      prazo_dias: 90,
    })
  }

  // Garantia (se só tem garantia fraca)
  const temGarantiaForte = input.garantias.some((g) => {
    const ga = getGarantia(g)
    return ga && (ga.tier === 'forte' || ga.tier === 'premium')
  })
  if (!temGarantiaForte) {
    acoes.push({
      acao: 'Estruturar garantia forte (alienação fiduciária ou hipoteca 1º grau)',
      ganho_estimado: 18,
      prazo_dias: 21,
    })
  }

  // Endividamento alto
  if (input.endividamento_pct >= 100) {
    acoes.push({
      acao: 'Reduzir/refinanciar dívida atual antes de pleitear novo crédito',
      ganho_estimado: 18,
      prazo_dias: 60,
    })
  }

  // ITR/IR
  if (!input.itr_em_dia) {
    acoes.push({
      acao: 'Quitar ITR (5 últimos exercícios) na Receita',
      ganho_estimado: 40,
      prazo_dias: 7,
    })
  }
  if (!input.ir_em_dia) {
    acoes.push({
      acao: 'Regularizar declaração de IR',
      ganho_estimado: 40,
      prazo_dias: 14,
    })
  }

  // Ordena por ganho/prazo (rápido e impactante primeiro)
  acoes.sort(
    (a, b) =>
      b.ganho_estimado / b.prazo_dias - a.ganho_estimado / a.prazo_dias,
  )

  return acoes.slice(0, 4)
}

function calcTetoValor(
  input: SimulatorInput,
  cultura: Cultura | undefined,
): number | null {
  // Pra culturas com teto por hectare definido, estima teto teórico
  // baseado em valor pretendido (não temos área no input — usamos
  // um múltiplo conservador). Pra pecuária/integradas (teto 0/0),
  // retorna null.
  if (!cultura || cultura.teto_custeio_por_ha.max === 0) return null

  // Heurística simples: o valor pretendido ÉO teto desejado pelo lead.
  // Devolvemos uma faixa razoável: até 1.2× o pretendido se for plausível.
  return Math.round(input.valor_pretendido * 1.2)
}
