import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { ReaderBookmark, ReaderHighlight, ReaderSpread } from '@/types/reader'
import { mockDelay, mockGetReaderContent, mockState } from '@/api/mock/state'

export async function getBookContent(bookId: string): Promise<ReaderSpread[]> {
  if (USE_MOCK) {
    return mockDelay(mockGetReaderContent(bookId))
  }
  return request<ReaderSpread[]>(`/api/books/${bookId}/content`)
}

export async function getBookSpread(bookId: string, spreadIndex: number): Promise<ReaderSpread> {
  if (USE_MOCK) {
    const spreads = mockGetReaderContent(bookId)
    const spread = spreads[spreadIndex]
    if (!spread) throw new Error('页码不存在')
    return mockDelay(spread)
  }
  return request<ReaderSpread>(`/api/books/${bookId}/content/spreads/${spreadIndex}`)
}

export async function listAnnotations(bookId?: string): Promise<ReaderHighlight[]> {
  if (USE_MOCK) {
    const list = bookId
      ? mockState.highlights.filter((h) => h.bookId === bookId)
      : [...mockState.highlights]
    return mockDelay(list)
  }
  const query = bookId ? `?bookId=${encodeURIComponent(bookId)}` : ''
  return request<ReaderHighlight[]>(`/api/annotations${query}`)
}

export async function createAnnotation(
  payload: Omit<ReaderHighlight, 'id' | 'createdAt'>,
): Promise<ReaderHighlight> {
  if (USE_MOCK) {
    const highlight: ReaderHighlight = {
      ...payload,
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }
    mockState.highlights.push(highlight)
    return mockDelay(highlight)
  }
  return request<ReaderHighlight>('/api/annotations', { method: 'POST', body: payload })
}

export async function updateAnnotation(
  id: string,
  payload: Partial<
    Pick<
      ReaderHighlight,
      | 'color'
      | 'note'
      | 'quote'
      | 'start'
      | 'end'
      | 'spreadIndex'
      | 'chapter'
      | 'range'
      | 'chapterDocIndex'
    >
  >,
): Promise<ReaderHighlight> {
  if (USE_MOCK) {
    const item = mockState.highlights.find((h) => h.id === id)
    if (!item) throw new Error('标注不存在')
    Object.assign(item, payload)
    return mockDelay({ ...item })
  }
  return request<ReaderHighlight>(`/api/annotations/${id}`, { method: 'PATCH', body: payload })
}

export async function deleteAnnotation(id: string): Promise<void> {
  if (USE_MOCK) {
    mockState.highlights = mockState.highlights.filter((h) => h.id !== id)
    return mockDelay(undefined)
  }
  await request<void>(`/api/annotations/${id}`, { method: 'DELETE' })
}

export async function listBookmarks(bookId?: string): Promise<ReaderBookmark[]> {
  if (USE_MOCK) {
    const list = bookId
      ? mockState.bookmarks.filter((b) => b.bookId === bookId)
      : [...mockState.bookmarks]
    return mockDelay(list)
  }
  const query = bookId ? `?bookId=${encodeURIComponent(bookId)}` : ''
  return request<ReaderBookmark[]>(`/api/bookmarks${query}`)
}

export async function createBookmark(
  bookId: string,
  spreadIndex: number,
  chapter?: string,
): Promise<ReaderBookmark> {
  if (USE_MOCK) {
    const bookmark: ReaderBookmark = {
      id: `bm-${Date.now()}`,
      bookId,
      spreadIndex,
      chapter,
      createdAt: new Date().toISOString(),
    }
    mockState.bookmarks.push(bookmark)
    return mockDelay(bookmark)
  }
  return request<ReaderBookmark>('/api/bookmarks', {
    method: 'POST',
    body: { bookId, spreadIndex, chapter },
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  if (USE_MOCK) {
    mockState.bookmarks = mockState.bookmarks.filter((b) => b.id !== id)
    return mockDelay(undefined)
  }
  await request<void>(`/api/bookmarks/${id}`, { method: 'DELETE' })
}

export function syncMockAnnotations(highlights: ReaderHighlight[], bookmarks: ReaderBookmark[]) {
  if (!USE_MOCK) return
  mockState.highlights = [...highlights]
  mockState.bookmarks = [...bookmarks]
}
