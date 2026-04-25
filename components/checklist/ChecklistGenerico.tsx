"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Button,
  Eyebrow,
  GlassCard,
  Icon,
} from "@/components/landing/primitives"
import {
  CHECKLIST_PADRAO,
  CATEGORIA_CHECKLIST_LABEL,
  GRUPO_CHECKLIST_LABEL,
  GRUPO_CHECKLIST_DESCRICAO,
  ITENS_POR_SOCIO,
  filtrarChecklistPorContexto,
  itensDoSocio,
  type GrupoChecklist,
  type ItemChecklistPadrao,
  type ContextoChecklist,
} from "@/data/checklist-padrao"
import type { SocioPJ, EstadoCivilSocio, LeadType } from "@/types/perfil-lead"

const GRUPO_ORDEM: GrupoChecklist[] = [
  "cadastro",
  "empresa",
  "socios",
  "credito_rural",
]

// Slugs de items de "quick win" — fáceis e rápidos. Lead começa por aqui
// pra ganhar momentum (gatilho: foot-in-the-door / completion bias).
const QUICK_WIN_SLUGS = new Set([
  "cnh",
  "comprovante_endereco",
  "socio_cnh",
  "socio_comprovante_endereco",
  "comprovante_endereco_empresa",
])

const ESTADO_CIVIL_LABEL: Record<EstadoCivilSocio, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União estável",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
}

interface Props {
  nome: string | null
  leadType: LeadType
  /** Sócios da PJ — só relevante se leadType='pj'. */
  socios: SocioPJ[]
  /** Estado civil casado/união estável — controla itens de cônjuge. */
  casado: boolean
  /** Operação de investimento — controla projeto/croqui/estudo limites. */
  investimento: boolean
  /** Lead se enquadra no Pronaf — controla CAF/DAP. */
  pronaf: boolean
  /** Se o user fez entrevista (mesmo sem pagar) — muda CTA. */
  fezEntrevista?: boolean
  /** Se o user é Free (sem pagar) — muda CTA do final. */
  isFree?: boolean
}

/**
 * Checklist genérico — exibido em /checklist quando o usuário ainda
 * não tem processo (não fez entrevista ou não pagou).
 *
 * UX anti-abandono (gatilhos psicológicos explícitos):
 *   - Greeting pelo nome (pertencimento)
 *   - Progresso visível sempre (completion bias / Zeigarnik)
 *   - Quick wins primeiro (foot-in-the-door)
 *   - Microcopy por banda de progresso (encorajamento contextual)
 *   - Marcar "já tenho" salvo no localStorage (persistência sem fricção)
 *   - Sub-accordion por sócio com seu próprio mini-checklist
 *   - Toggle inline pra "casado / investimento / Pronaf" — refinar
 *     o checklist sem voltar pra entrevista
 */
