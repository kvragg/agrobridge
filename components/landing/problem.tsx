import { Container, SectionLabel } from "./primitives"

const pains = [
  {
    tag: "01",
    title: "O gerente diz \"faltou documento\" e não diz qual.",
    body: "Você volta pra casa no escuro, tentando adivinhar. Cada ida à agência é um dia perdido — e o banco não te dá o roteiro.",
  },
  {
    tag: "02",
    title: "A burocracia derruba antes do comitê olhar.",
    body: "CAR, CCIR, ITR, contratos, declarações. Um papel fora do padrão e o pedido volta pro fim da fila. Ninguém te avisa em tempo.",
  },
  {
    tag: "03",
    title: "A janela da safra fecha enquanto você espera.",
    body: "Insumo sobe, prazo encurta, margem evapora. Quando o crédito sai — se sai — você já pagou caro pra começar atrasado.",
  },
  {
    tag: "04",
    title: "O banco não te diz o que o banco quer ver.",
    body: "O contador conhece imposto. O técnico conhece lavoura. Ninguém conhece a mesa do crédito — só quem senta nela sabe o que aprova.",
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
              O dinheiro existe. O que falta é dossiê no padrão que o banco aprova. Isso é problema
              técnico, não de sorte — e tem quem resolve por dentro.
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
