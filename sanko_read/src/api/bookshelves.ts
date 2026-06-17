import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { Bookshelf } from '@/types/bookshelf'
import { mockDelay, mockState } from '@/api/mock/state'

let mockShelfIdCounter = 100

export async function listBookshelves(): Promise<Bookshelf[]> {
  if (USE_MOCK) {
    return mockDelay(mockState.shelves.map((s) => ({ ...s, bookIds: [...s.bookIds] })))
  }
  return request<Bookshelf[]>('/api/bookshelves')
}

export async function createBookshelf(name: string): Promise<Bookshelf> {
  if (USE_MOCK) {
    const shelf: Bookshelf = {
      id: `shelf-${mockShelfIdCounter++}`,
      name: name.trim() || '新书架',
      bookIds: [],
    }
    mockState.shelves.push(shelf)
    return mockDelay({ ...shelf, bookIds: [] })
  }
  return request<Bookshelf>('/api/bookshelves', { method: 'POST', body: { name } })
}

export async function renameBookshelf(id: string, name: string): Promise<Bookshelf> {
  if (USE_MOCK) {
    const shelf = mockState.shelves.find((s) => s.id === id)
    if (!shelf) throw new Error('书架不存在')
    shelf.name = name.trim()
    return mockDelay({ ...shelf, bookIds: [...shelf.bookIds] })
  }
  return request<Bookshelf>(`/api/bookshelves/${id}`, {
    method: 'PATCH',
    body: { name },
  })
}

export async function deleteBookshelf(id: string): Promise<void> {
  if (USE_MOCK) {
    mockState.shelves = mockState.shelves.filter((s) => s.id !== id)
    return mockDelay(undefined)
  }
  await request<void>(`/api/bookshelves/${id}`, { method: 'DELETE' })
}

export async function reorderBookshelves(orderedIds: string[]): Promise<Bookshelf[]> {
  if (USE_MOCK) {
    const map = new Map(mockState.shelves.map((s) => [s.id, s]))
    mockState.shelves = orderedIds
      .map((id) => map.get(id))
      .filter((s): s is Bookshelf => Boolean(s))
    return mockDelay(mockState.shelves.map((s) => ({ ...s, bookIds: [...s.bookIds] })))
  }
  return request<Bookshelf[]>('/api/bookshelves/reorder', {
    method: 'PUT',
    body: { orderedIds },
  })
}

export async function addBookToShelf(shelfId: string, bookId: string): Promise<void> {
  if (USE_MOCK) {
    const shelf = mockState.shelves.find((s) => s.id === shelfId)
    if (shelf && !shelf.bookIds.includes(bookId)) {
      shelf.bookIds.push(bookId)
    }
    return mockDelay(undefined)
  }
  await request<void>(`/api/bookshelves/${shelfId}/books`, {
    method: 'POST',
    body: { bookId },
  })
}

export async function removeBookFromShelf(shelfId: string, bookId: string): Promise<void> {
  if (USE_MOCK) {
    const shelf = mockState.shelves.find((s) => s.id === shelfId)
    if (shelf) {
      shelf.bookIds = shelf.bookIds.filter((id) => id !== bookId)
    }
    return mockDelay(undefined)
  }
  await request<void>(`/api/bookshelves/${shelfId}/books/${bookId}`, { method: 'DELETE' })
}

export function syncMockShelves(shelves: Bookshelf[]) {
  if (!USE_MOCK) return
  mockState.shelves = shelves.map((s) => ({ ...s, bookIds: [...s.bookIds] }))
}
