'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function ConfirmadoPage() {
  const router = useRouter()
  const [segundos, setSegundos] = useState(3)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0))
    }, 1000)

    const timer = setTimeout(() => {
      router.push('/planos')
      router.refresh()
    }, 3000)

    return () => {
      clearInterval(intervalo)
      clearTimeout(timer)
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#f9fafb] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-[#16a34a]" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-black text-gray-900">
          Conta ativa!
        </h1>
        <p className="mb-8 text-base text-gray-600">
          Agora escolha como você quer aprovar seu crédito.
        </p>

        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
          <Loader2 className="h-4 w-4 animate-spin text-[#166534]" />
          Abrindo planos em {segundos}s...
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Se não for redirecionado automaticamente,{' '}
          <button
            onClick={() => router.push('/planos')}
            className="font-semibold text-[#166534] hover:underline"
          >
            clique aqui
          </button>
          .
        </p>
      </div>
    </main>
  )
}
