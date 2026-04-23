"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AuthSplit } from "@/components/shell/AuthSplit"
import { Alert } from "@/components/shell/Alert"
import { Button, Icon } from "@/components/landing/primitives"

type Estado = "aguardando" | "processando" | "ok" | "erro"

export default function ConfirmarExclusaoClient({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>(token ? "aguardando" : "erro")
  const [mensagem, setMensagem] = useState<string | null>(
    token ? null : "Link inválido — token ausente.",
  )
  const jaEnviou = useRef(false)

  async function confirmar() {
    if (jaEnviou.current) return
    jaEnviou.current = true
    setEstado("processando")
    setMensagem(null)
    try {
      const res = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEstado("erro")
        setMensagem(json?.erro ?? "Não foi possível confirmar a exclusão.")
        return
      }
      setEstado("ok")
      setMensagem(json?.mensagem ?? "Conta excluída.")
    } catch {
      setEstado("erro")
      setMensagem("Falha de rede. Tente novamente.")
    }
  }

  useEffect(() => {
    if (estado !== "ok") return
    const t = setTimeout(() => {
      window.location.href = "/"
    }, 5000)
    return () => clearTimeout(t)
  }, [estado])

  return (
    <AuthSplit cardOnly glow="gold" maxWidth={520}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(212,113,88,0.12)",
            border: "1px solid rgba(212,113,88,0.35)",
            color: "var(--danger)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          {Icon.x(28)}
        </div>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Confirmar exclusão da conta
        </h1>
      </div>

      {estado === "aguardando" && (
        <>
          <p
            style={{
              margin: "8px 0 20px",
              fontSize: 14.5,
              color: "var(--ink-2)",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Ao confirmar, sua conta, processos, entrevistas, checklist e
            uploads ficam inacessíveis. Registros financeiros ficam
            arquivados conforme a Política de Privacidade.{" "}
            <strong style={{ color: "var(--ink)" }}>Esta ação é irreversível.</strong>
          </p>
          <Button
            variant="ghost"
            size="lg"
            onClick={confirmar}
            style={{
              width: "100%",
              color: "var(--danger)",
              borderColor: "rgba(212,113,88,0.32)",
              background: "rgba(212,113,88,0.08)",
            }}
          >
            Confirmar exclusão agora
          </Button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              Cancelar e voltar
            </Link>
          </div>
        </>
      )}

      {estado === "processando" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
            padding: "20px 0",
            color: "var(--ink-2)",
            fontSize: 14,
          }}
        >
          <span style={{ color: "var(--danger)", display: "inline-flex" }}>
            {Icon.spinner(18)}
          </span>
          Processando exclusão…
        </div>
      )}

      {estado === "ok" && (
        <div>
          <Alert variant="success">
            <p style={{ margin: 0, fontWeight: 500 }}>
              {mensagem ?? "Conta excluída com sucesso."}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "var(--ink-2)",
              }}
            >
              Você será redirecionado em alguns segundos.
            </p>
          </Alert>
        </div>
      )}

      {estado === "erro" && (
        <div>
          <Alert variant="error">
            <p style={{ margin: 0, fontWeight: 500 }}>
              {mensagem ?? "Falha na confirmação."}
            </p>
          </Alert>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link
              href="/conta/dados"
              style={{
                fontSize: 14,
                color: "var(--green)",
                textDecoration: "underline",
                fontWeight: 500,
              }}
            >
              Gerar novo link
            </Link>
          </div>
        </div>
      )}
    </AuthSplit>
  )
}
