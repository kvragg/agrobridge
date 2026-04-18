"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Eye, EyeOff, Mail } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { validarSenha } from "@/lib/validation"

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
  const [emailJaCadastrado, setEmailJaCadastrado] = useState(false)
  const [sucessoReenvio, setSucessoReenvio] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setEmailJaCadastrado(false)
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
        if (data?.codigo === "email_ja_cadastrado") {
          setEmailJaCadastrado(true)
        } else if (res.status === 429) {
          setErro(data?.erro ?? "Muitas tentativas. Aguarde alguns minutos.")
        } else {
          setErro(data?.erro ?? "Erro ao criar conta.")
        }
        return
      }

      if (data.temSessao) {
        // Confirmação desabilitada → recarregar para pegar cookies
        await supabase.auth.getUser()
        router.push("/dashboard")
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
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origin }),
      })
      if (res.ok) setSucessoReenvio(true)
      else {
        const data = await res.json().catch(() => ({}))
        setErro(data?.erro ?? "Não foi possível reenviar o e-mail.")
      }
    } catch {
      setErro("Erro de conexão ao reenviar.")
    } finally {
      setReenviando(false)
    }
  }

  if (confirmado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-[#16a34a]" />
            </div>
          </div>
          <h1 className="mb-3 text-2xl font-black text-gray-900">
            Confirme seu e-mail
          </h1>
          <p className="mb-2 text-gray-600">
            Enviamos um link de confirmação para:
          </p>
          <p className="mb-6 font-semibold text-[#166534]">{email}</p>
          <p className="mb-4 text-sm text-gray-500">
            Clique no link do e-mail para ativar sua conta.
          </p>

          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
            <p className="font-semibold">Não recebeu em alguns minutos?</p>
            <p className="mt-1">
              Verifique também sua caixa de <strong>spam</strong> ou{" "}
              <strong>promoções</strong>. O remetente é{" "}
              <em>no-reply / AgroBridge</em>.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#166534] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
          >
            Ir para o login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-[#166534]">Agro</span>
            <span className="text-gray-900">Bridge</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            Crie sua conta e comece agora
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">
            Criar minha conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="João da Silva"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="(67) 99999-9999"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailJaCadastrado(false)
                  }}
                  required
                  autoComplete="email"
                  placeholder="joao@exemplo.com"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="8+ caracteres, 1 número, 1 maiúscula"
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
              <p className="mt-1.5 text-xs text-gray-400">
                Mínimo 8 caracteres, com ao menos 1 número e 1 letra maiúscula.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repita a senha"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  confirmarSenha && confirmarSenha !== senha
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#166534] focus:ring-[#166534]/20"
                }`}
              />
            </div>

            {/* Checkbox termos — reescrito para corrigir bug de toggle ao clicar nos links */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="termos"
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-[#166534]"
              />
              <div className="text-sm text-gray-600">
                <label htmlFor="termos" className="cursor-pointer select-none">
                  Li e aceito os
                </label>{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-[#166534] hover:underline"
                >
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-[#166534] hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </div>
            </div>

            {erro && <Alert variante="erro">{erro}</Alert>}

            {emailJaCadastrado && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Este e-mail já está cadastrado.
                </p>
                <p className="text-xs text-amber-700">
                  Se você já confirmou o e-mail, faça login. Caso ainda não
                  tenha confirmado, podemos reenviar o link.
                </p>
                {sucessoReenvio && (
                  <Alert variante="sucesso" className="!py-2">
                    Link de confirmação reenviado. Verifique sua caixa de entrada
                    e spam.
                  </Alert>
                )}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleReenviar}
                    disabled={reenviando}
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
                  >
                    {reenviando ? "Reenviando..." : "Reenviar confirmação"}
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 rounded-lg bg-[#166534] px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#14532d]"
                  >
                    Fazer login
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3.5 py-2.5 text-xs text-green-800">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#166534]" />
              <p>
                Após o cadastro, enviaremos um link de confirmação por e-mail.{" "}
                <strong>Verifique também sua caixa de spam.</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={carregando || !aceitouTermos}
              className="mt-2 w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
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
                  Criando conta...
                </span>
              ) : (
                "Criar minha conta"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tenho conta —{" "}
          <Link
            href="/login"
            className="font-medium text-[#166534] hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  )
}
