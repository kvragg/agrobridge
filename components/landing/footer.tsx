"use client"

import Link from "next/link"
import { Container, Logo } from "./primitives"

type FootLink = { label: string; href: string }

const PRODUTO: FootLink[] = [
  { label: "Entrevista com IA", href: "/cadastro" },
  { label: "Checklist", href: "/cadastro" },
  { label: "Dossiê", href: "/cadastro" },
  { label: "Simulador", href: "#fluxo" },
]

const EMPRESA: FootLink[] = [
  { label: "Planos", href: "/planos" },
  { label: "Entrar", href: "/login" },
  { label: "Cadastrar", href: "/cadastro" },
]

const LEGAL: FootLink[] = [
  { label: "Termos", href: "/termos" },
  { label: "Privacidade (LGPD)", href: "/privacidade" },
  { label: "Meus dados", href: "/conta/dados" },
]

function FootCol({ title, links }: { title: string; links: FootLink[] }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink)",
          marginBottom: 18,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 11 }}>
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            style={{
              fontSize: 13.5,
              color: "var(--muted)",
              transition: "color .2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted)")
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer
      style={{
        padding: "80px 0 48px",
        borderTop: "1px solid var(--line)",
        position: "relative",
      }}
    >
      <Container>
        <div
          className="foot-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={22} color="var(--ink)" accent="var(--gold)" />
              <span
                style={{
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  fontSize: 18,
                  color: "#fff",
                }}
              >
                AgroBridge
              </span>
            </div>
            <p
              style={{
                color: "var(--ink-2)",
                fontSize: 14,
                lineHeight: 1.6,
                maxWidth: 340,
                marginTop: 18,
              }}
            >
              Consultoria técnica em crédito rural. Entrevista, organização e
              dossiê no padrão bancário.
            </p>
            <p
              className="mono"
              style={{
                color: "var(--faint)",
                fontSize: 11,
                marginTop: 24,
                letterSpacing: "0.08em",
              }}
            >
              © 2026 AgroBridge · CNPJ em constituição
            </p>
          </div>

          <FootCol title="Produto" links={PRODUTO} />
          <FootCol title="Empresa" links={EMPRESA} />
          <FootCol title="Legal" links={LEGAL} />
        </div>

        <div
          style={{
            marginTop: 56,
            paddingTop: 28,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              maxWidth: 760,
            }}
          >
            Não somos instituição financeira. Não concedemos crédito.
            Assessoramos o produtor na montagem técnica do pedido.
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <span>pt-BR</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Brasil</span>
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 760px){ .foot-grid{ grid-template-columns: 1fr 1fr !important } }
      `}</style>
    </footer>
  )
}
