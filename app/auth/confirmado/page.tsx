"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthSplit } from "@/components/shell/AuthSplit"
import { Button, Icon } from "@/components/landing/primitives"

export default function ConfirmadoPage() {
  const router = useRouter()
  const [segundos, setSegundos] = useState(3)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0))
    }, 1000)

    const timer = setTimeout(() => {
      router.push("/planos")
      router.refresh()
    }, 3000)

    return () => {
      clearInterval(intervalo)
      clearTimeout(timer)
    }
  }, [router])

  return (
    <AuthSplit cardOnly glow="gold" maxWidth={480}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(78,168,132,0.22) 0%, rgba(78,168,132,0.08) 100%)",
            border: "1px solid rgba(78,168,132,0.4)",
            color: "var(--green)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 40px rgba(78,168,132,0.25)",
          }}
        >
          {Icon.check(36)}
        </div>

        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Conta ativa
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 15,
            color: "var(--ink-2)",
            lineHeight: 1.6,
          }}
        >
          Próximo passo: escolher o nível de prontidão do seu pedido.
        </p>

        <div
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 16px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--line-2)",
            fontSize: 11.5,
            color: "var(--muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "var(--green)", display: "inline-flex" }}>
            {Icon.spinner(13)}
          </span>
          Abrindo planos em {segundos}s
        </div>

        <div style={{ marginTop: 24 }}>
          <Button variant="ghost" size="md" href="/planos">
            Ir agora {Icon.arrow(14)}
          </Button>
        </div>
      </div>
    </AuthSplit>
  )
}
