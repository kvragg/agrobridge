'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from './ChatBubble'
import { ChatInput } from './ChatInput'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

interface ChatWindowProps {
  mensagens: Mensagem[]
  onEnviar: (mensagem: string) => void
  carregando?: boolean
}

export function ChatWindow({ mensagens, onEnviar, carregando }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto rounded border p-4">
        {mensagens.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {carregando && (
          <ChatBubble role="assistant" content="..." />
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onEnviar={onEnviar} desabilitado={carregando} />
    </div>
  )
}
