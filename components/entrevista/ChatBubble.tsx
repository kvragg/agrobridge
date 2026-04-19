interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`min-w-0 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm md:max-w-[70%] md:p-4 md:text-base ${
          isAssistant
            ? 'rounded-tl-sm bg-muted text-foreground'
            : 'rounded-tr-sm bg-primary text-primary-foreground'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
