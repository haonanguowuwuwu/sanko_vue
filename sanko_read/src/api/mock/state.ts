import type { Book } from '@/types/book'
import { SAMPLE_BOOKS, formatAddedDate } from '@/types/book'
import type { Bookshelf } from '@/types/bookshelf'
import { DEFAULT_BOOKSHELVES } from '@/types/bookshelf'
import type { ReaderBookmark, ReaderHighlight, ReaderSpread } from '@/types/reader'
import { READER_SPREADS } from '@/data/readerContent'
import type { AppSettingsDto } from '@/api/types'
import { formatAnnotationTime } from '@/utils/readerMeta'
import {
  clearMockBookFiles,
  formatFileSize,
  parseFormatFromFileName,
  removeMockBookFile,
  storeMockBookFile,
} from '@/api/mock/fileStore'

let bookIdCounter = 1
let shelfIdCounter = 1
let highlightIdCounter = 1
let bookmarkIdCounter = 1

export const mockState = {
  token: null as string | null,
  username: null as string | null,
  books: [] as Book[],
  trashedBooks: [] as Book[],
  favoriteIds: new Set<string>(),
  lastReadMap: {} as Record<string, string>,
  shelves: DEFAULT_BOOKSHELVES.map((s) => ({
    id: `shelf-${shelfIdCounter++}`,
    name: s.name,
    bookIds: [...s.bookIds],
  })) as Bookshelf[],
  highlights: [] as ReaderHighlight[],
  bookmarks: [] as ReaderBookmark[],
  settings: {
    disableRecycleBin: true,
    hideBookshelfBooks: false,
    directDeleteFromShelf: false,
    noPdfCoverAsBookCover: true,
    noCropBookCovers: false,
    showBookshelfBookCount: true,
    enableSoftwareProtection: false,
  } as AppSettingsDto,
}

export function mockDelay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function mockImportSampleBook(): Book | null {
  const importedTitles = new Set([
    ...mockState.books.map((b) => b.title),
    ...mockState.trashedBooks.map((b) => b.title),
  ])
  const template = SAMPLE_BOOKS.find((s) => !importedTitles.has(s.title))
  if (!template) return null

  const book: Book = {
    ...template,
    id: `book-${bookIdCounter++}`,
    addedAt: formatAddedDate(),
  }
  mockState.books.push(book)
  return book
}

export function mockImportFromFile(file: File): Book {
  const format = parseFormatFromFileName(file.name)
  if (!format) {
    throw new Error(`暂不支持该文件格式：.${file.name.split('.').pop() ?? ''}`)
  }

  const title = file.name.replace(/\.[^.]+$/, '')
  const book: Book = {
    id: `book-${bookIdCounter++}`,
    title: title.startsWith('《') ? title : `《${title}》`,
    author: '本地导入',
    progress: 0,
    coverColor: '#5a7a6a',
    coverTitle: title.replace(/^《|》$/g, ''),
    fileSize: formatFileSize(file.size),
    format,
    addedAt: formatAddedDate(),
    category: '本地导入',
  }

  mockState.books.push(book)
  return book
}

/** 读取文件并写入内存书库，需在 mockImportFromFile 之后调用 */
export async function mockStoreImportedFile(bookId: string, file: File): Promise<void> {
  const buffer = await file.arrayBuffer()
  storeMockBookFile(bookId, file, buffer)
}

export function mockGetReaderContent(_bookId: string): ReaderSpread[] {
  return READER_SPREADS
}

export function mockCreateHighlight(
  payload: Omit<ReaderHighlight, 'id' | 'createdAt'> & { id?: string },
): ReaderHighlight {
  const highlight: ReaderHighlight = {
    ...payload,
    id: payload.id ?? `hl-${highlightIdCounter++}`,
    createdAt: formatAnnotationTime(),
  }
  mockState.highlights.push(highlight)
  return highlight
}

export function mockChatReply(message: string, _bookId?: string): string {
  if (message.includes('混凝土') && message.includes('意大利面')) {
    return '混凝土不应该和意大利面搅拌。'
  }
  if (message.includes('逻辑词群')) {
    return '逻辑词群记忆是将意义相近或用法相关的词汇放在同一单元，形成记忆网络的方法。'
  }
  return '这是一个很好的问题！根据当前章节内容，建议结合语境和搭配来理解词汇，而非孤立背诵。'
}

export function mockResetFromBackup(data: {
  books: Book[]
  trashedBooks: Book[]
  favoriteIds: string[]
  shelves: Bookshelf[]
  highlights: ReaderHighlight[]
  bookmarks: ReaderBookmark[]
  settings: AppSettingsDto
}) {
  mockState.books = [...data.books]
  mockState.trashedBooks = [...data.trashedBooks]
  mockState.favoriteIds = new Set(data.favoriteIds)
  mockState.shelves = data.shelves.map((s) => ({ ...s, bookIds: [...s.bookIds] }))
  mockState.highlights = [...data.highlights]
  mockState.bookmarks = [...data.bookmarks]
  mockState.settings = { ...data.settings }
  clearMockBookFiles()
}

export function mockRemoveBookFile(bookId: string) {
  removeMockBookFile(bookId)
}

export function mockCreateBackupPayload() {
  return {
    books: mockState.books,
    trashedBooks: mockState.trashedBooks,
    favoriteIds: [...mockState.favoriteIds],
    shelves: mockState.shelves,
    highlights: mockState.highlights,
    bookmarks: mockState.bookmarks,
    settings: mockState.settings,
    exportedAt: new Date().toISOString(),
  }
}

export function mockNextBookmarkId() {
  return `bm-${bookmarkIdCounter++}`
}

export function mockNextHighlightId() {
  return `hl-${highlightIdCounter++}`
}
