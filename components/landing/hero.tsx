"use client"

import { useEffect, useState } from "react"
import { Container, Eyebrow, Button, Icon, Logo } from "./primitives"

type Msg = { role: "ai" | "me"; text: string }

const messages: Msg[] = [
  { role: "ai", text: "Olá, Carlos. Você é proprietário ou arrendatário da área?" },
  { role: "me", text: "Arrendo 340 ha em Sorriso, MT." },
  { role: "ai", text: "Cultura principal para a safra 25/26?" },
  { role: "me", text: "Soja na área toda + milho segunda safra." },
  { role: "ai", text: "Pelo MCR 3-2-1, custeio pode chegar a R$ 3.000/ha. Gerando seu checklist…" },
]

function Bubble({ msg, fresh }: { msg: Msg; fresh: boolean }) {
  const isAi = msg.role === "ai"
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: isAi ? "flex-start" : "flex-end",
        animation: fresh ? "landing-fadeUp .4s ease" : "none",
      }}
    >
      {isAi && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "var(--green)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={13} color="#fff" />
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          borderRadius: isAi ? "4px 13px 13px 13px" : "13px 4px 13px 13px",
          background: isAi ? "var(--bg-2)" : "var(--green)",
          color: isAi ? "var(--ink)" : "#fff",
          fontSize: 13.5,
          lineHeight: 1.5,
          border: isAi ? "1px solid var(--line)" : "none",
          letterSpacing: "-0.003em",
        }}
      >
        {msg.text}
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: "var(--green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo size={13} color="#fff" />
      </div>
      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          padding: "9px 13px",
          borderRadius: "4px 13px 13px 13px",
          display: "flex",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--muted)",
              animation: `landing-blink 1.2s ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function InterviewMock() {
  const [visible, setVisible] = useState(1)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let i = 1
    const iv = setInterval(() => {
      if (i >= messages.length) {
        i = 1
        setVisible(1)
        return
      }
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        i += 1
        setVisible(i)
      }, 850)
    }, 2300)
    return () => clearInterval(iv)
  }, [])

  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 16,
        boxShadow:
          "0 1px 0 rgba(15,61,46,0.04),0 2px 4px rgba(10,10,10,0.02),0 12px 28px -12px rgba(15,61,46,0.12),0 40px 80px -40px rgba(15,61,46,0.25)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          background: "linear-gradient(180deg, #fcfbf7 0%, #fbfaf6 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {["#e85d4a", "#e7b844", "#2ea043"].map((c, i) => (
            <div
              key={i}
              style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.85 }}
            />
          ))}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.1em",
            color: "var(--muted)",
            textTransform: "uppercase",
          }}
        >
          agrobridge.app · entrevista
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--green-3)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green-3)",
              boxShadow: "0 0 0 3px rgba(26,106,79,0.15)",
              animation: "landing-pulse 1.8s infinite",
            }}
          />
          ao vivo
        </div>
      </div>

      <div
        style={{
          padding: "22px 22px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 360,
        }}
      >
        {messages.slice(0, visible).map((m, i) => (
          <Bubble key={i} msg={m} fresh={i === visible - 1} />
        ))}
        {typing && <Typing />}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--line)",
          background: "#fbfaf6",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--green)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Icon.doc(14)}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.005em" }}>
              Dossiê Carlos · Soja 25/26
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
              {Math.min(visible * 3, 12)}/12 · montando
            </div>
          </div>
        </div>
        <div
          style={{
            width: 100,
            height: 3,
            background: "var(--bg-2)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min((visible / messages.length) * 100, 100)}%`,
              height: "100%",
              background: "var(--green)",
              transition: "width .6s ease",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TrustStat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 6,
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {v}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" style={{ position: "relative", paddingTop: 56, paddingBottom: 140 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(55% 70% at 88% 12%, rgba(15,61,46,0.07), transparent 60%),radial-gradient(40% 50% at 8% 0%, rgba(201,168,106,0.10), transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.35,
          backgroundImage:
            "linear-gradient(rgba(15,61,46,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(15,61,46,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
        }}
      />

      <Container style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingBottom: 40,
            borderBottom: "1px solid var(--line)",
            marginBottom: 48,
          }}
        >
          <Eyebrow>Safra 25/26 · 14 anos dentro da mesa</Eyebrow>
          <div style={{ flex: 1 }} />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: "var(--muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Inteligência bancária · por dentro
          </span>
        </div>

        <div
          className="landing-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 80,
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(44px, 6.6vw, 84px)",
                lineHeight: 0.96,
                letterSpacing: "-0.045em",
                fontWeight: 500,
                margin: "0 0 28px",
                textWrap: "balance",
              }}
            >
              O banco não nega
              <br />
              <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                o seu crédito.
                <br />
                Nega o seu papel.
              </span>
            </h1>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.5,
                color: "var(--ink-2)",
                maxWidth: 520,
                margin: 0,
                fontWeight: 400,
                letterSpacing: "-0.005em",
              }}
            >
              Cada semana sem o dossiê pronto é insumo mais caro e janela menor. Em 10 minutos de
              entrevista a IA entende o seu caso, monta o checklist exato e prepara um dossiê no
              formato que o banco aprova — escrito por quem aprovou crédito por 14 anos.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 40 }}>
              <Button size="lg" variant="primary" href="/cadastro">
                Iniciar diagnóstico gratuito {Icon.arrow(15)}
              </Button>
            </div>

            <div
              className="landing-trust-strip"
              style={{
                marginTop: 56,
                paddingTop: 28,
                borderTop: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              <TrustStat k="Experiência" v="14 anos no SFN" />
              <TrustStat k="Certificações" v="FEBRABAN · ANBIMA" />
              <TrustStat k="Entrega" v="100% digital" />
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <InterviewMock />
            <div
              className="mono"
              style={{
                position: "absolute",
                top: -16,
                right: -12,
                background: "var(--ink)",
                color: "#fff",
                padding: "7px 12px",
                borderRadius: 999,
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 0 2px rgba(201,168,106,0.25)",
                }}
              />
              simulação
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 900px){
          .landing-hero-grid{ grid-template-columns: 1fr !important; gap: 56px !important }
        }
        @media (max-width: 520px){
          .landing-trust-strip{ grid-template-columns: 1fr 1fr !important }
        }
      `}</style>
    </section>
  )
}
