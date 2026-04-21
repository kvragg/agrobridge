'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

type Estado = 'aguardando' | 'processando' | 'ok' | 'erro'

export default function ConfirmarExclusaoClient({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>(token ? 'aguardando' : 'erro')
  const [mensagem, setMensagem] = useState<string | null>(
    token ? null : 'Link inválido — token ausente.'
  )
  const jaEnviou = useRef(false)

  async function confirmar() {
    if (jaEnviou.current) return
    jaEnviou.current = true
    setEstado('processando')
    setMensagem(null)
    try {
      const res = await fetch('/api/conta/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEstado('erro')
        setMensagem(json?.erro ?? 'Não foi possível confirmar a exclusão.')
        return
      }
      setEstado('ok')
      setMensagem(json?.mensagem ?? 'Conta excluída.')
    } catch {
      setEstado('erro')
      setMensagem('Falha de rede. Tente novamente.')
    }
  }

  // Redireciona pra home após 5s quando sucesso.
  useEffect(() => {
    if (estado !== 'ok') return
    const t = setTimeout(() => {
      window.location.href = '/'
    }, 5000)
    return () => clearTimeout(t)
  }, [estado])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900">
            Confirmar exclusão da conta
          </h1>

          {estado === 'aguardando' && (
            <>
              <p className="mt-3 text-sm text-gray-600">
                Ao confirmar, sua conta, processos, entrevistas, checklist e
                uploads ficam inacessíveis. Registros financeiros são arquivados
                conforme a Política de Privacidade. Esta ação é irreversível.
              </p>
              <button
                onClick={confirmar}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800"
              >
                Confirmar exclusão agora
              </button>
              <Link
                href="/dashboard"
                className="mt-3 block text-center text-sm text-gray-500 hover:underline"
              >
                Cancelar e voltar
              </Link>
            </>
          )}

          {estado === 'processando' && (
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-700">
              <Loader2 className="h-5 w-5 animate-spin text-red-700" />
              <span>Processando exclusão…</span>
            </div>
          )}

          {estado === 'ok' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  {mensagem ?? 'Conta excluída com sucesso.'}
                </p>
                <p className="mt-1 text-green-800">
                  Você será redirecionado em alguns segundos.
                </p>
              </div>
            </div>
          )}

          {estado === 'erro' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  {mensagem ?? 'Falha na confirmação.'}
                </p>
                <Link
                  href="/conta/dados"
                  className="mt-2 inline-block font-medium underline"
                >
                  Gerar novo link
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
