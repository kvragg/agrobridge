"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[app/error.tsx]", error.digest ?? error.message)
    }
  }, [error])

  return (
    <div
      role="alert"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
        gap: 16,
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--ink, #fff)",
          margin: 0,
        }}
      >
        Algo saiu do script.
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--muted, #9ca3af)",
          maxWidth: 440,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Tivemos um erro inesperado do nosso lado. Tenta de novo — se persistir,
        fale com a gente em contato@agrobridge.app.
      </p>
      {error.digest && (
        <code
          style={{
            fontSize: 11,
            color: "var(--muted, #6b7280)",
            fontFamily: "ui-monospace, monospace",
            opacity: 0.7,
          }}
        >
          ref: {error.digest}
        </code>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--green, #4ea884)",
            color: "#07120d",
            border: 0,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid var(--line-2, rgba(255,255,255,0.12))",
            color: "var(--ink, #fff)",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
