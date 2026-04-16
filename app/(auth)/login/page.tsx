"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  // Estado para recuperação de senha
  const [recuperando, setRecuperando] = useState(false)
  const [emailRecuperacao, setEmailRecuperacao] = useState("")
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("")
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)

    if (error) {
      setErro("E-mail ou senha incorretos. Verifique e tente novamente.")
      return
    }

    router.push("/dashboard")
  }

  async function handleRecuperarSenha(e: React.FormEvent) {
    e.preventDefault()
    setMensagemRecuperacao("")
    setEnviandoRecuperacao(true)

    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacao, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nova-senha`,
    })
    setEnviandoRecuperacao(false)

    if (error) {
      setMensagemRecuperacao("Não foi possível enviar o e-mail. Verifique o endereço.")
    } else {
      setMensagemRecuperacao("E-mail de recuperação enviado! Verifique sua caixa de entrada.")
    }
  }

  if (recuperando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-black tracking-tight">
              <span className="text-[#166534]">Agro</span>
              <span className="text-gray-900">Bridge</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-xl font-bold text-gray-900">Recuperar senha</h1>
            <p className="mb-6 text-sm text-gray-500">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
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
                <p className={`rounded-lg px-3.5 py-2.5 text-sm ${
                  mensagemRecuperacao.includes("enviado")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}>
                  {mensagemRecuperacao}
                </p>
              )}

              <button
                type="submit"
                disabled={enviandoRecuperacao}
                className="w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
              >
                {enviandoRecuperacao ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            <button
              onClick={() => { setRecuperando(false); setMensagemRecuperacao("") }}
              className="font-medium text-[#166534] hover:underline"
            >
              Voltar ao login
            </button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-[#166534]">Agro</span>
            <span className="text-gray-900">Bridge</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Acesse sua conta</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Entrar</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <button
                  type="button"
                  onClick={() => setRecuperando(true)}
                  className="text-xs text-[#166534] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Sua senha"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
              />
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tenho conta —{" "}
          <Link href="/cadastro" className="font-medium text-[#166534] hover:underline">
            Cadastrar
          </Link>
        </p>
      </div>
    </main>
  )
}
