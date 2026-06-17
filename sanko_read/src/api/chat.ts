import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { ChatMessageDto, ChatRequest, ChatResponse } from '@/api/types'
import { mockChatReply, mockDelay } from '@/api/mock/state'

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) {
    return mockDelay({ reply: mockChatReply(payload.message) })
  }
  return request<ChatResponse>('/api/chat', { method: 'POST', body: payload })
}

export async function sendReaderAiMessage(
  bookId: string,
  payload: ChatRequest,
): Promise<ChatResponse> {
  if (USE_MOCK) {
    return mockDelay({ reply: mockChatReply(payload.message, bookId) })
  }
  return request<ChatResponse>(`/api/books/${bookId}/ai/chat`, {
    method: 'POST',
    body: payload,
  })
}

export type { ChatMessageDto }
