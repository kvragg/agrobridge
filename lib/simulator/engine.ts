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

// Múltiplos máximos do pleito sobre a renda bruta anual, calibrados
// pelo que comitês aplicam de cabeça. Quando ratio > teto+2, comitê
// quase certo pede redução. Entre teto e teto+2, defesa técnica.
const TETO_RATIO_POR_FINALIDADE: Record<
  SimulatorInput['finalidade'],
  number
> = {
  custeio: 3,
  investimento: 5,
  comercializacao: 2,
  industrializacao: 5,
}

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

  // ── 5.5) Dívida ativa em outros bancos ────────────────────────
  // Concentração de risco que o comitê do banco-alvo vai subtrair
  // do potencial de novo crédito. Diferente de historico_scr — aqui
  // é o presente, não passado.
  switch (input.divida_outros_bancos) {
    case 'nenhuma':
      deltas.push({
        fator: 'divida_outros_bancos_nenhuma',
        delta: 4,
        motivo: 'Sem operações ativas em outros bancos — relacionamento concentrado, comitê valoriza.',
      })
      break
    case 'em_dia':
      deltas.push({
        fator: 'divida_outros_bancos_em_dia',
        delta: -3,
        motivo: 'Operações ativas em outros bancos, em dia — concentração de risco a defender no comitê.',
      })
      break
    case 'com_atraso':
      deltas.push({
        fator: 'divida_outros_bancos_atraso',
        delta: -18,
        motivo: 'Operação ativa com atraso em outro banco — comitê pesa risco substancialmente.',
      })
      break
    case undefined:
      // Não informado — neutro.
      break
  }

  // ── 5.7) Pleito vs renda bruta anual ──────────────────────────
  // Sem renda informada (ou pleito ≤ 0) o engine não avalia ratio.
  // Múltiplos por finalidade refletem o que comitê aplica de cabeça:
  //   custeio: até 3× renda anual (giro de safra)
  //   investimento: até 5× renda anual (payback longo)
  //   comercializacao: até 2× renda anual (capital de giro curto)
  //   industrializacao: até 5× renda anual (CapEx similar a invest.)
  if (
    input.renda_bruta_anual &&
    input.renda_bruta_anual > 0 &&
    input.valor_pretendido > 0
  ) {
    const ratio = input.valor_pretendido / input.renda_bruta_anual
    const tetoRatio = TETO_RATIO_POR_FINALIDADE[input.finalidade]
    if (ratio > tetoRatio + 2) {
      deltas.push({
        fator: 'pleito_excede_renda',
        delta: -12,
        motivo: `Pleito de ${ratio.toFixed(1)}× a renda anual — muito acima do limite usual (${tetoRatio}× pra ${input.finalidade}). Comitê provavelmente pede redução.`,
      })
    } else if (ratio > tetoRatio) {
      deltas.push({
        fator: 'pleito_acima_padrao',
        delta: -5,
        motivo: `Pleito de ${ratio.toFixed(1)}× a renda anual — acima do padrão (${tetoRatio}× pra ${input.finalidade}). Defesa técnica reforçada necessária.`,
      })
    } else if (ratio < 1) {
      deltas.push({
        fator: 'pleito_compativel',
        delta: 3,
        motivo: `Pleito de ${ratio.toFixed(1)}× a renda anual — folgado, dentro do conforto do comitê.`,
      })
    }
  }

  // ── 6) Endividamento (% da receita anual) ─────────────────────
  // Capacidade de pagamento — quanto do faturamento anual já vai pra
  // serviço de dívida. Régua calibrada com prática de comitês 2026
  // (cenário Selic alta + RJs no agro):
  //   0-49%  saudável    → +6  (faturamento livre, comitê tranquilo)
  //   50-64% defensável  → 0   (atende com defesa do fluxo)
  //   65-79% alerta      → -10 (concentração de risco visível)
  //   80%+   improvável  → -20 (refinanciamento prévio recomendado)
  const eP = input.endividamento_pct
  if (eP >= 80) {
    deltas.push({
      fator: 'endividamento_improvavel',
      delta: -20,
      motivo: `Endividamento de ${eP}% da receita anual — zona "improvável", comitê pede refinanciamento prévio antes de novo pleito.`,
    })
  } else if (eP >= 65) {
    deltas.push({
      fator: 'endividamento_alerta',
      delta: -10,
      motivo: `Endividamento de ${eP}% — zona de alerta, comitê visualiza concentração de risco. Defesa do fluxo precisa estar impecável.`,
    })
  } else if (eP >= 50) {
    deltas.push({
      fator: 'endividamento_defensavel',
      delta: 0,
      motivo: `Endividamento de ${eP}% — zona defensável. Comitê atende com análise normal + defesa do fluxo de caixa.`,
    })
  } else if (eP >= 0) {
    deltas.push({
      fator: 'endividamento_saudavel',
      delta: 6,
      motivo: `Endividamento de ${eP}% — saudável. Capacidade de pagamento confortável, comitê aprova com naturalidade.`,
    })
  }

  // ── 6.5) Alavancagem patrimonial (% do patrimônio comprometido) ─
  // Cenário 2026: comitês olham com lupa quem passa de 70% por causa
  // da onda de RJs no agro. Eixo "se a operação azedar, sobra colateral?".
  // Complementar ao endividamento por receita — os dois coexistem.
  switch (input.divida_patrimonio_faixa) {
    case 'ate_50':
      deltas.push({
        fator: 'alavancagem_patrimonial_baixa',
        delta: 5,
        motivo:
          'Até 50% do patrimônio comprometido — comitê vê com bons olhos, folga patrimonial confortável.',
      })
      break
    case 'de_51_a_70':
      deltas.push({
        fator: 'alavancagem_patrimonial_moderada',
        delta: -6,
        motivo:
          '51-70% do patrimônio comprometido — atende com ressalvas, comitê pede defesa do fluxo.',
      })
      break
    case 'de_71_a_85':
      deltas.push({
        fator: 'alavancagem_patrimonial_alerta',
        delta: -14,
        motivo:
          '71-85% do patrimônio comprometido — zona de alerta no cenário 2026 (RJs em alta).',
      })
      break
    case 'acima_85':
      deltas.push({
        fator: 'alavancagem_patrimonial_critica',
        delta: -22,
        motivo:
          'Acima de 85% do patrimônio comprometido — alavancagem crítica, operação improvável sem reestruturação.',
      })
      break
    case 'nao_sei':
    case undefined:
      // Não aplica delta — IA do chat aprofunda no Turno 3.
      break
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
    regrasDurasViolades.push('ITR em atraso (último exercício).')
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
  // Calibração: 2 premium = +5 (ou +8 se guarda-chuva). Cada premium
  // adicional (3°, 4°+) adiciona +3 — escalável até teto pra evitar
  // soma absurda. Comitê valoriza camadas, mas com retorno decrescente.
  const numPremiumComp = input.garantias.filter((g) =>
    GARANTIAS_PREMIUM_COMPLEMENTARES.includes(g),
  ).length
  const temGuardaChuva = input.garantias.includes(
    'alienacao_fiduciaria_guarda_chuva',
  )
  if (numPremiumComp >= 2) {
    const bonusBase = temGuardaChuva ? 8 : 5
    const bonusExtras = Math.min(numPremiumComp - 2, 3) * 3
    const bonusTotal = bonusBase + bonusExtras
    deltas.push({
      fator: 'combo_garantias_premium',
      delta: bonusTotal,
      motivo:
        numPremiumComp === 2
          ? temGuardaChuva
            ? 'Combinação de 2 garantias com guarda-chuva — comitê adora.'
            : 'Combinação de 2 garantias premium complementares.'
          : `Combinação de ${numPremiumComp} garantias premium${temGuardaChuva ? ' com guarda-chuva' : ''} — camadas reforçadas.`,
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
  if (input.endividamento_pct >= 80) {
    avisos.push({
      tipo: 'critico',
      texto: `Endividamento ${input.endividamento_pct}% da receita — zona improvável. Refinanciamento ou redução do pleito quase obrigatórios antes de protocolar.`,
    })
  } else if (input.endividamento_pct >= 65) {
    avisos.push({
      tipo: 'alerta',
      texto: `Endividamento ${input.endividamento_pct}% — zona de alerta. Comitê vai pedir defesa robusta do fluxo de caixa e estresse na garantia.`,
    })
  }
  if (input.divida_outros_bancos === 'com_atraso') {
    avisos.push({
      tipo: 'critico',
      texto:
        'Operação com atraso em outro banco — bloqueador frequente. Regularize antes de protocolar novo pleito (ou mostre o pagamento atualizado em comprovante recente).',
    })
  }
  if (
    input.renda_bruta_anual &&
    input.renda_bruta_anual > 0 &&
    input.valor_pretendido / input.renda_bruta_anual >
      (input.finalidade === 'investimento' ? 5 : 3) + 2
  ) {
    avisos.push({
      tipo: 'critico',
      texto: `Pleito muito acima do múltiplo usual da renda — comitê provavelmente vai pedir redução. Considere pleitear menos OU comprovar renda complementar.`,
    })
  }
  if (input.divida_patrimonio_faixa === 'acima_85') {
    avisos.push({
      tipo: 'critico',
      texto:
        'Alavancagem patrimonial acima de 85% — operação improvável sem reestruturação. Cenário 2026 com onda de RJs no agro deixou comitês muito conservadores nessa zona.',
    })
  } else if (input.divida_patrimonio_faixa === 'de_71_a_85') {
    avisos.push({
      tipo: 'alerta',
      texto:
        'Alavancagem patrimonial em 71-85% — zona de alerta. Comitê vai pedir defesa robusta. Considere garantia premium (alienação fiduciária ou investimento dado em garantia).',
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

  // Eixo "Capacidade" combina dois ângulos quando ambos disponíveis:
  //   (a) endividamento sobre receita → "consegue pagar?"
  //   (b) alavancagem patrimonial → "sobra colateral se azedar?"
  // Média ponderada 60/40 quando alavancagem informada; só (a) quando
  // não-informada ou 'nao_sei'.
  //
  // Função piecewise não-linear alinhada com a régua de produto:
  //   0-49%  → 95..75 (saudável → bonifica)
  //   50-64% → 75..55 (defensável → neutro)
  //   65-79% → 55..30 (alerta → puxa pra baixo)
  //   80%+   → 30..5  (improvável → fundo do poço)
  // Curva penaliza progressivamente, refletindo aversão crescente do
  // comitê conforme entra em cada zona.
  const eixoCaixa = (() => {
    const p = Math.max(0, input.endividamento_pct)
    if (p < 50) return 95 - (p / 50) * 20
    if (p < 65) return 75 - ((p - 50) / 15) * 20
    if (p < 80) return 55 - ((p - 65) / 15) * 25
    return Math.max(5, 30 - (p - 80) * 0.5)
  })()
  const eixoPatrimonio = (() => {
    switch (input.divida_patrimonio_faixa) {
      case 'ate_50':
        return 90
      case 'de_51_a_70':
        return 60
      case 'de_71_a_85':
        return 30
      case 'acima_85':
        return 10
      case 'nao_sei':
      case undefined:
        return null
    }
  })()
  const eixoCapacidade =
    eixoPatrimonio === null
      ? clamp01(eixoCaixa)
      : clamp01(eixoCaixa * 0.6 + eixoPatrimonio * 0.4)

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

  // Atraso em outro banco
  if (input.divida_outros_bancos === 'com_atraso') {
    acoes.push({
      acao: 'Regularizar a operação em atraso em outro banco antes de protocolar (puxar comprovante de pagamento atualizado pra anexar)',
      ganho_estimado: 18,
      prazo_dias: 21,
    })
  }

  // Pleito acima da régua de renda
  if (
    input.renda_bruta_anual &&
    input.renda_bruta_anual > 0 &&
    input.valor_pretendido / input.renda_bruta_anual >
      (input.finalidade === 'investimento' ? 5 : 3)
  ) {
    acoes.push({
      acao: 'Reduzir o pleito pra dentro do múltiplo usual da renda (3× custeio · 5× investimento) OU comprovar renda complementar formal',
      ganho_estimado: 10,
      prazo_dias: 7,
    })
  }

  // Endividamento sobre receita — ações por faixa da régua nova
  if (input.endividamento_pct >= 80) {
    acoes.push({
      acao: 'Reduzir/refinanciar dívida pra abaixo de 65% da receita anual antes de protocolar (zona improvável → alerta)',
      ganho_estimado: 30,
      prazo_dias: 90,
    })
  } else if (input.endividamento_pct >= 65) {
    acoes.push({
      acao: 'Reduzir endividamento pra abaixo de 50% da receita (alerta → defensável/saudável)',
      ganho_estimado: 16,
      prazo_dias: 60,
    })
  } else if (input.endividamento_pct >= 50) {
    acoes.push({
      acao: 'Otimizar endividamento pra abaixo de 50% (defensável → saudável) — bonifica score',
      ganho_estimado: 6,
      prazo_dias: 60,
    })
  }

  // Alavancagem patrimonial alta (sobre patrimônio real)
  if (
    input.divida_patrimonio_faixa === 'de_71_a_85' ||
    input.divida_patrimonio_faixa === 'acima_85'
  ) {
    acoes.push({
      acao:
        'Reduzir alavancagem patrimonial — quitar/refinanciar parte da dívida ou complementar com investimento dado em garantia (CDB/LCA)',
      ganho_estimado: input.divida_patrimonio_faixa === 'acima_85' ? 22 : 14,
      prazo_dias: 90,
    })
  }

  // ITR/IR
  if (!input.itr_em_dia) {
    acoes.push({
      acao: 'Quitar ITR (último exercício) na Receita',
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

  // Ordena: regras duras primeiro (bloqueadores que travam linhas
  // inteiras), depois ganho/prazo. CAR ausente, CPF irregular,
  // imóvel em inventário, ITR/IR atrasado — não adianta otimizar
  // garantia se isso não estiver resolvido.
  const isRegraDura = (acao: AcaoSubida): boolean =>
    /CAR \(SICAR|CPF\/CNPJ|inventário|ITR|IR \b|atrasado/i.test(acao.acao)
  acoes.sort((a, b) => {
    const ad = isRegraDura(a) ? 1 : 0
    const bd = isRegraDura(b) ? 1 : 0
    if (ad !== bd) return bd - ad
    return b.ganho_estimado / b.prazo_dias - a.ganho_estimado / a.prazo_dias
  })

  return acoes.slice(0, 4)
}

function calcTetoValor(
  input: SimulatorInput,
  cultura: Cultura | undefined,
): number | null {
  // Quando renda anual informada, usa múltiplo realista por finalidade:
  // custeio até 3× renda, investimento até 5×. É a primeira régua que
  // comitê aplica antes de olhar garantia/cadastro.
  if (input.renda_bruta_anual && input.renda_bruta_anual > 0) {
    const mult = input.finalidade === 'investimento' ? 5 : 3
    return Math.round(input.renda_bruta_anual * mult)
  }
  // Pra culturas com teto por hectare definido, estima teto teórico
  // baseado em valor pretendido (não temos área no input — usamos
  // um múltiplo conservador). Pra pecuária/integradas (teto 0/0),
  // retorna null.
  if (!cultura || cultura.teto_custeio_por_ha.max === 0) return null
  return Math.round(input.valor_pretendido * 1.2)
}
