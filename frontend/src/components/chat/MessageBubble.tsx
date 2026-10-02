import type { UIMessage } from 'ai'

import { textFromMessage } from '@/lib/chat'

type MessageBubbleProps = {
  message: UIMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const text = textFromMessage(message)

  if (message.role === 'assistant') {
    return (
      <div className="min-w-0 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {text}
        {isStreaming ? (
          <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-sm bg-foreground" />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-secondary-foreground">
        {text}
      </div>
    </div>
  )
}