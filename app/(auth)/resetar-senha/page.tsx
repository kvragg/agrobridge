"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { validarSenha } from "@/lib/validation"

export default function ResetarSenhaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [verificando, setVerificando] = useState(true)
  const [sessaoValida, setSessaoValida] = useState(false)
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
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

    setSucesso("Senha atualizada com sucesso! Redirecionando...")
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1500)
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#166534]" />
          Verificando link...
        </div>
      </main>
    )
  }

  if (!sessaoValida) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              Link expirado
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              Este link de recuperação de senha não é mais válido ou já foi
              utilizado. Solicite um novo link para redefinir sua senha.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#166534] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-[#166534]">Agro</span>
            <span className="text-gray-900">Bridge</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-gray-900">Nova senha</h1>
          <p className="mb-6 text-sm text-gray-500">
            Defina uma nova senha para sua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nova senha
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
                  className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-12 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 sm:text-sm"
                />
                <button
                  type="button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
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
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className={`min-h-[44px] w-full rounded-lg border px-3.5 py-2.5 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 sm:text-sm ${
                  confirmarSenha && confirmarSenha !== senha
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#166534] focus:ring-[#166534]/20"
                }`}
              />
            </div>

            {erro && <Alert variante="erro">{erro}</Alert>}
            {sucesso && <Alert variante="sucesso">{sucesso}</Alert>}

            <button
              type="submit"
              disabled={enviando || Boolean(sucesso)}
              className="mt-2 min-h-[48px] w-full rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Atualizando..." : "Atualizar senha"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
