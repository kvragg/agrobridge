"use client"

import { useState } from "react"
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
  type CategoriaChecklist,
  type ItemChecklistPadrao,
} from "@/data/checklist-padrao"

const CATEGORIA_COR: Record<CategoriaChecklist, string> = {
  identificacao: "#8593a8",
  ambiental: "#7eb89c",
  fundiario: "#c47a3f",
  fiscal: "#c9a86a",
  produtivo: "#7eb89c",
}

const CATEGORIA_ORDEM: CategoriaChecklist[] = [
  "identificacao",
  "ambiental",
  "fundiario",
  "fiscal",
  "produtivo",
]

interface Props {
  /** Se o user fez entrevista (mesmo sem pagar) — muda CTA. */
  fezEntrevista?: boolean
  /** Se o user é Free (sem pagar) — muda banner do parecer. */
  isFree?: boolean
}

/**
 * Checklist genérico — exibido em /checklist quando o usuário ainda
 * não tem processo (não fez entrevista ou não pagou). Cada item é
 * expansível, com passos e link pro portal oficial.
 */
export function ChecklistGenerico({ fezEntrevista = false, isFree = true }: Props) {
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setAbertos((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const obrigatorios = CHECKLIST_PADRAO.filter((d) => d.obrigatorio)
  const opcionais = CHECKLIST_PADRAO.filter((d) => !d.obrigatorio)

  // Agrupa obrigatórios por categoria
  const porCategoria = new Map<CategoriaChecklist, ItemChecklistPadrao[]>()
  for (const item of obrigatorios) {
    const arr = porCategoria.get(item.categoria) ?? []
    arr.push(item)
    porCategoria.set(item.categoria, arr)
  }

  return (
    <div>
      {/* Banner — incentivo entrevista (não bloqueia nada) */}
      {!fezEntrevista && (
        <GlassCard glow="gold" padding={24} hover={false} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(201,168,106,0.14)",
                color: "var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {Icon.spark(18)}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Quer um checklist <strong style={{ color: "var(--gold)" }}>personalizado</strong> ao seu caso?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: "var(--ink-2)",
                  lineHeight: 1.55,
                }}
              >
                A entrevista (10 min, gratuita) gera um parecer técnico e um
                checklist sob medida pra sua cultura, UF e modalidade. Os
                documentos abaixo continuam acessíveis enquanto isso.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Button variant="accent" size="md" href="/entrevista/nova">
                Iniciar entrevista {Icon.arrow(13)}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Header com estatística */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <Eyebrow>Documentos core do crédito rural</Eyebrow>
          <h2
            style={{
              margin: "8px 0 0",
              fontSize: "clamp(22px, 2.6vw, 28px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {obrigatorios.length} documentos obrigatórios + {opcionais.length} opcionais
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            Comece de cima pra baixo. Cada item tem o passo-a-passo e o link
            do portal oficial. Trava em algum? Pergunta no chat da IA.
          </p>
        </div>
      </div>

      {/* Categorias com seus itens */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {CATEGORIA_ORDEM.filter((c) => porCategoria.has(c)).map((cat) => (
          <CategoriaBloco
            key={cat}
            categoria={cat}
            items={porCategoria.get(cat) ?? []}
            abertos={abertos}
            toggle={toggle}
          />
        ))}

        {opcionais.length > 0 && (
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--line)",
              }}
            >
              Opcionais (situacionais)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {opcionais.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  aberto={abertos.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer — proxy pra entrevista */}
      <GlassCard glow="green" padding={24} hover={false} style={{ marginTop: 36 }}>
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
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: 15.5,
                fontWeight: 500,
                color: "var(--ink)",
              }}
            >
              {fezEntrevista
                ? "Já fez a entrevista — quer ver o parecer técnico?"
                : "Após reunir os documentos, faça a entrevista."}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              {fezEntrevista
                ? "Seu parecer está disponível a partir do plano Bronze. O time AgroBridge monta o dossiê de defesa após receber todos os documentos obrigatórios."
                : "A IA gera um parecer técnico do seu caso e o time AgroBridge monta o dossiê de defesa para o banco."}
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
    </div>
  )
}

function CategoriaBloco({
  categoria,
  items,
  abertos,
  toggle,
}: {
  categoria: CategoriaChecklist
  items: ItemChecklistPadrao[]
  abertos: Set<string>
  toggle: (id: string) => void
}) {
  const cor = CATEGORIA_COR[categoria]
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: cor,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: `1px solid ${cor}33`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cor,
            boxShadow: `0 0 8px ${cor}`,
          }}
        />
        {CATEGORIA_CHECKLIST_LABEL[categoria]}
        <span style={{ marginLeft: "auto", color: "var(--muted)", letterSpacing: 0 }}>
          {items.length} {items.length === 1 ? "doc" : "docs"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            aberto={abertos.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ItemCard({
  item,
  aberto,
  onToggle,
}: {
  item: ItemChecklistPadrao
  aberto: boolean
  onToggle: () => void
}) {
  return (
    <GlassCard padding={0} hover={false} glow="none" style={{ overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        aria-controls={`item-${item.id}-content`}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "16px 20px",
          background: "transparent",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {item.nome}
            </span>
            {!item.obrigatorio && (
              <span
                className="mono"
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  padding: "2px 7px",
                  border: "1px solid var(--line-2)",
                  borderRadius: 4,
                }}
              >
                Opcional
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {item.descricao}
          </div>
        </div>
        <span
          style={{
            color: "var(--muted)",
            transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        >
          {Icon.chevron(16)}
        </span>
      </button>

      {aberto && (
        <div
          id={`item-${item.id}-content`}
          style={{
            padding: "0 20px 18px 20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ paddingTop: 14 }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 10,
              }}
            >
              Onde tirar
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink-2)",
                marginBottom: 16,
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
                marginBottom: 10,
              }}
            >
              Passo a passo
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "var(--ink-2)",
                fontSize: 13.5,
                lineHeight: 1.7,
              }}
            >
              {item.passos.map((p, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
