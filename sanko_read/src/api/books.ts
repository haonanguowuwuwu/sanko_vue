import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { Book } from '@/types/book'
import { formatAddedDate } from '@/types/book'
import {
  mockDelay,
  mockImportFromFile,
  mockImportSampleBook,
  mockState,
} from '@/api/mock/state'

export interface BookProgressPayload {
  progress: number
  lastReadAt?: string
}

export async function listBooks(): Promise<Book[]> {
  if (USE_MOCK) {
    return mockDelay([...mockState.books])
  }
  return request<Book[]>('/api/books')
}

export async function listTrashedBooks(): Promise<Book[]> {
  if (USE_MOCK) {
    return mockDelay([...mockState.trashedBooks])
  }
  return request<Book[]>('/api/books/trash')
}

export async function getBook(id: string): Promise<Book | null> {
  if (USE_MOCK) {
    const book =
      mockState.books.find((b) => b.id === id) ??
      mockState.trashedBooks.find((b) => b.id === id) ??
      null
    return mockDelay(book)
  }

  try {
    return await request<Book>(`/api/books/${id}`)
  } catch {
    return null
  }
}

export async function importBook(file?: File): Promise<Book> {
  if (USE_MOCK) {
    const book = file ? mockImportFromFile(file) : mockImportSampleBook()
    if (!book) {
      throw new Error('所有样本书籍已导入完毕')
    }
    return mockDelay(book)
  }

  const form = new FormData()
  if (file) {
    form.append('file', file)
  }
  return request<Book>('/api/books/import', { method: 'POST', body: form })
}

export async function trashBook(id: string): Promise<void> {
  if (USE_MOCK) {
    const index = mockState.books.findIndex((b) => b.id === id)
    if (index === -1) return mockDelay(undefined)
    const [book] = mockState.books.splice(index, 1)
    if (book) mockState.trashedBooks.push(book)
    mockState.favoriteIds.delete(id)
    mockState.shelves.forEach((shelf) => {
      shelf.bookIds = shelf.bookIds.filter((bid) => bid !== id)
    })
    return mockDelay(undefined)
  }
  await request<void>(`/api/books/${id}/trash`, { method: 'POST' })
}

export async function restoreBook(id: string): Promise<void> {
  if (USE_MOCK) {
    const index = mockState.trashedBooks.findIndex((b) => b.id === id)
    if (index === -1) return mockDelay(undefined)
    const [book] = mockState.trashedBooks.splice(index, 1)
    if (book) mockState.books.push(book)
    return mockDelay(undefined)
  }
  await request<void>(`/api/books/${id}/restore`, { method: 'POST' })
}

export async function deleteBook(id: string, permanent = false): Promise<void> {
  if (USE_MOCK) {
    if (permanent) {
      mockState.trashedBooks = mockState.trashedBooks.filter((b) => b.id !== id)
      mockState.books = mockState.books.filter((b) => b.id !== id)
    } else {
      mockState.books = mockState.books.filter((b) => b.id !== id)
    }
    mockState.favoriteIds.delete(id)
    mockState.shelves.forEach((shelf) => {
      shelf.bookIds = shelf.bookIds.filter((bid) => bid !== id)
    })
    return mockDelay(undefined)
  }

  await request<void>(`/api/books/${id}`, {
    method: 'DELETE',
    body: permanent ? { permanent: true } : undefined,
  })
}

export async function updateProgress(id: string, payload: BookProgressPayload): Promise<Book> {
  if (USE_MOCK) {
    const book = mockState.books.find((b) => b.id === id)
    if (!book) throw new Error('书籍不存在')
    book.progress = payload.progress
    if (payload.lastReadAt) {
      book.lastReadAt = payload.lastReadAt
      mockState.lastReadMap[id] = payload.lastReadAt
    }
    return mockDelay({ ...book })
  }
  return request<Book>(`/api/books/${id}/progress`, { method: 'PATCH', body: payload })
}

export async function searchBooks(query: string): Promise<Book[]> {
  const q = query.trim().toLowerCase()
  if (!q) {
    return listBooks()
  }

  if (USE_MOCK) {
    const matched = mockState.books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    )
    return mockDelay(matched)
  }

  return request<Book[]>(`/api/books/search?q=${encodeURIComponent(q)}`)
}

export async function touchLastRead(id: string): Promise<void> {
  const lastReadAt = formatAddedDate()
  if (USE_MOCK) {
    mockState.lastReadMap[id] = lastReadAt
    const book = mockState.books.find((b) => b.id === id)
    if (book) book.lastReadAt = lastReadAt
    return mockDelay(undefined)
  }
  await request<void>(`/api/books/${id}/progress`, {
    method: 'PATCH',
    body: { lastReadAt },
  })
}

export async function listFavoriteIds(): Promise<string[]> {
  if (USE_MOCK) {
    return mockDelay([...mockState.favoriteIds])
  }
  return request<string[]>('/api/favorites')
}

export async function addFavorite(bookId: string): Promise<void> {
  if (USE_MOCK) {
    mockState.favoriteIds.add(bookId)
    return mockDelay(undefined)
  }
  await request<void>(`/api/favorites/${bookId}`, { method: 'POST' })
}

export async function removeFavorite(bookId: string): Promise<void> {
  if (USE_MOCK) {
    mockState.favoriteIds.delete(bookId)
    return mockDelay(undefined)
  }
  await request<void>(`/api/favorites/${bookId}`, { method: 'DELETE' })
}

export function syncMockBooks(books: Book[], trashed: Book[], favoriteIds: string[], lastReadMap: Record<string, string>) {
  if (!USE_MOCK) return
  mockState.books = books
  mockState.trashedBooks = trashed
  mockState.favoriteIds = new Set(favoriteIds)
  mockState.lastReadMap = lastReadMap
}
