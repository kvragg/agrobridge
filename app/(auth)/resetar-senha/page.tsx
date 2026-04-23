"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { validarSenha } from "@/lib/validation"
import { AuthSplit } from "@/components/shell/AuthSplit"
import { FormField } from "@/components/shell/FormField"
import { Alert } from "@/components/shell/Alert"
import { Button, Icon } from "@/components/landing/primitives"

export default function ResetarSenhaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [verificando, setVerificando] = useState(true)
  const [sessaoValida, setSessaoValida] = useState(false)
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!ativo) return
      setSessaoValida(Boolean(data.user))
      setVerificando(false)
    })()
    return () => {
      ativo = false
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")

    const v = validarSenha(senha)
    if (!v.ok) {
      setErro(v.erro)
      return
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)

    if (error) {
      setErro("Não foi possível atualizar a senha. Tente novamente.")
      return
    }

    setSucesso("Senha atualizada com sucesso. Redirecionando…")
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1500)
  }

  if (verificando) {
    return (
      <AuthSplit cardOnly glow="green" maxWidth={420}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--muted)",
            fontSize: 14,
            justifyContent: "center",
            padding: "20px 0",
          }}
        >
          <span style={{ color: "var(--green)", display: "inline-flex" }}>
            {Icon.spinner(18)}
          </span>
          Verificando link…
        </div>
      </AuthSplit>
    )
  }

  if (!sessaoValida) {
    return (
      <AuthSplit cardOnly glow="gold" maxWidth={460}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(212,113,88,0.12)",
              border: "1px solid rgba(212,113,88,0.30)",
              color: "var(--danger)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            {Icon.lock(28)}
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 24,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            Link expirado
          </h1>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14.5,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            Este link de recuperação não é mais válido ou já foi utilizado.
            Solicite um novo link na tela de login.
          </p>
          <Button variant="accent" size="lg" href="/login" style={{ width: "100%" }}>
            Voltar ao login {Icon.arrow(15)}
          </Button>
        </div>
      </AuthSplit>
    )
  }

  return (
    <AuthSplit glow="green" maxWidth={460}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Nova senha
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14.5,
            color: "var(--ink-2)",
            lineHeight: 1.55,
          }}
        >
          Defina uma nova senha pra sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nova senha"
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
          label="Confirmar nova senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          error={
            confirmarSenha && confirmarSenha !== senha
              ? "As senhas não coincidem."
              : undefined
          }
        />

        {erro && <Alert variant="error">{erro}</Alert>}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}

        <Button
          variant="accent"
          size="lg"
          type="submit"
          style={{
            width: "100%",
            marginTop: 12,
            opacity: enviando || Boolean(sucesso) ? 0.6 : 1,
            cursor: enviando || Boolean(sucesso) ? "not-allowed" : "pointer",
          }}
        >
          {enviando ? (
            <>
              {Icon.spinner(15)} Atualizando…
            </>
          ) : (
            <>
              Atualizar senha {Icon.arrow(15)}
            </>
          )}
        </Button>
      </form>
    </AuthSplit>
  )
}
