"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Eye, EyeOff, Mail } from "lucide-react"

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
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.")
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, whatsapp },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    setCarregando(false)

    if (error) {
      setErro(
        error.message === "User already registered"
          ? "Este e-mail já está cadastrado. Tente fazer login."
          : error.message
      )
      return
    }

    // Se já tem sessão (email confirmation desabilitado no projeto), vai direto
    if (data.session) {
      router.push("/dashboard")
      return
    }

    // Caso contrário, precisar confirmar e-mail
    setConfirmado(true)
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
            <p className="font-semibold">
              Não recebeu em alguns minutos?
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
                />
                <button
                  type="button"
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
              {senha.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        senha.length >= i * 3
                          ? senha.length >= 12
                            ? "bg-[#16a34a]"
                            : "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
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
                placeholder="Repita a senha"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 ${
                  confirmarSenha && confirmarSenha !== senha
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#166534] focus:ring-[#166534]/20"
                }`}
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="termos"
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#166534]"
              />
              <label htmlFor="termos" className="text-sm text-gray-600">
                Li e aceito os{" "}
                <Link
                  href="/termos"
                  className="font-medium text-[#166534] hover:underline"
                >
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link
                  href="/privacidade"
                  className="font-medium text-[#166534] hover:underline"
                >
                  Política de Privacidade
                </Link>
              </label>
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {erro}
              </p>
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
              disabled={carregando}
              className="mt-2 w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
