import type { ReactNode } from "react"
import { Container, Eyebrow, Button, Icon } from "./primitives"

function CTAStat({ icon, k, v }: { icon: ReactNode; k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.85)",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            marginBottom: 4,
          }}
        >
          {k}
        </div>
        <div
          style={{ fontSize: 14, fontWeight: 500, color: "#fff", letterSpacing: "-0.005em" }}
        >
          {v}
        </div>
      </div>
    </div>
  )
}

export function CTA() {
  return (
    <section
      id="cta"
      style={{
        padding: "140px 0",
        position: "relative",
        overflow: "hidden",
        background: "var(--ink)",
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 80% at 85% 30%, rgba(15,61,46,0.6), transparent 60%),radial-gradient(40% 60% at 10% 100%, rgba(201,168,106,0.15), transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.4,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div style={{ maxWidth: 880 }}>
          <Eyebrow color="rgba(255,255,255,0.5)">Janela da safra 25/26</Eyebrow>
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(44px, 6.5vw, 88px)",
              lineHeight: 0.96,
              letterSpacing: "-0.045em",
              fontWeight: 500,
              margin: "24px 0 32px",
              textWrap: "balance",
            }}
          >
            Cada semana perdida
            <br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>
              é insumo mais caro e safra menor.
            </span>
          </h2>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.72)",
              margin: 0,
              maxWidth: 620,
              letterSpacing: "-0.005em",
            }}
          >
            Comece agora. Análise inicial gratuita. Se a gente não ver chance real de aprovação, a
            gente te fala — e não cobra nada.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 48 }}>
            <Button size="lg" variant="onDark" href="/cadastro">
              Iniciar análise gratuita {Icon.arrow(15)}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                color: "#fff",
                background: "rgba(255,255,255,0.03)",
              }}
              href="#faq"
            >
              Falar com especialista
            </Button>
          </div>

          <div
            className="landing-cta-strip"
            style={{
              marginTop: 64,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 40,
            }}
          >
            <CTAStat icon={Icon.lock(15)} k="Segurança" v="Dados criptografados · LGPD" />
            <CTAStat icon={Icon.check(15)} k="Compromisso" v="Sem mensalidade ou fidelidade" />
            <CTAStat icon={Icon.bank(15)} k="Padrão" v="Linguagem de comitê de crédito" />
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 760px){
          .landing-cta-strip{ grid-template-columns: 1fr !important; gap: 20px !important }
        }
      `}</style>
    </section>
  )
}
