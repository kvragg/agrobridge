"use client"

import { useEffect, useState } from "react"
import {
  Container,
  Eyebrow,
  Button,
  Icon,
  Logo,
  GlassCard,
  GridLayer,
  useReveal,
} from "./primitives"

type Msg = { role: "ai" | "me"; text: string }

const MESSAGES: Msg[] = [
  { role: "ai", text: "Olá, Carlos. Você é proprietário ou arrendatário da área?" },
  { role: "me", text: "Arrendo 340 ha em Sorriso, MT." },
  { role: "ai", text: "Cultura principal para a safra 25/26?" },
  { role: "me", text: "Soja na área toda + milho segunda safra." },
  {
    role: "ai",
    text:
      "Pelo MCR 3-2-1, custeio pode chegar a R$ 3.000/ha. Gerando checklist…",
  },
]

function InterviewMock() {
  const [visible, setVisible] = useState(1)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let i = 1
    const tick = () => {
      if (i >= MESSAGES.length) {
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
    }
    const iv = setInterval(tick, 2300)
    return () => clearInterval(iv)
  }, [])

  return (
    <GlassCard hover={false} padding={0} glow="green" style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid var(--line)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {["#e85d4a", "#e7b844", "#5cbd95"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: c,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.12em",
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
            color: "var(--green)",
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
              background: "var(--green)",
              boxShadow:
                "0 0 8px var(--green), 0 0 0 3px rgba(78,168,132,0.18)",
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
          minHeight: 340,
        }}
      >
        {MESSAGES.slice(0, visible).map((m, i) => (
          <Bubble key={i} msg={m} fresh={i === visible - 1} />
        ))}
        {typing && <Typing />}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--line)",
          background: "rgba(0,0,0,0.25)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
              color: "#07120d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 18px rgba(78,168,132,0.4)",
            }}
          >
            {Icon.doc(14)}
          </div>
          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                letterSpacing: "-0.005em",
                color: "var(--ink)",
              }}
            >
              Dossiê Carlos · Soja 25/26
            </div>
            <div
              className="mono"
              style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}
            >
              {Math.min(visible * 3, 12)}/12 · montando
            </div>
          </div>
        </div>
        <div
          style={{
            width: 110,
            height: 3,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min((visible / MESSAGES.length) * 100, 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg,#5cbd95,#c9a86a)",
              transition: "width .6s ease",
            }}
          />
        </div>
      </div>
    </GlassCard>
  )
}

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
            borderRadius: 7,
            background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={13} color="#07120d" accent="#07120d" />
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          borderRadius: isAi ? "6px 14px 14px 14px" : "14px 6px 14px 14px",
          background: isAi ? "rgba(255,255,255,0.04)" : "rgba(78,168,132,0.14)",
          color: isAi ? "var(--ink)" : "#eaf7f0",
          fontSize: 13.5,
          lineHeight: 1.5,
          border:
            "1px solid " + (isAi ? "var(--line)" : "rgba(78,168,132,0.3)"),
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
          borderRadius: 7,
          background: "linear-gradient(180deg,#5cbd95,#2f7a5c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo size={13} color="#07120d" accent="#07120d" />
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          padding: "9px 13px",
          borderRadius: "6px 14px 14px 14px",
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

