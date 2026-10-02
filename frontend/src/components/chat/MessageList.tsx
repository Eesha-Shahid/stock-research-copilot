import type { ChatStatus, UIMessage } from 'ai'

import { MessageBubble } from '@/components/chat/MessageBubble'
import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/components/ui/chat-container'
import { PromptSuggestion } from '@/components/ui/prompt-suggestions'
import { ScrollButton } from '@/components/ui/scroll-button'
import { textFromMessage } from '@/lib/chat'
import { EXAMPLE_QUESTIONS } from '@/lib/suggestions'

type MessageListProps = {
  messages: UIMessage[]
  status: ChatStatus
  onSendSuggestion: (text: string) => void
}

export function MessageList({ messages, status, onSendSuggestion }: MessageListProps) {
  const isBusy = status === 'submitted' || status === 'streaming'
  const lastMessage = messages[messages.length - 1]
  const lastIsStreamingAssistant =
    status === 'streaming' &&
    lastMessage?.role === 'assistant' &&
    textFromMessage(lastMessage).length > 0

  // Show a waiting indicator until the first answer text arrives.
  const showThinking = isBusy && !lastIsStreamingAssistant

  return (
    <ChatContainerRoot className="relative flex-1">
      <ChatContainerContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Ask about SEC filings
              </h2>
              <p className="text-sm text-muted-foreground">
                Start with one of these questions or write your own.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUESTIONS.map((question) => (
                <PromptSuggestion
                  key={question}
                  size="sm"
                  className="text-xs"
                  onClick={() => onSendSuggestion(question)}
                >
                  {question}
                </PromptSuggestion>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message === lastMessage && lastIsStreamingAssistant}
          />
        ))}

        {showThinking ? (
          <p aria-live="polite" className="animate-pulse text-sm text-muted-foreground">
            Thinking…
          </p>
        ) : null}
      </ChatContainerContent>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto">
          <ScrollButton />
        </div>
      </div>
    </ChatContainerRoot>
  )
}