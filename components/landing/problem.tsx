import { Container, SectionLabel } from "./primitives"

const pains = [
  {
    tag: "01",
    title: "O banco recusa e você não sabe o motivo exato.",
    body: 'O gerente diz que "faltou documento" ou que "a proposta não atende ao MCR". Você volta pra casa sem saber o que corrigir.',
  },
  {
    tag: "02",
    title: "A documentação trava tudo.",
    body: "CAR, CCIR, declarações de área, contratos de arrendamento, DAP, ITR. Um papel errado e o pedido volta pro início da fila.",
  },
  {
    tag: "03",
    title: "A demora queima a janela da safra.",
    body: "O plantio não espera. Quando o crédito sai — se sai — o insumo já subiu de preço ou a janela já fechou.",
  },
  {
    tag: "04",
    title: "Ninguém te explica o que o banco realmente quer ver.",
    body: "Os critérios do MCR são técnicos. O gerente não tem tempo. O contador conhece imposto, não crédito rural. Você fica no meio.",
  },
]

export function Problem() {
  return (
    <section id="problema" style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}>
      <Container>
        <SectionLabel num="01" label="O problema real" />
        <div
          className="landing-two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 72 }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(34px, 4.4vw, 54px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
              }}
            >
              Você produz no campo.
              <br />
              <span style={{ color: "var(--muted)" }}>
                Mas perde dinheiro na mesa do gerente.
              </span>
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                marginTop: 28,
                maxWidth: 440,
              }}
            >
              Crédito rural não é falta de dinheiro no banco — é falta de dossiê no padrão que o
              banco aprova. E isso é um problema técnico, não de sorte.
            </p>
          </div>

          <div style={{ display: "grid", gap: 0 }}>
            {pains.map((p, i) => (
              <div
                key={p.tag}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: 24,
                  padding: "28px 0",
                  borderTop: i === 0 ? "1px solid var(--line-2)" : "none",
                  borderBottom: "1px solid var(--line-2)",
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    paddingTop: 4,
                    letterSpacing: "0.08em",
                  }}
                >
                  {p.tag}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 500,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.25,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: "var(--muted)",
                    }}
                  >
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
      <style>{`
        @media (max-width: 900px){
          .landing-two-col{ grid-template-columns: 1fr !important; gap: 40px !important }
        }
      `}</style>
    </section>
  )
}