export function ChecklistGenerico({
  nome,
  leadType: leadTypeInicial,
  socios: sociosIniciais,
  casado: casadoInicial,
  investimento: investimentoInicial,
  pronaf: pronafInicial,
  fezEntrevista = false,
  isFree = true,
}: Props) {
  const [leadType, setLeadType] = useState<LeadType>(leadTypeInicial)
  const [socios, setSocios] = useState<SocioPJ[]>(sociosIniciais)
  const [casado, setCasado] = useState(casadoInicial)
  const [investimento, setInvestimento] = useState(investimentoInicial)
  const [pronaf, setPronaf] = useState(pronafInicial)

  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())
  const [socioModal, setSocioModal] = useState<SocioPJ | "novo" | null>(null)
  const [tipoModalAberto, setTipoModalAberto] = useState(false)

  // Carrega "concluídos" do localStorage no mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("agro_chk_concluidos")
      if (raw) setConcluidos(new Set(JSON.parse(raw)))
    } catch {
      // localStorage indisponível (modo privado etc) — ignora.
    }
  }, [])

  // Salva sempre que muda.
  useEffect(() => {
    try {
      localStorage.setItem(
        "agro_chk_concluidos",
        JSON.stringify(Array.from(concluidos)),
      )
    } catch {
      // ignore
    }
  }, [concluidos])

  function toggle(id: string) {
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

  // ─── Monta lista efetiva de items conforme contexto ─────────────────
  const ctx: ContextoChecklist = { leadType, casado, investimento, pronaf }

  const itemsFixos = useMemo(
    () => filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leadType, casado, investimento, pronaf],
  )

  const itemsSociosPorSocio = useMemo(() => {
    if (leadType !== "pj") return new Map<string, ReturnType<typeof itensDoSocio>>()
    const map = new Map<string, ReturnType<typeof itensDoSocio>>()
    for (const s of socios) {
      map.set(s.id, itensDoSocio(s))
    }
    return map
  }, [leadType, socios])

  const todosItems = useMemo(() => {
    const all: ItemChecklistPadrao[] = [...itemsFixos]
    for (const items of itemsSociosPorSocio.values()) {
      all.push(...items)
    }
    return all
  }, [itemsFixos, itemsSociosPorSocio])

  // Stats globais
  const totalObrig = todosItems.filter((i) => i.obrigatorio).length
  const concluidosObrig = todosItems.filter(
    (i) => i.obrigatorio && concluidos.has(i.id),
  ).length
  const pct = totalObrig === 0 ? 0 : Math.round((concluidosObrig / totalObrig) * 100)

  const microcopia = mensagemMotivacional(pct, nome, leadType)

  // ─── Agrupa fixos por GRUPO ─────────────────────────────────────────
  const porGrupo = new Map<GrupoChecklist, ItemChecklistPadrao[]>()
  for (const item of itemsFixos) {
    const arr = porGrupo.get(item.grupo) ?? []
    arr.push(item)
    porGrupo.set(item.grupo, arr)
  }

  // Quick wins primeiro dentro de cada grupo (gatilho: foot-in-the-door)
  for (const [g, items] of porGrupo) {
    porGrupo.set(
      g,
      [...items].sort((a, b) => {
        const aIsQuick = QUICK_WIN_SLUGS.has(a.id) ? -1 : 0
        const bIsQuick = QUICK_WIN_SLUGS.has(b.id) ? -1 : 0
        return aIsQuick - bIsQuick
      }),
    )
  }

  return (
    <div>
      {/* ─── Greeting pessoal + progresso (cabeçalho fixo) ─── */}
      <ProgressoHero
        nome={nome}
        leadType={leadType}
        pct={pct}
        concluidosObrig={concluidosObrig}
        totalObrig={totalObrig}
        microcopia={microcopia}
        onAbrirTipo={() => setTipoModalAberto(true)}
      />

      {/* ─── Refinos inline (gatilho: controle / autonomia) ─── */}
      <RefinosInline
        leadType={leadType}
        casado={casado}
        investimento={investimento}
        pronaf={pronaf}
        onCasado={setCasado}
        onInvestimento={setInvestimento}
        onPronaf={setPronaf}
      />

      {/* ─── Banner entrevista (se ainda não fez) ─── */}
      {!fezEntrevista && (
        <GlassCard glow="gold" padding={20} hover={false} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(201,168,106,0.14)",
                color: "var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {Icon.spark(16)}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Quer um checklist <strong style={{ color: "var(--gold)" }}>personalizado</strong>?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.5,
                }}
              >
                10 minutos de entrevista geram um parecer técnico e um checklist
                sob medida pra sua cultura, UF e modalidade. Os documentos abaixo
                continuam acessíveis enquanto isso.
              </p>
            </div>
            <Button variant="accent" size="sm" href="/entrevista/nova">
              Iniciar entrevista {Icon.arrow(12)}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ─── Grupos de documentos ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {GRUPO_ORDEM.filter((g) => g !== "socios" && porGrupo.has(g)).map((grupo) => (
          <GrupoBloco
            key={grupo}
            grupo={grupo}
            items={porGrupo.get(grupo) ?? []}
            abertos={abertos}
            concluidos={concluidos}
            toggle={toggle}
            marcarConcluido={marcarConcluido}
          />
        ))}

        {/* ─── PJ: bloco de Sócios (sub-accordion por sócio) ─── */}
        {leadType === "pj" && (
          <SociosBloco
            socios={socios}
            itemsPorSocio={itemsSociosPorSocio}
            abertos={abertos}
            concluidos={concluidos}
            toggle={toggle}
            marcarConcluido={marcarConcluido}
            onAddSocio={() => setSocioModal("novo")}
            onEditSocio={(s) => setSocioModal(s)}
            onRemoveSocio={async (id) => {
              const conf = window.confirm(
                "Remover esse sócio? Os documentos já anexados ficam preservados em backup por 30 dias caso volte atrás.",
              )
              if (!conf) return
              const r = await fetch(`/api/conta/socios?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
              })
              if (r.ok) setSocios((s) => s.filter((x) => x.id !== id))
              else alert("Falha ao remover. Tente novamente.")
            }}
          />
        )}
      </div>

      {/* ─── CTA final ─── */}
      <GlassCard glow="green" padding={24} hover={false} style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--green)",
                marginBottom: 6,
              }}
            >
              Próxima etapa — quando os documentos estiverem prontos
            </div>
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              Análise técnica + Dossiê de defesa em PDF
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Quando os obrigatórios estiverem anexados, a IA analisa o cenário
              e monta o PDF de defesa em linguagem de comitê — pronto pra
              protocolar no banco. Sem esse dossiê, sua proposta é só mais uma
              na fila.
            </p>
          </div>
          {isFree ? (
            <Button variant="accent" size="md" href="/planos">
              Ver planos {Icon.arrow(13)}
            </Button>
          ) : (
            <Button variant="accent" size="md" href="/dashboard">
              Ir pro dashboard {Icon.arrow(13)}
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Modal: trocar PF/PJ */}
      {tipoModalAberto && (
        <ModalTipoLead
          atual={leadType}
          onClose={() => setTipoModalAberto(false)}
          onSalvo={(novo) => {
            setLeadType(novo)
            setTipoModalAberto(false)
            // Se virou PJ e não tem sócio, abre modal pra criar o primeiro
            if (novo === "pj" && socios.length === 0) {
              setSocioModal("novo")
            }
          }}
        />
      )}

      {/* Modal: add/editar sócio */}
      {socioModal && (
        <ModalSocio
          socioInicial={socioModal === "novo" ? null : socioModal}
          onClose={() => setSocioModal(null)}
          onSalvo={(s, modo) => {
            if (modo === "novo") setSocios((arr) => [...arr, s])
            else setSocios((arr) => arr.map((x) => (x.id === s.id ? s : x)))
            setSocioModal(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────

function ProgressoHero({
  nome,
  leadType,
  pct,
  concluidosObrig,
  totalObrig,
  microcopia,
  onAbrirTipo,
}: {
  nome: string | null
  leadType: LeadType
  pct: number
  concluidosObrig: number
  totalObrig: number
  microcopia: string
  onAbrirTipo: () => void
}) {
  const primeiroNome = (nome ?? "").trim().split(/\s+/)[0] || null
  return (
    <GlassCard
      glow={pct >= 100 ? "green" : "gold"}
      padding={24}
      hover={false}
      style={{ marginBottom: 20 }}
    >
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <Eyebrow color="var(--gold)" dot="var(--gold)">
            Seu progresso
          </Eyebrow>
          <h2
            style={{
              margin: "10px 0 6px",
              fontSize: "clamp(20px, 2.4vw, 26px)",
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {primeiroNome ? `${primeiroNome}, ` : ""}
            {microcopia}
          </h2>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            {concluidosObrig} de {totalObrig} obrigatórios marcados como prontos.
            {" "}
            <strong style={{ color: "var(--ink)" }}>Salvamos automaticamente</strong>{" "}
            — feche e volte quando quiser.
          </p>

          {/* Barra de progresso */}
          <div
            aria-label="Progresso geral"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--line)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background:
                  pct >= 100
                    ? "linear-gradient(90deg, #5cbd95 0%, #2f7a5c 100%)"
                    : "linear-gradient(90deg, #c9a86a 0%, #5cbd95 100%)",
                transition: "width .6s cubic-bezier(.2,.7,.2,1)",
                boxShadow: "0 0 18px rgba(201,168,106,0.35)",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "var(--muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct}% completo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={onAbrirTipo}
            className="mono"
            aria-label="Trocar tipo de cadastro (PF / PJ)"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              padding: "8px 12px",
              borderRadius: 999,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: leadType === "pj" ? "#9b7ed1" : "var(--green)",
                boxShadow: `0 0 8px ${leadType === "pj" ? "#9b7ed1" : "var(--green)"}`,
              }}
            />
            {leadType === "pj" ? "Pessoa jurídica" : "Pessoa física"}
            <span style={{ opacity: 0.5 }}>· trocar</span>
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

function RefinosInline({
  leadType,
  casado,
  investimento,
  pronaf,
  onCasado,
  onInvestimento,
  onPronaf,
}: {
  leadType: LeadType
  casado: boolean
  investimento: boolean
  pronaf: boolean
  onCasado: (v: boolean) => void
  onInvestimento: (v: boolean) => void
  onPronaf: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
        padding: "12px 14px",
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
      {leadType === "pf" && (
        <Chip ativa={casado} onToggle={() => onCasado(!casado)}>
          Sou casado(a) ou em união estável
        </Chip>
      )}
      <Chip ativa={investimento} onToggle={() => onInvestimento(!investimento)}>
        Operação de investimento (não custeio)
      </Chip>
      <Chip ativa={pronaf} onToggle={() => onPronaf(!pronaf)}>
        Me enquadro no Pronaf
      </Chip>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 11.5,
          color: "var(--muted)",
          maxWidth: 320,
          textAlign: "right",
        }}
      >
        Marcar essas opções esconde docs que não se aplicam ao seu caso —
        menos ruído, menos chance de juntar papel à toa.
      </span>
    </div>
  )
}

function Chip({
  children,
  ativa,
  onToggle,
}: {
  children: React.ReactNode
  ativa: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativa}
      style={{
        fontSize: 12.5,
        padding: "6px 12px",
        borderRadius: 999,
        border: ativa
          ? "1px solid rgba(78,168,132,0.55)"
          : "1px solid var(--line-2)",
        background: ativa ? "rgba(78,168,132,0.12)" : "transparent",
        color: ativa ? "var(--green)" : "var(--ink-2)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all .2s",
      }}
    >
      <span style={{ display: "inline-flex", width: 12 }}>
        {ativa ? Icon.check(12) : null}
      </span>
      {children}
    </button>
  )
}

function GrupoBloco({
  grupo,
  items,
  abertos,
  concluidos,
  toggle,
  marcarConcluido,
}: {
  grupo: GrupoChecklist
  items: ItemChecklistPadrao[]
  abertos: Set<string>
  concluidos: Set<string>
  toggle: (id: string) => void
  marcarConcluido: (id: string, marcado: boolean) => void
}) {
  const obrig = items.filter((i) => i.obrigatorio)
  const opc = items.filter((i) => !i.obrigatorio)
  const obrigConcluidos = obrig.filter((i) => concluidos.has(i.id)).length
  const grupoCompleto = obrig.length > 0 && obrigConcluidos === obrig.length

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 500,
            color: grupoCompleto ? "var(--green)" : "var(--ink)",
            letterSpacing: "-0.015em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {grupoCompleto && (
            <span style={{ color: "var(--green)" }}>{Icon.check(18)}</span>
          )}
          {GRUPO_CHECKLIST_LABEL[grupo]}
        </h3>
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: grupoCompleto ? "var(--green)" : "var(--muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {obrigConcluidos}/{obrig.length} obrigatórios
        </span>
        {grupoCompleto && (
          <span
            style={{
              fontSize: 12,
              color: "var(--green)",
              fontStyle: "italic",
            }}
          >
            ✨ bloco completo
          </span>
        )}
      </div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {GRUPO_CHECKLIST_DESCRICAO[grupo]}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            aberto={abertos.has(item.id)}
            concluido={concluidos.has(item.id)}
            quickWin={QUICK_WIN_SLUGS.has(item.id)}
            onToggle={() => toggle(item.id)}
            onConcluir={(v) => marcarConcluido(item.id, v)}
          />
        ))}
      </div>

      {opc.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "var(--muted)",
            fontStyle: "italic",
          }}
        >
          Itens opcionais aparecem aqui só se aplicarem ao seu caso (você
          marcou no painel acima). Se não tem certeza, deixa desmarcado e a
          gente avisa se precisar.
        </div>
      )}
    </div>
  )
}

function SociosBloco({
  socios,
  itemsPorSocio,
  abertos,
  concluidos,
  toggle,
  marcarConcluido,
  onAddSocio,
  onEditSocio,
  onRemoveSocio,
}: {
  socios: SocioPJ[]
  itemsPorSocio: Map<string, ReturnType<typeof itensDoSocio>>
  abertos: Set<string>
  concluidos: Set<string>
  toggle: (id: string) => void
  marcarConcluido: (id: string, marcado: boolean) => void
  onAddSocio: () => void
  onEditSocio: (s: SocioPJ) => void
  onRemoveSocio: (id: string) => void
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 6,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.015em",
            }}
          >
            {GRUPO_CHECKLIST_LABEL.socios}
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            {GRUPO_CHECKLIST_DESCRICAO.socios}. Cada sócio precisa dos próprios
            documentos pessoais — adicione quem assina pela empresa.
          </p>
        </div>
        <Button variant="ghostAccent" size="sm" onClick={onAddSocio}>
          + Adicionar sócio
        </Button>
      </div>

      {socios.length === 0 ? (
        <GlassCard glow="gold" padding={20} hover={false} style={{ marginTop: 12 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            Nenhum sócio cadastrado ainda. Adicione todos os sócios da empresa
            (mesmo os minoritários — banco analisa o quadro completo).
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {socios.map((s) => {
            const items = itemsPorSocio.get(s.id) ?? []
            const obrig = items.filter((i) => i.obrigatorio)
            const obrigOk = obrig.filter((i) => concluidos.has(i.id)).length
            const completo = obrig.length > 0 && obrigOk === obrig.length

            return (
              <GlassCard
                key={s.id}
                padding={18}
                hover={false}
                glow={completo ? "green" : "none"}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {completo && (
                        <span style={{ color: "var(--green)", marginRight: 6 }}>
                          {Icon.check(14)}
                        </span>
                      )}
                      {s.full_name}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        marginTop: 3,
                      }}
                    >
                      {ESTADO_CIVIL_LABEL[s.estado_civil]}
                      {" · "}
                      {obrigOk}/{obrig.length} docs prontos
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onEditSocio(s)}
                      aria-label={`Editar sócio ${s.full_name}`}
                      style={chipBotaoStyle}
                    >
                      editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveSocio(s.id)}
                      aria-label={`Remover sócio ${s.full_name}`}
                      style={{
                        ...chipBotaoStyle,
                        color: "#d97a7a",
                        borderColor: "rgba(217,122,122,0.32)",
                      }}
                    >
                      remover
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      aberto={abertos.has(item.id)}
                      concluido={concluidos.has(item.id)}
                      quickWin={QUICK_WIN_SLUGS.has(item.id.replace(/^socio_[^_]+_/, "socio_"))}
                      onToggle={() => toggle(item.id)}
                      onConcluir={(v) => marcarConcluido(item.id, v)}
                      compact
                    />
                  ))}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

const chipBotaoStyle: React.CSSProperties = {
  fontSize: 11.5,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--line-2)",
  background: "transparent",
  color: "var(--ink-2)",
  cursor: "pointer",
}

function ItemCard({
  item,
  aberto,
  concluido,
  quickWin,
  onToggle,
  onConcluir,
  compact = false,
}: {
  item: ItemChecklistPadrao
  aberto: boolean
  concluido: boolean
  quickWin: boolean
  onToggle: () => void
  onConcluir: (v: boolean) => void
  compact?: boolean
}) {
  return (
    <GlassCard
      padding={0}
      hover={false}
      glow="none"
      style={{
        overflow: "hidden",
        opacity: concluido ? 0.7 : 1,
        background: concluido ? "rgba(78,168,132,0.05)" : undefined,
        borderColor: concluido ? "rgba(78,168,132,0.32)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Checkbox grande à esquerda — gatilho: dopamina ao marcar */}
        <button
          type="button"
          aria-label={
            concluido
              ? `Desmarcar "${item.nome}" como pronto`
              : `Marcar "${item.nome}" como pronto`
          }
          aria-pressed={concluido}
          onClick={() => onConcluir(!concluido)}
          style={{
            width: 48,
            flexShrink: 0,
            background: "transparent",
            border: 0,
            borderRight: "1px solid var(--line)",
            color: concluido ? "var(--green)" : "var(--muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: concluido ? "1px solid var(--green)" : "1.5px solid var(--line-2)",
              background: concluido ? "rgba(78,168,132,0.2)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
          >
            {concluido && Icon.check(14)}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={aberto}
          aria-controls={`item-${item.id}-content`}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            padding: compact ? "12px 16px" : "14px 18px",
            background: "transparent",
            border: 0,
            color: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: compact ? 13.5 : 14.5,
                  fontWeight: 500,
                  color: concluido ? "var(--ink-2)" : "var(--ink)",
                  letterSpacing: "-0.01em",
                  textDecoration: concluido ? "line-through" : "none",
                }}
              >
                {item.nome}
              </span>
              {quickWin && !concluido && (
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--green)",
                    padding: "2px 6px",
                    border: "1px solid rgba(78,168,132,0.35)",
                    background: "rgba(78,168,132,0.08)",
                    borderRadius: 4,
                  }}
                  title="Item rápido — começa por aqui pra ganhar momentum"
                >
                  rápido
                </span>
              )}
              {!item.obrigatorio && (
                <span
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    padding: "2px 6px",
                    border: "1px solid var(--line-2)",
                    borderRadius: 4,
                  }}
                >
                  opcional
                </span>
              )}
            </div>
            {!compact && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-2)",
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                {item.descricao}
              </div>
            )}
          </div>
          <span
            style={{
              color: "var(--muted)",
              transform: aberto ? "rotate(180deg)" : "none",
              transition: "transform .2s",
              flexShrink: 0,
            }}
          >
            {Icon.chevron(15)}
          </span>
        </button>
      </div>

      {aberto && (
        <div
          id={`item-${item.id}-content`}
          style={{
            padding: "0 18px 16px 66px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ paddingTop: 12 }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 8,
              }}
            >
              Onde tirar
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-2)",
                marginBottom: 14,
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                {item.origem.orgao}
              </strong>
              {item.origem.url && (
                <>
                  <span style={{ color: "var(--faint)" }}>·</span>
                  <Link
                    href={item.origem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--green)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {item.origem.portal ?? item.origem.url}
                    {Icon.arrow(11)}
                  </Link>
                </>
              )}
            </div>

            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 8,
              }}
            >
              Passo a passo
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                color: "var(--ink-2)",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {item.passos.map((p, i) => (
                <li key={i} style={{ marginBottom: 3 }}>
                  {p}
                </li>
              ))}
            </ol>

            {item.nota_instabilidade && (
              <div
                role="note"
                aria-label="Aviso de instabilidade do portal"
                style={{
                  marginTop: 14,
                  padding: "11px 13px",
                  background: "rgba(201,168,106,0.08)",
                  border: "1px solid rgba(201,168,106,0.28)",
                  borderLeft: "3px solid var(--gold)",
                  borderRadius: 8,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <span aria-hidden style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }}>
                  {Icon.spark(13)}
                </span>
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: "var(--ink-2)",
                  }}
                >
                  <strong style={{ color: "var(--gold)", fontWeight: 500 }}>
                    Plano B se o portal não abrir:{" "}
                  </strong>
                  {item.nota_instabilidade}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

// ─── Modais ────────────────────────────────────────────────────────────

function ModalShell({
  titulo,
  children,
  onClose,
}: {
  titulo: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background:
            "linear-gradient(180deg, rgba(22,26,30,0.96) 0%, rgba(12,15,18,0.98) 100%)",
          border: "1px solid var(--line-2)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            id="modal-title"
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            {Icon.x(16)}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalTipoLead({
  atual,
  onClose,
  onSalvo,
}: {
  atual: LeadType
  onClose: () => void
  onSalvo: (novo: LeadType) => void
}) {
  const [tipo, setTipo] = useState<LeadType>(atual)
  const [cnpj, setCnpj] = useState("")
  const [razao, setRazao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setSalvando(true)
    setErro(null)
    const body =
      tipo === "pj"
        ? { lead_type: "pj", cnpj, razao_social: razao }
        : { lead_type: "pf" }
    const r = await fetch("/api/conta/perfil-tipo", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok) {
      onSalvo(tipo)
    } else {
      setErro(j.erro ?? "Falha ao salvar.")
    }
    setSalvando(false)
  }

  return (
    <ModalShell titulo="Tipo de cadastro" onClose={onClose}>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
        O checklist se ajusta automaticamente ao tipo escolhido. Se você é o
        produtor pessoa física, escolha PF. Se a empresa rural pleiteia o
        crédito, escolha PJ — vamos pedir os dados da empresa e dos sócios.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Chip ativa={tipo === "pf"} onToggle={() => setTipo("pf")}>
          Pessoa física
        </Chip>
        <Chip ativa={tipo === "pj"} onToggle={() => setTipo("pj")}>
          Pessoa jurídica
        </Chip>
      </div>

      {tipo === "pj" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <Campo label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0000-00" />
          <Campo
            label="Razão social"
            value={razao}
            onChange={setRazao}
            placeholder="Empresa Rural Ltda"
          />
        </div>
      )}

      {erro && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            background: "rgba(217,122,122,0.1)",
            border: "1px solid rgba(217,122,122,0.32)",
            borderRadius: 8,
            color: "#e89999",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {erro}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={salvar}
          disabled={salvando || (tipo === atual && tipo === "pf")}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </ModalShell>
  )
}

function ModalSocio({
  socioInicial,
  onClose,
  onSalvo,
}: {
  socioInicial: SocioPJ | null
  onClose: () => void
  onSalvo: (s: SocioPJ, modo: "novo" | "editar") => void
}) {
  const [nome, setNome] = useState(socioInicial?.full_name ?? "")
  const [cpf, setCpf] = useState(socioInicial?.cpf ?? "")
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivilSocio>(
    socioInicial?.estado_civil ?? "solteiro",
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const modo = socioInicial ? "editar" : "novo"

  async function salvar() {
    setSalvando(true)
    setErro(null)
    const body = {
      ...(socioInicial ? { id: socioInicial.id } : {}),
      full_name: nome,
      cpf,
      estado_civil: estadoCivil,
    }
    const r = await fetch("/api/conta/socios", {
      method: socioInicial ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.socio) {
      onSalvo(j.socio as SocioPJ, modo)
    } else {
      setErro(j.erro ?? "Falha ao salvar.")
    }
    setSalvando(false)
  }

  return (
    <ModalShell
      titulo={modo === "novo" ? "Adicionar sócio" : "Editar sócio"}
      onClose={onClose}
    >
      <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
        Dados básicos. Os documentos do sócio aparecem no checklist em um
        bloco próprio depois de salvar.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <Campo label="Nome completo" value={nome} onChange={setNome} placeholder="João da Silva" />
        <Campo label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
        <SelectCampo
          label="Estado civil"
          value={estadoCivil}
          onChange={(v) => setEstadoCivil(v as EstadoCivilSocio)}
          options={Object.entries(ESTADO_CIVIL_LABEL).map(([v, l]) => ({ value: v, label: l }))}
        />
      </div>

      {erro && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            background: "rgba(217,122,122,0.1)",
            border: "1px solid rgba(217,122,122,0.32)",
            borderRadius: 8,
            color: "#e89999",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {erro}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="accent" size="sm" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : modo === "novo" ? "Adicionar" : "Salvar"}
        </Button>
      </div>
    </ModalShell>
  )
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line-2)",
          borderRadius: 8,
          color: "var(--ink)",
          fontSize: 14,
          outline: "none",
        }}
      />
    </label>
  )
}

function SelectCampo({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line-2)",
          borderRadius: 8,
          color: "var(--ink)",
          fontSize: 14,
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0c0f12" }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ─── Microcopy de motivação por banda de progresso ───
//
// Gatilhos: completion bias (mostrar progresso), aversão à perda
// ("falta pouco"), pertencimento ("a maioria desiste — você não").
function mensagemMotivacional(pct: number, _nome: string | null, leadType: LeadType): string {
  if (pct === 0) {
    return leadType === "pj"
      ? "vamos juntos — começa pelos 2 ou 3 mais rápidos."
      : "vamos juntos — começa pelos 2 ou 3 mais rápidos."
  }
  if (pct < 25) {
    return "você já começou — ¾ dos produtores travam aqui. Você não."
  }
  if (pct < 50) {
    return "tá no ritmo — o mais difícil já passou."
  }
  if (pct < 75) {
    return "metade do caminho. Bora terminar?"
  }
  if (pct < 100) {
    return "falta pouco — dá pra fechar hoje."
  }
  return "tudo pronto. Você está à frente da maioria — bora pro dossiê."
}

// Compatibilidade — alguns lugares importam estes nomes de outras telas
export { CATEGORIA_CHECKLIST_LABEL, ITENS_POR_SOCIO }
