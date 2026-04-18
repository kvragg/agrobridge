"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, ArrowRight, Sprout } from "lucide-react"
import { Alert } from "@/components/ui/alert"

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
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const destino = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    if (searchParams.get("erro") === "confirmacao") {
      setErro(
        "Não foi possível confirmar seu e-mail. O link pode ter expirado. Tente fazer login — caso seu cadastro já esteja ativo, você entrará normalmente."
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

      // Sincronizar client-side session (server já setou cookies)
      await supabase.auth.getUser()
      setSucesso("Login realizado! Redirecionando...")
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
      {
        redirectTo: `${origin}/auth/callback?next=/resetar-senha`,
      }
    )
    setEnviandoRecuperacao(false)

    if (error) {
      setMensagemRecuperacao(
        "Não foi possível enviar o e-mail. Verifique o endereço."
      )
      setRecuperacaoSucesso(false)
    } else {
      setMensagemRecuperacao(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada e spam."
      )
      setRecuperacaoSucesso(true)
    }
  }

  if (recuperando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-black tracking-tight">
              <span className="text-[#166534]">Agro</span>
              <span className="text-gray-900">Bridge</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              Recuperar senha
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  type="email"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
              </div>

              {mensagemRecuperacao && (
                <Alert variante={recuperacaoSucesso ? "sucesso" : "erro"}>
                  {mensagemRecuperacao}
                </Alert>
              )}

              <button
                type="submit"
                disabled={enviandoRecuperacao}
                className="w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
              >
                {enviandoRecuperacao
                  ? "Enviando..."
                  : "Enviar link de recuperação"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            <button
              onClick={() => {
                setRecuperando(false)
                setMensagemRecuperacao("")
                setRecuperacaoSucesso(false)
              }}
              className="font-medium text-[#166534] hover:underline"
            >
              ← Voltar ao login
            </button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb]">
      {/* Left panel - decorativo */}
      <div className="hidden flex-col justify-between bg-[#14532d] p-12 lg:flex lg:w-[420px]">
        <Link href="/" className="text-2xl font-black tracking-tight text-white">
          <span className="text-[#86efac]">Agro</span>Bridge
        </Link>

        <div>
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Sprout className="h-7 w-7 text-[#86efac]" />
          </div>
          <blockquote className="text-xl font-bold leading-snug text-white">
            &ldquo;Dossiê completo,
            <br />
            crédito aprovado.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-green-300">
            Entrevista, checklist e documentação — tudo em um lugar.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Checklist personalizado por banco",
            "IA treinada no MCR do Bacen",
            "LGPD compliant",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-green-200"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-2xl font-black tracking-tight">
              <span className="text-[#166534]">Agro</span>
              <span className="text-gray-900">Bridge</span>
            </Link>
          </div>

          <h1 className="mb-2 text-2xl font-black text-gray-900">
            Bem-vindo de volta
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Acesse sua conta para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setRecuperando(true)}
                  className="text-xs text-[#166534] hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
                <button
                  type="button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {erro && <Alert variante="erro">{erro}</Alert>}
            {sucesso && <Alert variante="sucesso">{sucesso}</Alert>}

            <button
              type="submit"
              disabled={carregando}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-[#166534] hover:underline"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
