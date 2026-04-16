'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onEnviar: (mensagem: string) => void
  desabilitado?: boolean
}

export function ChatInput({ onEnviar, desabilitado }: ChatInputProps) {
  const [texto, setTexto] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    onEnviar(texto.trim())
    setTexto('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={desabilitado}
        className="flex-1"
      />
      <Button type="submit" disabled={desabilitado || !texto.trim()}>
        Enviar
      </Button>
    </form>
  )
}
