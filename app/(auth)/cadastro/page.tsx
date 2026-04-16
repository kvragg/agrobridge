"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, whatsapp },
      },
    })
    setCarregando(false)

    if (error) {
      setErro(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : error.message)
      return
    }

    router.push("/dashboard")
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
          <p className="mt-2 text-sm text-gray-500">Crie sua conta gratuitamente</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-bold text-gray-900">Criar minha conta</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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

            <div>
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

            <div>
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
              />
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
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
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
                <Link href="/termos" className="font-medium text-[#166534] hover:underline">
                  Termos de Uso
                </Link>
              </label>
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:opacity-60"
            >
              {carregando ? "Criando conta..." : "Criar minha conta"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tenho conta —{" "}
          <Link href="/login" className="font-medium text-[#166534] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
