"use client"

import { useState } from "react"
import { Container, SectionLabel, Button, Icon } from "./primitives"

const faqs = [
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
    a: "Não. Você chega com o que tem — pode ser só o CPF, a localização da área e uma ideia do que quer financiar. A entrevista com IA mapeia o que falta, e o time te guia até juntar tudo. Organizar é responsabilidade nossa.",
  },
  {
    q: "Quanto custa?",
    a: "A análise inicial é gratuita. Você só paga quando o dossiê estiver pronto para o banco — e o valor é conhecido antes, sem surpresa. Não existe mensalidade nem fidelidade.",
  },
  {
    q: "Quais linhas de crédito vocês atendem?",
    a: "Custeio agrícola e pecuário, investimento (Moderfrota, Inovagro, Pronamp Investimento, ABC+), Pronaf, e algumas linhas privadas não-MCR quando faz mais sentido. Na entrevista a gente identifica a linha certa.",
  },
  {
    q: "Vocês atendem em qualquer banco?",
    a: "Trabalhamos com os principais bancos que operam crédito rural no Brasil. A escolha do banco depende do seu perfil, da linha e da sua relação bancária existente. A gente te orienta onde tem mais chance de aprovar.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Seus documentos ficam criptografados, com acesso restrito ao time responsável pelo seu caso. Seguimos a LGPD integralmente. Nada é compartilhado com terceiros sem sua autorização expressa por escrito.",
  },
  {
    q: "Em quanto tempo meu dossiê fica pronto?",
    a: "Entre 3 e 5 dias úteis, contados da entrega de toda a documentação. Se tiver pendência (CAR desatualizado, por exemplo), a gente te avisa antes para você agir em paralelo.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section id="faq" style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}>
      <Container>
        <SectionLabel num="06" label="Dúvidas que o produtor faz" />
        <div
          className="landing-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 72,
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(32px, 4.2vw, 52px)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                fontWeight: 500,
                margin: 0,
                textWrap: "balance",
              }}
            >
              Pergunte
              <br />
              <span style={{ color: "var(--muted)" }}>sem receio.</span>
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                marginTop: 24,
                maxWidth: 320,
              }}
            >
              Se sua dúvida não estiver aqui, manda direto no WhatsApp. Respondemos no mesmo dia.
            </p>
            <div style={{ marginTop: 24 }}>
              <Button
                variant="ghost"
                size="md"
                href="https://wa.me/5500000000000"
                external
              >
                Falar no WhatsApp {Icon.arrow(14)}
              </Button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--line-2)" }}>
            {faqs.map((f, i) => {
              const isOpen = open === i
              return (
                <button
                  key={f.q}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "22px 0",
                    borderBottom: "1px solid var(--line-2)",
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
                        fontSize: 18,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: "var(--ink)",
                      }}
                    >
                      {f.q}
                    </span>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "1px solid var(--line-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink)",
                        flexShrink: 0,
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition: "transform .25s",
                      }}
                    >
                      {Icon.plus(14)}
                    </span>
                  </div>
                  <div
                    style={{
                      maxHeight: isOpen ? 600 : 0,
                      overflow: "hidden",
                      transition: "max-height .35s ease, margin-top .25s",
                      marginTop: isOpen ? 14 : 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15.5,
                        lineHeight: 1.6,
                        color: "var(--muted)",
                        maxWidth: 640,
                      }}
                    >
                      {f.a}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
