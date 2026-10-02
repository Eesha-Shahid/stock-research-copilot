import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'

import { ChatInput } from '@/components/chat/ChatInput'
import { MessageList } from '@/components/chat/MessageList'
import { useChatTransport } from '@/hooks/useChatTransport'
import { useThreads } from '@/hooks/useThreads'
import { getThreadMessages } from '@/lib/chat'
import { ApiError } from '@/lib/http'

type ChatThreadViewProps = {
  threadId: string
  initialMessages: UIMessage[]
}

function ChatThreadView({ threadId, initialMessages }: ChatThreadViewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshThreads } = useThreads()
  const transport = useChatTransport(threadId)

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void refreshThreads()
    },
  })

  function send(text: string) {
    void sendMessage({ text })
  }

  // Auto-send a starter prompt forwarded from the empty page, once.
  const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt
  const sentInitial = useRef(false)
  useEffect(() => {
    if (!initialPrompt || sentInitial.current) return
    sentInitial.current = true
    navigate(location.pathname, { replace: true, state: null })
    send(initialPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList messages={messages} status={status} onSendSuggestion={send} />

      {error ? (
        <p className="mx-auto w-full max-w-3xl px-4 pb-2 text-sm text-destructive" role="alert">
          {error.message || 'Your message could not be sent. Try again.'}
        </p>
      ) : null}

      <ChatInput status={status} onSend={send} onStop={stop} />
    </div>
  )
}

function ChatThreadLoader({ threadId }: { threadId: string }) {
  const navigate = useNavigate()
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoadError(null)

      try {
        const messages = await getThreadMessages(threadId)
        if (mounted) {
          setInitialMessages(messages)
        }
      } catch (err) {
        if (!mounted) {
          return
        }

        if (err instanceof ApiError && err.status === 404) {
          navigate('/chats', { replace: true })
          return
        }

        if (err instanceof ApiError && err.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        setLoadError(err instanceof Error ? err.message : 'This conversation could not be loaded.')
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [threadId, navigate, reloadKey])

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            className="text-sm font-medium underline underline-offset-4"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="animate-pulse text-sm text-muted-foreground">Loading conversation…</p>
      </div>
    )
  }

  return <ChatThreadView threadId={threadId} initialMessages={initialMessages} />
}

export function ChatThreadPage() {
  const { threadId } = useParams()

  if (!threadId) {
    return null
  }

  return <ChatThreadLoader key={threadId} threadId={threadId} />
}