import Link from "next/link"
import { Container, Logo } from "./primitives"

type Link = { label: string; href: string }

function FootCol({ title, links }: { title: string; links: Link[] }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink)",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {links.map((l) => (
          <a key={l.label} href={l.href} style={{ fontSize: 13.5, color: "var(--muted)" }}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer style={{ padding: "60px 0 40px", borderTop: "1px solid var(--line)" }}>
      <Container>
        <div
          className="landing-foot-grid"
          style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={20} color="var(--green)" />
              <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 18 }}>
                AgroBridge
              </span>
            </div>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.55,
                maxWidth: 320,
                marginTop: 16,
              }}
            >
              Despachante inteligente de crédito rural. Entrevista, organização e dossiê no padrão
              do banco.
            </p>
            <p
              className="mono"
              style={{
                color: "var(--muted)",
                fontSize: 11,
                marginTop: 20,
                letterSpacing: "0.04em",
              }}
            >
              © 2026 AgroBridge · CNPJ em constituição
            </p>
          </div>

          <FootCol
            title="Produto"
            links={[
              { label: "Entrevista com IA", href: "#solucao" },
              { label: "Checklist", href: "#fluxo" },
              { label: "Dossiê", href: "#fluxo" },
              { label: "Simulador", href: "#fluxo" },
            ]}
          />
          <FootCol
            title="Empresa"
            links={[
              { label: "Sobre", href: "#solucao" },
              { label: "Fundador", href: "#solucao" },
              { label: "Segurança", href: "/privacidade" },
              { label: "Contato", href: "#faq" },
            ]}
          />
          <FootCol
            title="Legal"
            links={[
              { label: "Termos", href: "/termos" },
              { label: "Privacidade (LGPD)", href: "/privacidade" },
              { label: "Entrar", href: "/login" },
              { label: "Criar conta", href: "/cadastro" },
            ]}
          />
        </div>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
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
            style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}
          >
            Não somos instituição financeira. Não concedemos crédito. Assessoramos o produtor na
            montagem técnica do pedido.
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--muted)" }}>
            <Link href="/termos">pt-BR</Link>
            <span>·</span>
            <span>Brasil</span>
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 760px){ .landing-foot-grid{ grid-template-columns: 1fr 1fr !important } }
      `}</style>
    </footer>
  )
}
