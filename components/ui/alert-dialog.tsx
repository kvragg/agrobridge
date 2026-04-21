'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

// Modal de confirmação acessível. Nao depende de radix/shadcn — mantém deps enxutas.
// Foca o botão de cancelar ao abrir, fecha com ESC ou clique no backdrop.
// O botão de confirmar usa cor vermelha por padrão (uso: exclusão/irreversível).

interface AlertDialogProps {
  open: boolean
  titulo: string
  descricao: string
  textoConfirmar?: string
  textoCancelar?: string
  onConfirmar: () => void
  onCancelar: () => void
  processando?: boolean
}

export function AlertDialog({
  open,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  processando = false,
}: AlertDialogProps) {
  const cancelarRef = useRef<HTMLButtonElement | null>(null)

  // ESC fecha; foco no cancelar
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => cancelarRef.current?.focus(), 50)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !processando) onCancelar()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, processando, onCancelar])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-titulo"
      aria-describedby="alert-dialog-descricao"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processando) onCancelar()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2
              id="alert-dialog-titulo"
              className="text-base font-bold text-gray-900"
            >
              {titulo}
            </h2>
            <p
              id="alert-dialog-descricao"
              className="mt-2 text-sm text-gray-600"
            >
              {descricao}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={processando}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:bg-gray-400"
          >
            {processando ? 'Processando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
