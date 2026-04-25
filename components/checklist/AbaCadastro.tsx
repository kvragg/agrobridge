"use client"

import { useMemo, useState } from "react"
import { Button, GlassCard, Icon } from "@/components/landing/primitives"
import {
  CHECKLIST_PADRAO,
  GRUPO_CHECKLIST_DESCRICAO,
  GRUPO_CHECKLIST_LABEL,
  filtrarChecklistPorContexto,
  itensDoSocio,
  type ContextoChecklist,
  type ItemChecklistPadrao,
} from "@/data/checklist-padrao"
import type { SocioPJ, LeadType } from "@/types/perfil-lead"
import {
  Chip,
  ESTADO_CIVIL_LABEL,
  ItemCard,
  ModalDefinirPJ,
  ModalSocio,
  chipBotaoStyle,
  isQuickWin,
  ordenarComQuickWins,
  reverterParaPF,
} from "./_shared"

interface Props {
  leadType: LeadType
  socios: SocioPJ[]
  casado: boolean
  abertos: Set<string>
  concluidos: Set<string>
  onLeadTypeChange: (novo: LeadType) => void
  onSociosChange: (next: SocioPJ[]) => void
  onCasadoChange: (v: boolean) => void
  onToggleAberto: (id: string) => void
  onMarcarConcluido: (id: string, marcado: boolean) => void
}

/**
 * Aba 1 — Cadastro pessoal (ou empresarial).
 *
 * Fluxo:
 *   - Lead novo (lead_type='pf' default mas não escolheu ativamente):
 *     mostra GATE com 2 cartões grandes "Pessoa Física" / "Pessoa Jurídica".
 *     Decisão única, depois libera o checklist.
 *   - Já escolheu PF: lista de docs PF + chip "Sou casado(a)".
 *   - Já escolheu PJ: bloco Empresa + bloco Sócios (CRUD inline).
 *
 * Toda hora tem link discreto "trocar tipo de cadastro" pra reabrir o gate.
 */
