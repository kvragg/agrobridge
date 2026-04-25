"use client"

import Link from "next/link"
import { useState, type CSSProperties, type ReactNode } from "react"
import { Button, GlassCard, Icon } from "@/components/landing/primitives"
import type { ItemChecklistPadrao } from "@/data/checklist-padrao"
import type { EstadoCivilSocio, LeadType, SocioPJ } from "@/types/perfil-lead"

// ─── Constantes compartilhadas ─────────────────────────────────────────

/** Slugs de itens "quick win" — fáceis e rápidos. UX foot-in-the-door. */
export const QUICK_WIN_SLUGS = new Set([
  "cnh",
  "comprovante_endereco",
  "socio_cnh",
  "socio_comprovante_endereco",
  "comprovante_endereco_empresa",
])

export const ESTADO_CIVIL_LABEL: Record<EstadoCivilSocio, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União estável",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
}

// ─── Microcopy de motivação por banda de progresso ────────────────────
//
// Gatilhos: completion bias (mostrar progresso), aversão à perda
// ("falta pouco"), pertencimento ("a maioria desiste — você não").
export function mensagemMotivacional(pct: number): string {
  if (pct === 0) return "vamos juntos — começa pelos 2 ou 3 mais rápidos."
  if (pct < 25) return "você já começou — ¾ dos produtores travam aqui. Você não."
  if (pct < 50) return "tá no ritmo — o mais difícil já passou."
  if (pct < 75) return "metade do caminho. Bora terminar?"
  if (pct < 100) return "falta pouco — dá pra fechar hoje."
  return "tudo pronto. Você está à frente da maioria — bora pro dossiê."
}

// ─── Chip (toggle visual de filtro) ────────────────────────────────────

export function Chip({
  children,
  ativa,
  onToggle,
}: {
  children: ReactNode
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

// ─── Item de checklist (card expansível com checkbox) ─────────────────

export function ItemCard({
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
              border: concluido
                ? "1px solid var(--green)"
                : "1.5px solid var(--line-2)",
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
                <span
                  aria-hidden
                  style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }}
                >
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

// ─── Modal shell ───────────────────────────────────────────────────────

export function ModalShell({
  titulo,
  children,
  onClose,
}: {
  titulo: string
  children: ReactNode
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

// ─── Modal de sócio (criar/editar) ────────────────────────────────────

export function ModalSocio({
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
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13.5,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        Dados básicos. Os documentos do sócio aparecem no checklist em um bloco
        próprio depois de salvar.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <Campo label="Nome completo" value={nome} onChange={setNome} placeholder="João da Silva" />
        <Campo label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
        <SelectCampo
          label="Estado civil"
          value={estadoCivil}
          onChange={(v) => setEstadoCivil(v as EstadoCivilSocio)}
          options={Object.entries(ESTADO_CIVIL_LABEL).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
        />
      </div>

      {erro && <ErroBox>{erro}</ErroBox>}

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

// ─── Modal de definição de PJ (CNPJ + razão social) ───────────────────

export function ModalDefinirPJ({
  onClose,
  onSalvo,
}: {
  onClose: () => void
  onSalvo: () => void
}) {
  const [cnpj, setCnpj] = useState("")
  const [razao, setRazao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setSalvando(true)
    setErro(null)
    const r = await fetch("/api/conta/perfil-tipo", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead_type: "pj", cnpj, razao_social: razao }),
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok) onSalvo()
    else setErro(j.erro ?? "Falha ao salvar.")
    setSalvando(false)
  }

  return (
    <ModalShell titulo="Cadastro como Pessoa Jurídica" onClose={onClose}>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 13.5,
          color: "var(--ink-2)",
          lineHeight: 1.55,
        }}
      >
        Informe os dados básicos da empresa. Em seguida, vamos pedir os sócios e
        os documentos pessoais de cada um.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <Campo label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0000-00" />
        <Campo
          label="Razão social"
          value={razao}
          onChange={setRazao}
          placeholder="Empresa Rural Ltda"
        />
      </div>

      {erro && <ErroBox>{erro}</ErroBox>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="accent" size="sm" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Confirmar PJ"}
        </Button>
      </div>
    </ModalShell>
  )
}

/** Volta o lead pra PF (limpa cnpj/razão). Usado pelo "trocar tipo". */
export async function reverterParaPF(): Promise<{ ok: true } | { ok: false; erro: string }> {
  const r = await fetch("/api/conta/perfil-tipo", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lead_type: "pf" }),
  })
  if (r.ok) return { ok: true }
  const j = await r.json().catch(() => ({}))
  return { ok: false, erro: j.erro ?? "Falha ao salvar." }
}

// ─── Inputs internos ──────────────────────────────────────────────────

export function Campo({
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

export function SelectCampo({
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

export function ErroBox({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </div>
  )
}

// ─── Helper: ordenar items pondo quick wins primeiro ──────────────────

export function ordenarComQuickWins(items: ItemChecklistPadrao[]): ItemChecklistPadrao[] {
  return [...items].sort((a, b) => {
    const aIsQuick = QUICK_WIN_SLUGS.has(a.id) ? -1 : 0
    const bIsQuick = QUICK_WIN_SLUGS.has(b.id) ? -1 : 0
    return aIsQuick - bIsQuick
  })
}

export function isQuickWin(id: string): boolean {
  // Pra IDs de sócio (socio_<uuid>_socio_cnh), normaliza removendo o user_id
  // pra bater com QUICK_WIN_SLUGS (socio_cnh).
  const normal = id.replace(/^socio_[^_]+_/, "")
  return QUICK_WIN_SLUGS.has(normal) || QUICK_WIN_SLUGS.has(id)
}

// ─── Estilo compartilhado pra botões "chip" (editar/remover) ──────────

export const chipBotaoStyle: CSSProperties = {
  fontSize: 11.5,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--line-2)",
  background: "transparent",
  color: "var(--ink-2)",
  cursor: "pointer",
}

// ─── Re-exports de tipos pra ficar tudo num lugar ─────────────────────
export type { LeadType, SocioPJ }
