// Regras combinatórias — interações entre fatores que mudam o efeito
// individual. Aplicadas APÓS os deltas isolados.

import type { SimulatorInput, DeltaAplicado, AvisoCtx } from '../types'

/**
 * Regra do arrendatário 100% — quem aluga toda a área tem teto baixo
 * de aprovação a menos que o aval seja muito forte.
 *
 * Ajusta deltas existentes (mutating) e devolve avisos.
 */
export function aplicarRegraArrendatario(
  input: SimulatorInput,
  deltas: DeltaAplicado[],
): { deltas: DeltaAplicado[]; avisos: AvisoCtx[]; teto_extra?: number } {
  if (input.relacao_terra !== 'totalmente_arrendado') {
    return { deltas, avisos: [] }
  }

  const aval = input.aval_tipo
  const avisos: AvisoCtx[] = []

  // Encontra delta do arrendatário (já aplicado por estrutura fundiária)
  const idxArrendatario = deltas.findIndex(
    (d) => d.fator === 'estrutura_fundiaria_totalmente_arrendado',
  )
  const deltaArrendOriginal =
    idxArrendatario >= 0 ? deltas[idxArrendatario].delta : -20

  // Encontra delta de aval (se houver)
  const idxAvalAmplo = deltas.findIndex(
    (d) => d.fator === 'aval_amplo_amparo_patrimonial',
  )
  const idxAval100k = deltas.findIndex(
    (d) => d.fator === 'aval_ate_100k_com_respaldo',
  )

  if (aval === 'amplo_amparo_patrimonial') {
    // Alivia o -20 do arrendatário pra -12, reforça aval +2 pra +6
    if (idxArrendatario >= 0) {
      deltas[idxArrendatario] = {
        ...deltas[idxArrendatario],
        delta: -12,
        motivo:
          'Arrendatário 100% atenuado pelo aval com amplo amparo patrimonial.',
      }
    }
    if (idxAvalAmplo >= 0) {
      deltas[idxAvalAmplo] = {
        ...deltas[idxAvalAmplo],
        delta: 6,
        motivo:
          'Aval com amplo amparo patrimonial reforçado em arrendatário 100%.',
      }
    } else {
      deltas.push({
        fator: 'combo_arrendatario_aval_amplo',
        delta: 6,
        motivo: 'Aval com amplo amparo patrimonial em arrendatário 100%.',
      })
    }
    avisos.push({
      tipo: 'info',
      texto:
        'Viável mas depende da aceitação do aval pelo comitê. Chance moderada.',
    })
    return { deltas, avisos }
  }

  if (aval === 'ate_100k_com_respaldo') {
    if (idxArrendatario >= 0) {
      deltas[idxArrendatario] = {
        ...deltas[idxArrendatario],
        delta: -16,
        motivo:
          'Arrendatário 100% pouco atenuado pelo aval limitado (até R$ 100k).',
      }
    }
    if (idxAval100k < 0) {
      deltas.push({
        fator: 'combo_arrendatario_aval_100k',
        delta: 4,
        motivo: 'Aval até R$ 100k em arrendatário 100%.',
      })
    }
    avisos.push({
      tipo: 'alerta',
      texto:
        'Viável só pra valor pequeno. Comitê olha o aval com lupa nesse cenário.',
    })
    return { deltas, avisos }
  }

  if (aval === 'puro_sem_respaldo') {
    // Mantém ambos como estão
    avisos.push({
      tipo: 'critico',
      texto:
        'Chance remota com aval puro em arrendatário 100%. Estruture garantia real (alienação fiduciária ou cessão de creditórios).',
    })
    return { deltas, avisos }
  }

  // Sem aval ou nenhum
  if (!aval || aval === 'nenhum') {
    if (idxArrendatario >= 0) {
      deltas[idxArrendatario] = {
        ...deltas[idxArrendatario],
        delta: deltaArrendOriginal,
        motivo:
          'Arrendatário 100% sem aval — operação muito difícil.',
      }
    }
    avisos.push({
      tipo: 'critico',
      texto:
        'Operação difícil sem garantia real. Considere upgrade pro plano Prata pra desenhar a estrutura adequada.',
    })
    // Teto extra de 40 quando nada compensa
    return { deltas, avisos, teto_extra: 40 }
  }

  return { deltas, avisos }
}