export function AbaCadastro({
  leadType,
  socios,
  casado,
  abertos,
  concluidos,
  onLeadTypeChange,
  onSociosChange,
  onCasadoChange,
  onToggleAberto,
  onMarcarConcluido,
}: Props) {
  // O lead "decidiu" se já escolheu PJ explicitamente (cnpj cadastrado virá)
  // ou se ele veio do default 'pf' mas ainda quer ver o gate. Pra simplificar,
  // o gate aparece quando o user clica em "Trocar tipo" — fora isso o tipo
  // do servidor é a fonte da verdade.
  const [mostrandoGate, setMostrandoGate] = useState(false)
  const [modalPJ, setModalPJ] = useState(false)
  const [modalSocio, setModalSocio] = useState<SocioPJ | "novo" | null>(null)

  if (mostrandoGate) {
    return (
      <Gate
        atual={leadType}
        onEscolherPF={async () => {
          if (leadType !== "pf") {
            const r = await reverterParaPF()
            if (!r.ok) {
              alert(r.erro)
              return
            }
            onLeadTypeChange("pf")
          }
          setMostrandoGate(false)
        }}
        onEscolherPJ={() => {
          // Se já é PJ, só fecha gate (não precisa pedir CNPJ de novo)
          if (leadType === "pj") {
            setMostrandoGate(false)
            return
          }
          setModalPJ(true)
        }}
      />
    )
  }

  // ─── Renderiza checklist por tipo ────────────────────────────────────
  return (
    <div>
      <CabecalhoTipo
        leadType={leadType}
        socios={socios}
        onTrocar={() => setMostrandoGate(true)}
      />

      {leadType === "pf" ? (
        <ChecklistPF
          casado={casado}
          abertos={abertos}
          concluidos={concluidos}
          onCasadoChange={onCasadoChange}
          onToggleAberto={onToggleAberto}
          onMarcarConcluido={onMarcarConcluido}
        />
      ) : (
        <ChecklistPJ
          socios={socios}
          abertos={abertos}
          concluidos={concluidos}
          onAddSocio={() => setModalSocio("novo")}
          onEditSocio={(s) => setModalSocio(s)}
          onRemoveSocio={async (id) => {
            const ok = window.confirm(
              "Remover esse sócio? Os documentos já anexados ficam preservados — dá pra recadastrar depois se for engano.",
            )
            if (!ok) return
            const r = await fetch(`/api/conta/socios?id=${encodeURIComponent(id)}`, {
              method: "DELETE",
            })
            if (r.ok) onSociosChange(socios.filter((x) => x.id !== id))
            else alert("Falha ao remover. Tente novamente.")
          }}
          onToggleAberto={onToggleAberto}
          onMarcarConcluido={onMarcarConcluido}
        />
      )}

      {modalPJ && (
        <ModalDefinirPJ
          onClose={() => setModalPJ(false)}
          onSalvo={() => {
            onLeadTypeChange("pj")
            setModalPJ(false)
            setMostrandoGate(false)
            // Sem sócios? Abre logo o modal pra criar o primeiro
            if (socios.length === 0) setModalSocio("novo")
          }}
        />
      )}

      {modalSocio && (
        <ModalSocio
          socioInicial={modalSocio === "novo" ? null : modalSocio}
          onClose={() => setModalSocio(null)}
          onSalvo={(s, modo) => {
            if (modo === "novo") onSociosChange([...socios, s])
            else onSociosChange(socios.map((x) => (x.id === s.id ? s : x)))
            setModalSocio(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Gate: tela de escolha PF/PJ ────────────────────────────────────────

function Gate({
  atual,
  onEscolherPF,
  onEscolherPJ,
}: {
  atual: LeadType
  onEscolherPF: () => void
  onEscolherPJ: () => void
}) {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "clamp(20px, 2.4vw, 26px)",
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
        }}
      >
        Como você vai entrar com o crédito?
      </h2>
      <p
        style={{
          margin: "0 0 22px",
          fontSize: 14,
          color: "var(--ink-2)",
          lineHeight: 1.55,
          maxWidth: 580,
        }}
      >
        A escolha define quais documentos você vai precisar. Se não tem certeza,
        o mais comum é Pessoa Física — você troca depois sem perder nada.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        <GateCard
          titulo="Pessoa Física"
          subtitulo="Você é o produtor. Crédito sai no seu CPF."
          itens={[
            "CNH ou RG + CPF",
            "Comprovante de endereço",
            "Declaração de IR",
            "Se casado: certidão + CNH do cônjuge",
          ]}
          ativo={atual === "pf"}
          onClick={onEscolherPF}
        />
        <GateCard
          titulo="Pessoa Jurídica"
          subtitulo="Empresa rural assina o crédito (Ltda, ME, S/A, etc)."
          itens={[
            "Contrato social, balanço, DRE",
            "Faturamento dos últimos 12 meses",
            "Documentos pessoais de cada sócio",
            "Comprovante de endereço da empresa",
          ]}
          ativo={atual === "pj"}
          onClick={onEscolherPJ}
        />
      </div>
    </div>
  )
}

function GateCard({
  titulo,
  subtitulo,
  itens,
  ativo,
  onClick,
}: {
  titulo: string
  subtitulo: string
  itens: string[]
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 22,
        background: ativo
          ? "linear-gradient(180deg, rgba(78,168,132,0.14) 0%, rgba(12,15,18,0.85) 100%)"
          : "linear-gradient(180deg, rgba(22,26,30,0.72) 0%, rgba(12,15,18,0.82) 100%)",
        border: ativo
          ? "1px solid rgba(78,168,132,0.55)"
          : "1px solid var(--line-2)",
        borderRadius: 16,
        cursor: "pointer",
        transition: "all .25s",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onMouseEnter={(e) => {
        if (!ativo) {
          e.currentTarget.style.borderColor = "rgba(78,168,132,0.4)"
          e.currentTarget.style.transform = "translateY(-2px)"
        }
      }}
      onMouseLeave={(e) => {
        if (!ativo) {
          e.currentTarget.style.borderColor = "var(--line-2)"
          e.currentTarget.style.transform = "none"
        }
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
          }}
        >
          {titulo}
        </h3>
        {ativo && (
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
          >
            atual
          </span>
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--ink-2)",
          lineHeight: 1.5,
        }}
      >
        {subtitulo}
      </p>
      <ul
        style={{
          margin: "8px 0 0",
          paddingLeft: 16,
          fontSize: 12.5,
          color: "var(--muted)",
          lineHeight: 1.7,
        }}
      >
        {itens.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: "var(--green)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Escolher {titulo.toLowerCase()} {Icon.arrow(12)}
      </div>
    </button>
  )
}

// ─── Cabeçalho com tipo atual + link "trocar" ─────────────────────────

function CabecalhoTipo({
  leadType,
  socios,
  onTrocar,
}: {
  leadType: LeadType
  socios: SocioPJ[]
  onTrocar: () => void
}) {
  const labelTipo = leadType === "pj" ? "Pessoa jurídica" : "Pessoa física"
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 18,
      }}
    >
      <div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Cadastro como
        </div>
        <h2
          style={{
            margin: "4px 0 0",
            fontSize: "clamp(18px, 2.2vw, 22px)",
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
          }}
        >
          {labelTipo}
          {leadType === "pj" && socios.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 400,
              }}
            >
              · {socios.length} {socios.length === 1 ? "sócio" : "sócios"}
            </span>
          )}
        </h2>
      </div>
      <button
        type="button"
        onClick={onTrocar}
        style={{
          fontSize: 12,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid var(--line-2)",
          background: "transparent",
          color: "var(--ink-2)",
          cursor: "pointer",
        }}
      >
        Trocar tipo
      </button>
    </div>
  )
}

// ─── Conteúdo PF ──────────────────────────────────────────────────────

