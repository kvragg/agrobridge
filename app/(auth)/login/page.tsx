"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { sanitizarCaminhoInterno } from "@/lib/safe-redirect"
import { AuthSplit } from "@/components/shell/AuthSplit"
import { FormField } from "@/components/shell/FormField"
import { Alert } from "@/components/shell/Alert"
import { Button, Icon } from "@/components/landing/primitives"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [carregando, setCarregando] = useState(false)

  const destino = sanitizarCaminhoInterno(searchParams.get("next"), "/dashboard")

  useEffect(() => {
    if (searchParams.get("erro") === "confirmacao") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErro(
        "Não foi possível confirmar seu e-mail. O link pode ter expirado. Tente fazer login — caso seu cadastro já esteja ativo, você entrará normalmente.",
      )
    }
  }, [searchParams])

  const [recuperando, setRecuperando] = useState(false)
  const [emailRecuperacao, setEmailRecuperacao] = useState("")
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("")
  const [recuperacaoSucesso, setRecuperacaoSucesso] = useState(false)
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    setCarregando(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 429) {
          setErro(data?.erro ?? "Muitas tentativas. Tente novamente mais tarde.")
        } else if (data?.codigo === "email_nao_confirmado") {
          setErro(data.erro)
        } else {
          setErro(data?.erro ?? "E-mail ou senha incorretos.")
        }
        return
      }

      await supabase.auth.getUser()
      setSucesso("Login realizado. Redirecionando…")
      router.push(destino)
      router.refresh()
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão.")
    } finally {
      setCarregando(false)
    }
  }

  async function handleRecuperarSenha(e: React.FormEvent) {
    e.preventDefault()
    setMensagemRecuperacao("")
    setRecuperacaoSucesso(false)
    setEnviandoRecuperacao(true)

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL

    const { error } = await supabase.auth.resetPasswordForEmail(
      emailRecuperacao,
      { redirectTo: `${origin}/auth/callback?next=/resetar-senha` },
    )
    setEnviandoRecuperacao(false)

    if (error) {
      setMensagemRecuperacao(
        "Não foi possível enviar o e-mail. Verifique o endereço.",
      )
      setRecuperacaoSucesso(false)
    } else {
      setMensagemRecuperacao(
        "E-mail enviado. Verifique sua caixa de entrada e o spam.",
      )
      setRecuperacaoSucesso(true)
    }
  }

  // ─── Modo recuperar senha ─────────────────────────────────────
  if (recuperando) {
    return (
      <AuthSplit glow="green" maxWidth={460}>
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Recuperar senha
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14.5,
              color: "var(--ink-2)",
              lineHeight: 1.6,
            }}
          >
            Informe seu e-mail e enviamos um link pra redefinir.
          </p>
        </div>

        <form onSubmit={handleRecuperarSenha}>
          <FormField
            label="E-mail"
            type="email"
            value={emailRecuperacao}
            onChange={(e) => setEmailRecuperacao(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com"
          />

          {mensagemRecuperacao && (
            <Alert variant={recuperacaoSucesso ? "success" : "error"}>
              {mensagemRecuperacao}
            </Alert>
          )}

          <Button
            variant="accent"
            size="lg"
            type="submit"
            style={{ width: "100%", marginTop: 12 }}
          >
            {enviandoRecuperacao ? (
              <>
                {Icon.spinner(15)} Enviando…
              </>
            ) : (
              <>
                Enviar link de recuperação {Icon.arrow(15)}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setRecuperando(false)
              setMensagemRecuperacao("")
            }}
            style={{ width: "100%", marginTop: 10 }}
          >
            Voltar ao login
          </Button>
        </form>
      </AuthSplit>
    )
  }

  // ─── Modo login normal ───────────────────────────────────────
  return (
    <AuthSplit glow="green" maxWidth={460}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Entrar
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          Continue de onde parou.
        </p>
      </div>

      <form onSubmit={handleLogin}>
        <FormField
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="seu@email.com"
        />

        <FormField
          label="Senha"
          passwordToggle
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Sua senha"
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: -8,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRecuperando(true)
              setErro("")
              setSucesso("")
            }}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 12.5,
              color: "var(--muted)",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <Button
          variant="accent"
          size="lg"
          type="submit"
          style={{
            width: "100%",
            marginTop: 8,
            opacity: carregando ? 0.6 : 1,
            cursor: carregando ? "not-allowed" : "pointer",
          }}
        >
          {carregando ? (
            <>
              {Icon.spinner(15)} Entrando…
            </>
          ) : (
            <>
              Entrar {Icon.arrow(15)}
            </>
          )}
        </Button>
      </form>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--line)",
          textAlign: "center",
          fontSize: 13.5,
          color: "var(--muted)",
        }}
      >
        Não tem conta?{" "}
        <Link
          href="/cadastro"
          style={{
            color: "var(--green)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Criar conta gratuita
        </Link>
      </div>
    </AuthSplit>
  )
}
