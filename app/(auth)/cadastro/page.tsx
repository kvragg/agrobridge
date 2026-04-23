"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { validarSenha } from "@/lib/validation"
import { AuthSplit } from "@/components/shell/AuthSplit"
import { FormField } from "@/components/shell/FormField"
import { Alert } from "@/components/shell/Alert"
import { Button, Icon } from "@/components/landing/primitives"

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro] = useState("")
  const [sucessoReenvio, setSucessoReenvio] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucessoReenvio(false)

    const vSenha = validarSenha(senha)
    if (!vSenha.ok) {
      setErro(vSenha.erro)
      return
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }
    if (!aceitouTermos) {
      setErro("Você precisa aceitar os Termos de Uso para continuar.")
      return
    }

    setCarregando(true)
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, whatsapp, origin }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(
          data?.erro ??
            (res.status === 429
              ? "Muitas tentativas. Aguarde alguns minutos."
              : "Erro ao criar conta."),
        )
        return
      }

      if (data.temSessao) {
        await supabase.auth.getUser()
        router.push("/planos")
        router.refresh()
        return
      }
      setConfirmado(true)
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão.")
    } finally {
      setCarregando(false)
    }
  }

  async function handleReenviar() {
    setReenviando(true)
    setSucessoReenvio(false)
    setErro("")
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origin }),
      })
      if (res.ok) {
        setSucessoReenvio(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setErro(data?.erro ?? "Não foi possível reenviar o e-mail.")
      }
    } catch {
      setErro("Erro de conexão ao reenviar.")
    } finally {
      setReenviando(false)
    }
  }

  // Estado pós-signup — anti-enumeração: exibido sempre, independe
  // do e-mail existir ou não.
  if (confirmado) {
    return (
      <AuthSplit glow="gold" maxWidth={480}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(201,168,106,0.22) 0%, rgba(201,168,106,0.08) 100%)",
              border: "1px solid rgba(201,168,106,0.35)",
              color: "var(--gold)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 40px rgba(201,168,106,0.25)",
            }}
          >
            {Icon.mail(32)}
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Confirme seu e-mail
          </h1>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 14.5,
              color: "var(--ink-2)",
              lineHeight: 1.6,
            }}
          >
            Enviamos um link de confirmação para:
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--green)",
              wordBreak: "break-all",
            }}
          >
            {email}
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 13.5,
              color: "var(--muted)",
              lineHeight: 1.55,
            }}
          >
            Clique no link do e-mail para ativar sua conta. Se você já se
            cadastrou antes, basta fazer login.
          </p>

          {sucessoReenvio && (
            <Alert variant="success">
              Link de confirmação reenviado. Verifique também o spam.
            </Alert>
          )}
          {erro && <Alert variant="error">{erro}</Alert>}

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              variant="ghost"
              size="md"
              onClick={handleReenviar}
              style={{ flex: 1, minWidth: 160 }}
            >
              {reenviando ? "Reenviando…" : "Reenviar confirmação"}
            </Button>
            <Button
              variant="accent"
              size="md"
              href="/login"
              style={{ flex: 1, minWidth: 160 }}
            >
              Fazer login {Icon.arrow(14)}
            </Button>
          </div>
        </div>
      </AuthSplit>
    )
  }

  return (
    <AuthSplit glow="green" maxWidth={520}>
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
          Criar conta
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          A entrevista com a IA começa logo depois. Gratuita, ~10 min.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          autoComplete="name"
          placeholder="João da Silva"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
          className="cadastro-row"
        >
          <FormField
            label="WhatsApp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            autoComplete="tel"
            placeholder="(67) 99999-9999"
          />
          <FormField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="joao@exemplo.com"
          />
        </div>

        <FormField
          label="Senha"
          passwordToggle
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8+ caracteres, 1 número, 1 maiúscula"
          hint="Mínimo 8 caracteres, com ao menos 1 número e 1 letra maiúscula."
        />

        <FormField
          label="Confirmar senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Repita a senha"
          error={
            confirmarSenha && confirmarSenha !== senha
              ? "As senhas não coincidem."
              : undefined
          }
        />

        <label
          htmlFor="termos"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 0",
            fontSize: 13.5,
            color: "var(--ink-2)",
            cursor: "pointer",
            userSelect: "none",
            lineHeight: 1.55,
          }}
        >
          <input
            id="termos"
            type="checkbox"
            checked={aceitouTermos}
            onChange={(e) => setAceitouTermos(e.target.checked)}
            required
            style={{
              marginTop: 3,
              width: 16,
              height: 16,
              accentColor: "var(--green)",
              flexShrink: 0,
              cursor: "pointer",
            }}
          />
          <span>
            Li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--green)", textDecoration: "underline" }}
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--green)", textDecoration: "underline" }}
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        {erro && <Alert variant="error">{erro}</Alert>}

        <Button
          variant="accent"
          size="lg"
          type="submit"
          style={{
            width: "100%",
            marginTop: 16,
            opacity: carregando || !aceitouTermos ? 0.6 : 1,
            cursor: carregando || !aceitouTermos ? "not-allowed" : "pointer",
          }}
        >
          {carregando ? (
            <>
              {Icon.spinner(15)} Criando conta…
            </>
          ) : (
            <>
              Criar conta {Icon.arrow(15)}
            </>
          )}
        </Button>
      </form>

      <div
        style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid var(--line)",
          textAlign: "center",
          fontSize: 13.5,
          color: "var(--muted)",
        }}
      >
        Já tem conta?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--green)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Fazer login
        </Link>
      </div>

      <style>{`
        @media (max-width: 520px) {
          .cadastro-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AuthSplit>
  )
}
