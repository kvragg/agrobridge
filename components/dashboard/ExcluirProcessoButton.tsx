'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { AlertDialog } from '@/components/ui/alert-dialog'

interface Props {
  processoId: string
  descricao: string
}

export default function ExcluirProcessoButton({ processoId, descricao }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function abrir(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setErro(null)
    setOpen(true)
  }

  async function confirmar() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/processos/${processoId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({}))
        setErro(json?.erro ?? 'Não foi possível excluir. Tente novamente.')
        setLoading(false)
        return
      }
      setOpen(false)
      setLoading(false)
      router.refresh()
    } catch {
      setErro('Falha de rede. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-label="Excluir processo"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <AlertDialog
        open={open}
        titulo="Excluir processo"
        descricao={
          erro
            ? `${erro}\n\nO processo “${descricao}” permanece intacto.`
            : `“${descricao}” será removido do painel junto com documentos, mensagens e checklist. A ação não tem desfazer pelo app — registros financeiros são mantidos por 5 anos conforme Política.`
        }
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        processando={loading}
        onConfirmar={confirmar}
        onCancelar={() => {
          if (loading) return
          setOpen(false)
          setErro(null)
        }}
      />
    </>
  )
}
