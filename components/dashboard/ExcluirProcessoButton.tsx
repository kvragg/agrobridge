'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  processoId: string
  descricao: string
}

export default function ExcluirProcessoButton({ processoId, descricao }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm(
      `Excluir este processo?\n\n${descricao}\n\nOs documentos e mensagens ficam ocultos, não serão usados. Esta ação não tem desfazer pelo app.`
    )
    if (!ok) return
    setLoading(true)
    try {
      const res = await fetch(`/api/processos/${processoId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        alert('Erro ao excluir processo. Tente novamente.')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      alert('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label="Excluir processo"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  )
}
