"use client"

import { useState } from "react"
import {
  Container,
  SectionLabel,
  Button,
  Icon,
  GlassCard,
  useReveal,
} from "./primitives"

const FAQS = [
  {
    q: "E se meu crédito for negado pelo banco?",
    a: "A gente te entrega um laudo técnico com o motivo exato da negativa, o que o banco apontou, e um plano de ajuste. Em muitos casos, a negativa é corrigível — documento reenviado, garantia reforçada, linha reenquadrada. E se o ajuste fizer sentido, você reapresenta sem pagar nada a mais.",
  },
  {
    q: "Funciona para área arrendada?",
    a: "Sim. Aliás, é um dos cenários onde a gente mais agrega: o banco exige contrato registrado, prazo mínimo compatível com a linha, e declaração do proprietário. A gente monta tudo no padrão e antecipa as exigências do cartório.",
  },
  {
    q: "Preciso ter tudo organizado antes?",
    a: "Não. Você chega com o que tem — pode ser só o CPF, a localização da área e uma ideia do que quer financiar. A entrevista com IA mapeia o que falta e te guia até juntar tudo. Organizar é responsabilidade nossa.",
  },
  {
    q: "Quanto custa?",
    a: "O Diagnóstico (R$ 29,99) é a porta de entrada. A partir daí, Dossiê (R$ 297,99) entrega o documento institucional, e Mesa de Crédito (R$ 697,99) acompanha até a aprovação. Pagamento único em todos os planos — nenhuma mensalidade.",
  },
  {
    q: "Quais linhas de crédito vocês atendem?",
    a: "Custeio agrícola e pecuário, investimento (Moderfrota, Inovagro, Pronamp Investimento, ABC+), Pronaf, e algumas linhas privadas não-MCR quando faz mais sentido. Na entrevista a gente identifica a linha certa.",
  },
  {
    q: "Vocês atendem em qualquer banco?",
    a: "Trabalhamos com os principais bancos e cooperativas que operam crédito rural no Brasil. A escolha depende do seu perfil, da linha e da sua relação bancária existente. A gente te orienta onde tem mais chance de aprovar.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Seus documentos ficam criptografados, com acesso restrito ao time responsável pelo seu caso. Seguimos a LGPD integralmente. Nada é compartilhado com terceiros sem sua autorização expressa por escrito.",
  },
  {
    q: "Em quanto tempo meu dossiê fica pronto?",
    a: "Entre 3 e 5 dias úteis, contados da entrega de toda a documentação. Se tiver pendência (CAR desatualizado, por exemplo), a gente te avisa antes pra você agir em paralelo.",
  },
]

export function Faq() {
  useReveal()
  const printMode =
    typeof window !== "undefined" && window.location.search.includes("print")
  const [open, setOpen] = useState<number>(printMode ? -2 : 0)

  return (
    <section id="faq" style={{ padding: "140px 0", position: "relative" }}>
      <Container>
        <SectionLabel num="07" label="Dúvidas que o produtor faz" />
        <div
          className="two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 72,
            alignItems: "flex-start",
          }}
        >
          <div className="reveal">
            <h2
              style={{
                fontSize: "clamp(34px, 4.4vw, 54px)",
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
                color: "#fff",
              }}
            >
              Pergunte
              <br />
              <span style={{ color: "var(--muted)" }}>sem receio.</span>
            </h2>
            <p
              style={{
                fontSize: 15.5,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                marginTop: 24,
                maxWidth: 340,
              }}
            >
              A entrevista com a IA já responde a maior parte das dúvidas
              técnicas do seu caso. Tratativa humana com o fundador entra
              no plano{" "}
              <span style={{ color: "var(--gold)", fontWeight: 500 }}>
                Acesso à Mesa de Crédito
              </span>
              .
            </p>
            <Button
              variant="ghostAccent"
              size="md"
              href="/cadastro"
              style={{ marginTop: 24 }}
            >
              Começar com a IA {Icon.arrow(14)}
            </Button>
          </div>

          <GlassCard
            glow="none"
            padding={0}
            hover={false}
            className="reveal reveal-d1"
          >
            {FAQS.map((f, i) => {
              const isOpen = open === -2 || open === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "22px 24px",
                    borderBottom:
                      i < FAQS.length - 1 ? "1px solid var(--line)" : "none",
                    background: isOpen ? "rgba(78,168,132,0.04)" : "transparent",
                    transition: "background .25s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 24,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: "#fff",
                      }}
                    >
                      {f.q}
                    </span>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: "1px solid var(--line-2)",
                        background: isOpen
                          ? "rgba(78,168,132,0.15)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isOpen ? "var(--green)" : "var(--ink-2)",
                        flexShrink: 0,
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition:
                          "transform .25s, background .25s, color .25s",
                      }}
                    >
                      {Icon.plus(14)}
                    </span>
                  </div>
                  <div
                    style={{
                      maxHeight: isOpen ? 600 : 0,
                      overflow: "hidden",
                      transition: "max-height .4s ease, margin-top .25s",
                      marginTop: isOpen ? 14 : 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14.5,
                        lineHeight: 1.65,
                        color: "var(--ink-2)",
                        maxWidth: 640,
                      }}
                    >
                      {f.a}
                    </p>
                  </div>
                </button>
              )
            })}
          </GlassCard>
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){ .two-col{ grid-template-columns: 1fr !important; gap: 40px !important } }
      `}</style>
    </section>
  )
}
