import Link from "next/link"

export const metadata = {
  title: "Página não encontrada · AgroBridge",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div
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
      <div
        className="mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--muted, #9ca3af)",
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          margin: 0,
          color: "var(--ink, #fff)",
        }}
      >
        Página não encontrada
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--muted, #9ca3af)",
          maxWidth: 420,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        O link que você seguiu pode estar quebrado ou a página pode ter sido
        movida.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Link
          href="/"
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--green, #4ea884)",
            color: "#07120d",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Ir para o início
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid var(--line-2, rgba(255,255,255,0.12))",
            color: "var(--ink, #fff)",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Meu painel
        </Link>
      </div>
    </div>
  )
}
