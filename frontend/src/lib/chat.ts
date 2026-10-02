import type { UIMessage } from 'ai'

import { api } from '@/lib/api'

export type { UIMessage }

export type ThreadSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

type ThreadListResponse = {
  threads: ThreadSummary[]
}

type MessageHistoryResponse = {
  messages: UIMessage[]
}

export async function listThreads(): Promise<ThreadSummary[]> {
  const response = await api.get<ThreadListResponse>('/chat/threads')
  return response.threads
}

export async function createThread(title?: string): Promise<ThreadSummary> {
  return api.post<ThreadSummary>('/chat/threads', title ? { title } : {})
}

export async function deleteThread(threadId: string): Promise<void> {
  await api.delete<void>(`/chat/threads/${threadId}`)
}

export async function getThreadMessages(threadId: string): Promise<UIMessage[]> {
  const response = await api.get<MessageHistoryResponse>(
    `/chat/threads/${threadId}/messages`,
  )
  return response.messages
}

export function textFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}