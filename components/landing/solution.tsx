import { Container, Eyebrow } from "./primitives"

const steps = [
  {
    n: "01",
    t: "Entrevista com IA",
    d: "Você conta sua operação em 10 minutos. A IA já sabe quais perguntas o comitê vai fazer.",
  },
  {
    n: "02",
    t: "Checklist personalizado",
    d: "Documentos exatos pro SEU caso — proprietário, arrendatário, Pronamp, custeio, investimento.",
  },
  {
    n: "03",
    t: "Organização guiada",
    d: "A gente valida o que existe, aponta o que falta, e diz onde buscar o que tá faltando.",
  },
  {
    n: "04",
    t: "Dossiê pronto",
    d: "Um PDF profissional, no padrão bancário, que o gerente consegue defender internamente.",
  },
]

export function Solution() {
  return (
    <section
      id="solucao"
      style={{
        padding: "140px 0",
        background: "var(--green)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at top, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 20%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(40% 60% at 85% 10%, rgba(201,168,106,0.12), transparent 60%)",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div
          className="landing-sol-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "flex-end",
            marginBottom: 72,
          }}
        >
          <div>
            <Eyebrow color="rgba(255,255,255,0.55)">02 · Como resolvemos</Eyebrow>
            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(40px, 5.5vw, 72px)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                margin: "20px 0 0",
                textWrap: "balance",
              }}
            >
              Um consultor especializado
              <br />
              em crédito rural.
            </h2>
          </div>
          <div>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.75)",
                margin: 0,
                maxWidth: 480,
                letterSpacing: "-0.005em",
              }}
            >
              A gente não &ldquo;ajuda&rdquo; você a pedir crédito — monta o pedido no padrão que o
              banco aprova. Entrevista com IA, checklist específico, dossiê no jeito que o comitê
              lê.
            </p>
          </div>
        </div>

        <div
          className="landing-sol-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="landing-sol-cell"
              style={{
                padding: "36px 28px 32px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                position: "relative",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  color: "var(--gold)",
                  marginBottom: 64,
                }}
              >
                {s.n} — passo
              </div>
              <h3
                style={{
                  color: "#fff",
                  fontSize: 21,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  margin: "0 0 10px",
                  lineHeight: 1.15,
                }}
              >
                {s.t}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "-0.003em",
                }}
              >
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){
          .landing-sol-header{ grid-template-columns: 1fr !important; gap: 28px !important; align-items: flex-start !important }
        }
        @media (max-width: 1020px){
          .landing-sol-grid{ grid-template-columns: repeat(2, 1fr) !important }
          .landing-sol-cell:nth-child(2){ border-right: none !important }
          .landing-sol-cell:nth-child(1), .landing-sol-cell:nth-child(2){ border-bottom: 1px solid rgba(255,255,255,0.1) }
        }
        @media (max-width: 620px){
          .landing-sol-grid{ grid-template-columns: 1fr !important }
          .landing-sol-cell{ border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important }
          .landing-sol-cell:last-child{ border-bottom: none !important }
        }
      `}</style>
    </section>
  )
}