function ChecklistPF({
  casado,
  abertos,
  concluidos,
  onCasadoChange,
  onToggleAberto,
  onMarcarConcluido,
}: {
  casado: boolean
  abertos: Set<string>
  concluidos: Set<string>
  onCasadoChange: (v: boolean) => void
  onToggleAberto: (id: string) => void
  onMarcarConcluido: (id: string, marcado: boolean) => void
}) {
  const items = useMemo(() => {
    const ctx: ContextoChecklist = {
      leadType: "pf",
      casado,
      investimento: false, // refino de investimento mora na aba Crédito Rural
      pronaf: false,
    }
    const all = filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctx).filter(
      (i) => i.grupo === "cadastro",
    )
    return ordenarComQuickWins(all)
  }, [casado])

  return (
    <div>
      <RefinosPF casado={casado} onCasadoChange={onCasadoChange} />
      <ListaItens
        items={items}
        abertos={abertos}
        concluidos={concluidos}
        onToggle={onToggleAberto}
        onConcluir={onMarcarConcluido}
      />
    </div>
  )
}

function RefinosPF({
  casado,
  onCasadoChange,
}: {
  casado: boolean
  onCasadoChange: (v: boolean) => void
}) {
  return (
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
      <Chip ativa={casado} onToggle={() => onCasadoChange(!casado)}>
        Sou casado(a) ou em união estável
      </Chip>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 11.5,
          color: "var(--muted)",
        }}
      >
        Marcar adiciona certidão e CNH do cônjuge à lista.
      </span>
    </div>
  )
}

// ─── Conteúdo PJ ──────────────────────────────────────────────────────

function ChecklistPJ({
  socios,
  abertos,
  concluidos,
  onAddSocio,
  onEditSocio,
  onRemoveSocio,
  onToggleAberto,
  onMarcarConcluido,
}: {
  socios: SocioPJ[]
  abertos: Set<string>
  concluidos: Set<string>
  onAddSocio: () => void
  onEditSocio: (s: SocioPJ) => void
  onRemoveSocio: (id: string) => void
  onToggleAberto: (id: string) => void
  onMarcarConcluido: (id: string, marcado: boolean) => void
}) {
  const itensEmpresa = useMemo(() => {
    const all = filtrarChecklistPorContexto(CHECKLIST_PADRAO, {
      leadType: "pj",
      casado: false,
      investimento: false,
      pronaf: false,
    }).filter((i) => i.grupo === "empresa")
    return ordenarComQuickWins(all)
  }, [])

  const itensPorSocio = useMemo(() => {
    const map = new Map<string, ReturnType<typeof itensDoSocio>>()
    for (const s of socios) map.set(s.id, itensDoSocio(s))
    return map
  }, [socios])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Bloco
        titulo={GRUPO_CHECKLIST_LABEL.empresa}
        descricao={GRUPO_CHECKLIST_DESCRICAO.empresa}
      >
        <ListaItens
          items={itensEmpresa}
          abertos={abertos}
          concluidos={concluidos}
          onToggle={onToggleAberto}
          onConcluir={onMarcarConcluido}
        />
      </Bloco>

      <Bloco
        titulo={GRUPO_CHECKLIST_LABEL.socios}
        descricao={`${GRUPO_CHECKLIST_DESCRICAO.socios}. Cada sócio precisa dos próprios documentos pessoais — adicione todos os que assinam pela empresa.`}
        acessorio={
          <Button variant="ghostAccent" size="sm" onClick={onAddSocio}>
            + Adicionar sócio
          </Button>
        }
      >
        {socios.length === 0 ? (
          <GlassCard glow="gold" padding={18} hover={false}>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              Nenhum sócio cadastrado ainda. Adicione todos os sócios da empresa
              (mesmo os minoritários — banco analisa o quadro completo).
            </p>
          </GlassCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {socios.map((s) => {
              const items = itensPorSocio.get(s.id) ?? []
              const obrig = items.filter((i) => i.obrigatorio)
              const obrigOk = obrig.filter((i) => concluidos.has(i.id)).length
              const completo = obrig.length > 0 && obrigOk === obrig.length

              return (
                <GlassCard
                  key={s.id}
                  padding={16}
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
                          <span
                            style={{ color: "var(--green)", marginRight: 6 }}
                            aria-hidden
                          >
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
                        quickWin={isQuickWin(item.id)}
                        onToggle={() => onToggleAberto(item.id)}
                        onConcluir={(v) => onMarcarConcluido(item.id, v)}
                        compact
                      />
                    ))}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </Bloco>
    </div>
  )
}

// ─── Helpers visuais ──────────────────────────────────────────────────

function Bloco({
  titulo,
  descricao,
  acessorio,
  children,
}: {
  titulo: string
  descricao: string
  acessorio?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
          }}
        >
          {titulo}
        </h3>
        {acessorio}
      </div>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12.5,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        {descricao}
      </p>
      {children}
    </div>
  )
}

function ListaItens({
  items,
  abertos,
  concluidos,
  onToggle,
  onConcluir,
}: {
  items: ItemChecklistPadrao[]
  abertos: Set<string>
  concluidos: Set<string>
  onToggle: (id: string) => void
  onConcluir: (id: string, marcado: boolean) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          aberto={abertos.has(item.id)}
          concluido={concluidos.has(item.id)}
          quickWin={isQuickWin(item.id)}
          onToggle={() => onToggle(item.id)}
          onConcluir={(v) => onConcluir(item.id, v)}
        />
      ))}
    </div>
  )
}