function TrustStat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 8,
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
  useReveal()
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingTop: 120,
        paddingBottom: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        className="hero-fallback"
        style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-10%",
            background:
              "radial-gradient(42% 55% at 20% 35%, rgba(78,168,132,0.22), transparent 60%)," +
              "radial-gradient(38% 50% at 85% 20%, rgba(201,168,106,0.14), transparent 60%)," +
              "radial-gradient(55% 60% at 60% 90%, rgba(47,122,92,0.25), transparent 60%)," +
              "linear-gradient(180deg, #0a1512 0%, #070809 50%, #0a0e0c 100%)",
            animation: "landing-heroPan 24s ease-in-out infinite alternate",
          }}
        />
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.15,
          }}
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          {Array.from({ length: 26 }).map((_, i) => (
            <path
              key={i}
              d={`M 0 ${520 + i * 22} Q 600 ${490 + i * 22 - i * 2} 1200 ${
                520 + i * 22 + i * 1.2
              }`}
              stroke={i < 10 ? "rgba(201,168,106,0.5)" : "rgba(78,168,132,0.5)"}
              strokeWidth={0.6}
              fill="none"
            />
          ))}
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(7,8,9,0.45) 0%, rgba(7,8,9,0.7) 50%, rgba(7,8,9,0.95) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(80% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <GridLayer size={80} opacity={0.04} mask="ellipse at 50% 40%" />

      <Container style={{ position: "relative", zIndex: 2 }}>
        <div
          className="reveal"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <Eyebrow>Crédito rural · Safra 25/26</Eyebrow>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: "var(--muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Brasil · v1.0 · abril 2026
          </span>
        </div>

        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 72,
            alignItems: "center",
          }}
        >
          <div>
            <h1
              className="reveal"
              style={{
                fontSize: "clamp(52px, 7.6vw, 104px)",
                lineHeight: 0.93,
                letterSpacing: "-0.048em",
                fontWeight: 500,
                margin: "0 0 28px",
                textWrap: "balance",
                color: "#fff",
                textShadow: "0 2px 40px rgba(0,0,0,0.6)",
              }}
            >
              Crédito rural
              <br />
              aprovado.
              <br />
              <span
                style={{
                  color: "transparent",
                  background:
                    "linear-gradient(180deg, #9ea29d 0%, #5d625e 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  fontWeight: 400,
                }}
              >
                Sem papel perdido,
                <br />
                sem idas na agência.
              </span>
            </h1>
            <p
              className="reveal reveal-d1"
              style={{
                fontSize: 19,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 520,
                margin: 0,
                fontWeight: 400,
                letterSpacing: "-0.005em",
              }}
            >
              A AgroBridge faz a entrevista, monta o checklist e entrega um dossiê
              que o banco aprova — no padrão técnico que o comitê de crédito
              rural espera ver.
            </p>

            <div
              className="reveal reveal-d2"
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 40,
              }}
            >
              <Button size="lg" variant="accent" href="/cadastro">
                Iniciar análise gratuita {Icon.arrow(15)}
              </Button>
              <Button size="lg" variant="ghost" href="#fluxo">
                {Icon.play(13)} Ver como funciona
              </Button>
            </div>

            <div
              className="reveal reveal-d3 trust-strip"
              style={{
                marginTop: 56,
                paddingTop: 28,
                borderTop: "1px solid var(--line)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              <TrustStat k="MCR" v="Domínio completo" />
              <TrustStat k="Resposta" v="Em 24 horas" />
              <TrustStat k="Custo" v="Zero até aprovar" />
            </div>
          </div>

          <div
            className="reveal reveal-d2"
            style={{ position: "relative" }}
          >
            <InterviewMock />
            <div
              className="mono"
              style={{
                position: "absolute",
                top: -14,
                right: -8,
                background: "rgba(7,8,9,0.92)",
                color: "var(--gold)",
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1px solid var(--line-gold)",
                boxShadow: "0 0 30px rgba(201,168,106,0.2)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  boxShadow: "0 0 8px var(--gold)",
                }}
              />
              simulação
            </div>
          </div>
        </div>

        <div
          className="reveal reveal-d4"
          style={{
            position: "absolute",
            left: "50%",
            bottom: -40,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: "var(--muted)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            scroll
          </div>
          <div
            style={{
              width: 1,
              height: 36,
              background: "linear-gradient(180deg, var(--muted), transparent)",
            }}
          />
        </div>
      </Container>

      <style>{`
        @media (max-width: 960px){
          .hero-grid{ grid-template-columns: 1fr !important; gap: 56px !important }
        }
        @media (max-width: 520px){
          .trust-strip{ grid-template-columns: 1fr 1fr !important }
        }
      `}</style>
    </section>
  )
}
