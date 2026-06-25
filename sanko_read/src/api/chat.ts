import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { ChatMessageDto, ChatRequest, ChatResponse } from '@/api/types'
import { mockChatReply, mockDelay } from '@/api/mock/state'

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) {
    return mockDelay({
      reply: mockChatReply(payload.message, payload.bookId, payload.source),
    })
  }
  return request<ChatResponse>('/api/chat', { method: 'POST', body: payload })
}

/** @deprecated 请使用 sendChatMessage 并传入 source: 'reader' 与 bookId */
export async function sendReaderAiMessage(
  bookId: string,
  payload: Omit<ChatRequest, 'source' | 'bookId'>,
): Promise<ChatResponse> {
  return sendChatMessage({ ...payload, source: 'reader', bookId })
}

export type { ChatMessageDto }
