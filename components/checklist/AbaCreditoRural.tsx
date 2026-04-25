"use client"

import { useMemo } from "react"
import {
  CHECKLIST_PADRAO,
  filtrarChecklistPorContexto,
  type ContextoChecklist,
} from "@/data/checklist-padrao"
import { Chip, ItemCard, isQuickWin, ordenarComQuickWins } from "./_shared"

interface Props {
  investimento: boolean
  pronaf: boolean
  abertos: Set<string>
  concluidos: Set<string>
  onInvestimentoChange: (v: boolean) => void
  onPronafChange: (v: boolean) => void
  onToggleAberto: (id: string) => void
  onMarcarConcluido: (id: string, marcado: boolean) => void
}

/**
 * Aba 2 — Crédito Rural.
 *
 * Documentos da operação que independem de PF/PJ (CAR, CCIR, ITR, matrícula,
 * certidões, projeto/croqui se investimento, comprovante de produção, CAF se
 * Pronaf). Refinos: investimento + Pronaf.
 */
export function AbaCreditoRural({
  investimento,
  pronaf,
  abertos,
  concluidos,
  onInvestimentoChange,
  onPronafChange,
  onToggleAberto,
  onMarcarConcluido,
}: Props) {
  const items = useMemo(() => {
    // Como queremos só os items de credito_rural, qualquer leadType serve —
    // a função filtra "todos" item por contexto. Uso 'pf' por padrão.
    const ctx: ContextoChecklist = {
      leadType: "pf",
      casado: false,
      investimento,
      pronaf,
    }
    const all = filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctx).filter(
      (i) => i.grupo === "credito_rural",
    )
    return ordenarComQuickWins(all)
  }, [investimento, pronaf])

  return (
    <div>
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Documentos da operação
        </div>
        <h2
          style={{
            margin: "4px 0 4px",
            fontSize: "clamp(18px, 2.2vw, 22px)",
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
          }}
        >
          Crédito Rural
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          Esses documentos valem pra Pessoa Física e Pessoa Jurídica. Refine
          abaixo se a operação for de investimento ou se você se enquadra no
          Pronaf — itens que não se aplicam somem da lista.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginRight: 4,
          }}
        >
          Refinar:
        </span>
        <Chip ativa={investimento} onToggle={() => onInvestimentoChange(!investimento)}>
          Operação de investimento (não custeio)
        </Chip>
        <Chip ativa={pronaf} onToggle={() => onPronafChange(!pronaf)}>
          Me enquadro no Pronaf
        </Chip>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            aberto={abertos.has(item.id)}
            concluido={concluidos.has(item.id)}
            quickWin={isQuickWin(item.id)}
            onToggle={() => onToggleAberto(item.id)}
            onConcluir={(v) => onMarcarConcluido(item.id, v)}
          />
        ))}
      </div>
    </div>
  )
}
