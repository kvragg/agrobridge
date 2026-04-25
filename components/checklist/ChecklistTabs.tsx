"use client"

import { useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/landing/primitives"
import {
  CHECKLIST_PADRAO,
  filtrarChecklistPorContexto,
  itensDoSocio,
  type ContextoChecklist,
  type ItemChecklistPadrao,
} from "@/data/checklist-padrao"
import type { LeadType, SocioPJ } from "@/types/perfil-lead"
import { AbaCadastro } from "./AbaCadastro"
import { AbaCreditoRural } from "./AbaCreditoRural"
import { AbaDossie } from "./AbaDossie"
import { mensagemMotivacional } from "./_shared"

type Aba = "cadastro" | "credito" | "dossie"

interface Props {
  nome: string | null
  leadType: LeadType
  socios: SocioPJ[]
  casado: boolean
  investimento: boolean
  pronaf: boolean
  fezEntrevista: boolean
  isFree: boolean
  /** Tem processo pago — usado pela aba Dossiê. */
  temProcessoPago: boolean
  /** Processo ID se houver — usado pela aba Dossiê pra deep-link. */
  processoId: string | null
}

const STORAGE_ABA = "agro_chk_aba"
const STORAGE_CONCLUIDOS = "agro_chk_concluidos"

/**
 * Orquestrador das 3 abas (Cadastro / Crédito Rural / Dossiê).
 *
 * Centraliza state de:
 *   - aba ativa (persistida em localStorage)
 *   - leadType, socios (sincronizados com backend via APIs)
 *   - refinos (casado, investimento, pronaf) — visuais, não persistem
 *   - abertos, concluidos (visuais; concluidos persiste em localStorage)
 *
 * Cada aba é uma view focada — lead vê um contexto por vez. Indicadores
 * por aba mostram quanto falta sem precisar entrar.
 */
export function ChecklistTabs({
  nome,
  leadType: leadTypeInicial,
  socios: sociosIniciais,
  casado: casadoInicial,
  investimento: investimentoInicial,
  pronaf: pronafInicial,
  fezEntrevista,
  isFree,
  temProcessoPago,
  processoId,
}: Props) {
  const [aba, setAba] = useState<Aba>("cadastro")
  const [leadType, setLeadType] = useState<LeadType>(leadTypeInicial)
  const [socios, setSocios] = useState<SocioPJ[]>(sociosIniciais)
  const [casado, setCasado] = useState(casadoInicial)
  const [investimento, setInvestimento] = useState(investimentoInicial)
  const [pronaf, setPronaf] = useState(pronafInicial)
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [hidratado, setHidratado] = useState(false)

  // Hidratação: lê aba e concluidos do localStorage no mount.
  // setState no effect é OK aqui pq localStorage não existe no SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const a = localStorage.getItem(STORAGE_ABA)
      if (a === "cadastro" || a === "credito" || a === "dossie") setAba(a)
      const c = localStorage.getItem(STORAGE_CONCLUIDOS)
      if (c) setConcluidos(new Set(JSON.parse(c)))
    } catch {
      // ignore
    }
    setHidratado(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persiste aba
  useEffect(() => {
    if (!hidratado) return
    try {
      localStorage.setItem(STORAGE_ABA, aba)
    } catch {
      // ignore
    }
  }, [aba, hidratado])

  // Persiste concluidos (só após hidratação pra não sobrescrever com vazio)
  useEffect(() => {
    if (!hidratado) return
    try {
      localStorage.setItem(STORAGE_CONCLUIDOS, JSON.stringify(Array.from(concluidos)))
    } catch {
      // ignore
    }
  }, [concluidos, hidratado])

  // Permite outras telas (CTA da aba Dossiê) trocar de aba via custom event
  useEffect(() => {
    function listener(ev: Event) {
      const detail = (ev as CustomEvent<{ aba: Aba }>).detail
      if (detail?.aba) setAba(detail.aba)
    }
    window.addEventListener("agro:trocar-aba", listener)
    return () => window.removeEventListener("agro:trocar-aba", listener)
  }, [])

  function toggleAberto(id: string) {
    setAbertos((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function marcarConcluido(id: string, marcado: boolean) {
    setConcluidos((s) => {
      const next = new Set(s)
      if (marcado) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // ─── Stats por aba (usadas pelos indicadores no header) ──────────────
  const stats = useMemo(() => {
    const ctxCadastro: ContextoChecklist = {
      leadType,
      casado,
      investimento: false,
      pronaf: false,
    }
    const itensCadastro = filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctxCadastro).filter(
      (i) => i.grupo === "cadastro" || i.grupo === "empresa",
    )
    const itensSocios: ItemChecklistPadrao[] =
      leadType === "pj" ? socios.flatMap((s) => itensDoSocio(s)) : []
    const totalCadastro = [...itensCadastro, ...itensSocios]
    const cadObr = totalCadastro.filter((i) => i.obrigatorio)
    const cadPronto = cadObr.filter((i) => concluidos.has(i.id)).length

    const ctxCredito: ContextoChecklist = {
      leadType: "pf",
      casado: false,
      investimento,
      pronaf,
    }
    const itensCredito = filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctxCredito).filter(
      (i) => i.grupo === "credito_rural",
    )
    const credObr = itensCredito.filter((i) => i.obrigatorio)
    const credPronto = credObr.filter((i) => concluidos.has(i.id)).length

    const totalObr = cadObr.length + credObr.length
    const totalPronto = cadPronto + credPronto

    return {
      cadastro: { pronto: cadPronto, total: cadObr.length },
      credito: { pronto: credPronto, total: credObr.length },
      total: { pronto: totalPronto, total: totalObr },
    }
  }, [leadType, socios, casado, investimento, pronaf, concluidos])

  const pctTotal =
    stats.total.total === 0
      ? 0
      : Math.round((stats.total.pronto / stats.total.total) * 100)

  return (
    <div>
      <Greeting nome={nome} pct={pctTotal} />

      <TabsHeader
        aba={aba}
        onAba={setAba}
        statsCadastro={stats.cadastro}
        statsCredito={stats.credito}
      />

      <div style={{ marginTop: 22 }}>
        {aba === "cadastro" && (
          <AbaCadastro
            leadType={leadType}
            socios={socios}
            casado={casado}
            abertos={abertos}
            concluidos={concluidos}
            onLeadTypeChange={setLeadType}
            onSociosChange={setSocios}
            onCasadoChange={setCasado}
            onToggleAberto={toggleAberto}
            onMarcarConcluido={marcarConcluido}
          />
        )}
        {aba === "credito" && (
          <AbaCreditoRural
            investimento={investimento}
            pronaf={pronaf}
            abertos={abertos}
            concluidos={concluidos}
            onInvestimentoChange={setInvestimento}
            onPronafChange={setPronaf}
            onToggleAberto={toggleAberto}
            onMarcarConcluido={marcarConcluido}
          />
        )}
        {aba === "dossie" && (
          <AbaDossie
            isFree={isFree}
            fezEntrevista={fezEntrevista}
            temProcessoPago={temProcessoPago}
            processoId={processoId}
            obrigPronto={stats.total.pronto}
            obrigTotal={stats.total.total}
          />
        )}
      </div>
    </div>
  )
}

// ─── Greeting + microcopy ────────────────────────────────────────────

function Greeting({ nome, pct }: { nome: string | null; pct: number }) {
  const primeiroNome = (nome ?? "").trim().split(/\s+/)[0] || null
  const msg = mensagemMotivacional(pct)
  return (
    <div style={{ marginBottom: 18 }}>
      <h2
        style={{
          margin: 0,
          fontSize: "clamp(20px, 2.4vw, 26px)",
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        {primeiroNome ? `${primeiroNome}, ` : ""}
        {msg}
      </h2>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 13.5,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        Marcamos automaticamente o que você completar — pode fechar e voltar
        quando quiser.
      </p>
    </div>
  )
}

// ─── Header de tabs ──────────────────────────────────────────────────

function TabsHeader({
  aba,
  onAba,
  statsCadastro,
  statsCredito,
}: {
  aba: Aba
  onAba: (a: Aba) => void
  statsCadastro: { pronto: number; total: number }
  statsCredito: { pronto: number; total: number }
}) {
  return (
    <div
      role="tablist"
      aria-label="Etapas do checklist"
      style={{
        display: "flex",
        gap: 4,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 4,
        flexWrap: "wrap",
      }}
    >
      <Tab
        ativa={aba === "cadastro"}
        onClick={() => onAba("cadastro")}
        numero="1"
        titulo="Cadastro"
        contagem={`${statsCadastro.pronto}/${statsCadastro.total || 0}`}
        completo={statsCadastro.total > 0 && statsCadastro.pronto === statsCadastro.total}
      />
      <Tab
        ativa={aba === "credito"}
        onClick={() => onAba("credito")}
        numero="2"
        titulo="Crédito Rural"
        contagem={`${statsCredito.pronto}/${statsCredito.total || 0}`}
        completo={statsCredito.total > 0 && statsCredito.pronto === statsCredito.total}
      />
      <Tab
        ativa={aba === "dossie"}
        onClick={() => onAba("dossie")}
        numero="3"
        titulo="Dossiê"
        contagem="análise final"
        completo={false}
      />
    </div>
  )
}

function Tab({
  ativa,
  onClick,
  numero,
  titulo,
  contagem,
  completo,
}: {
  ativa: boolean
  onClick: () => void
  numero: string
  titulo: string
  contagem: string
  completo: boolean
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativa}
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 160,
        padding: "12px 16px",
        background: ativa
          ? "linear-gradient(180deg, rgba(78,168,132,0.18) 0%, rgba(12,15,18,0.65) 100%)"
          : "transparent",
        border: ativa
          ? "1px solid rgba(78,168,132,0.45)"
          : "1px solid transparent",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        transition: "all .2s",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ativa ? "var(--green)" : "var(--muted)",
          }}
        >
          {numero}
        </span>
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: ativa ? "var(--ink)" : "var(--ink-2)",
            letterSpacing: "-0.01em",
          }}
        >
          {titulo}
        </span>
        {completo && (
          <span style={{ color: "var(--green)" }} aria-label="bloco completo">
            {Icon.check(13)}
          </span>
        )}
      </div>
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {contagem}
      </span>
    </button>
  )
}
