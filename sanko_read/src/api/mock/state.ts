import type { Book } from '@/types/book'
import { SAMPLE_BOOKS, formatAddedDate } from '@/types/book'
import type { Bookshelf } from '@/types/bookshelf'
import { DEFAULT_BOOKSHELVES } from '@/types/bookshelf'
import type { ReaderBookmark, ReaderHighlight, ReaderSpread } from '@/types/reader'
import { READER_SPREADS } from '@/data/readerContent'
import type { AppSettingsDto } from '@/api/types'
import type { PointsOrder, PointsSummary } from '@/types/profile'
import { formatAnnotationTime } from '@/utils/readerMeta'
import {
  clearMockBookFiles,
  formatFileSize,
  parseFormatFromFileName,
  removeMockBookFile,
  storeMockBookFile,
} from '@/api/mock/fileStore'
import { hydrateMockAnnotationsFromStorage } from '@/api/mock/annotationPersistence'

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
  blockedTags: new Set<string>(),
  catalogComments: new Map<string, import('@/types/catalog').CatalogComment[]>(),
  commentLikes: new Set<string>(),
  settings: {
    disableRecycleBin: true,
    hideBookshelfBooks: false,
    directDeleteFromShelf: false,
    noPdfCoverAsBookCover: true,
    noCropBookCovers: false,
    showBookshelfBookCount: true,
    enableSoftwareProtection: false,
  } as AppSettingsDto,
  pointsSummary: {
    balance: 12580,
    totalEarned: 5260,
    totalUsed: 4560,
  } as PointsSummary,
  pointsOrders: [
    {
      id: 'ORD20260625001',
      time: '2026-06-25 14:30:00',
      type: 'recharge',
      change: 500,
      balance: 12580,
      description: '积分充值-支付宝',
      status: 'completed',
    },
    {
      id: 'ORD20260624002',
      time: '2026-06-24 10:15:00',
      type: 'use',
      change: -200,
      balance: 12080,
      description: '购买《三体》电子书',
      status: 'completed',
    },
    {
      id: 'ORD20260623003',
      time: '2026-06-23 08:00:00',
      type: 'earn',
      change: 30,
      balance: 12280,
      description: '每日签到奖励',
      status: 'completed',
    },
    {
      id: 'ORD20260622004',
      time: '2026-06-22 16:45:00',
      type: 'use',
      change: -100,
      balance: 12250,
      description: '购买《斗破苍穹》电子书',
      status: 'completed',
    },
    {
      id: 'ORD20260621005',
      time: '2026-06-21 09:20:00',
      type: 'recharge',
      change: 1000,
      balance: 12350,
      description: '积分充值-微信',
      status: 'completed',
    },
    {
      id: 'ORD20260620006',
      time: '2026-06-20 12:00:00',
      type: 'earn',
      change: 50,
      balance: 11350,
      description: '完成阅读任务奖励',
      status: 'completed',
    },
    {
      id: 'ORD20260619007',
      time: '2026-06-19 18:30:00',
      type: 'use',
      change: -150,
      balance: 11300,
      description: '购买《Python编程》电子书',
      status: 'completed',
    },
    {
      id: 'ORD20260618008',
      time: '2026-06-18 07:00:00',
      type: 'earn',
      change: 30,
      balance: 11450,
      description: '每日签到奖励',
      status: 'completed',
    },
    {
      id: 'ORD20260617009',
      time: '2026-06-17 15:10:00',
      type: 'recharge',
      change: 300,
      balance: 11420,
      description: '积分充值-支付宝',
      status: 'completed',
    },
    {
      id: 'ORD20260616010',
      time: '2026-06-16 11:00:00',
      type: 'use',
      change: -80,
      balance: 11120,
      description: '购买《高等数学》电子书',
      status: 'completed',
    },
  ] as PointsOrder[],
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

export interface CreateBookEntryPayload {
  title: string
  author: string
  category: string
}

export function mockCreateBookEntry(payload: CreateBookEntryPayload): Book {
  const coverTitle = payload.title.replace(/^《|》$/g, '')
  const book: Book = {
    id: `book-${bookIdCounter++}`,
    title: payload.title.startsWith('《') ? payload.title : `《${payload.title}》`,
    author: payload.author,
    progress: 0,
    coverColor: '#5a7a6a',
    coverTitle,
    fileSize: '—',
    format: '—',
    addedAt: formatAddedDate(),
    category: payload.category,
  }
  mockState.books.push(book)
  return book
}

export function mockUploadBookFile(bookId: string, file: File): Book {
  const book = mockState.books.find((b) => b.id === bookId)
  if (!book) throw new Error('书籍不存在')

  const format = parseFormatFromFileName(file.name)
  if (!format) {
    throw new Error(`暂不支持该文件格式：.${file.name.split('.').pop() ?? ''}`)
  }

  book.fileSize = formatFileSize(file.size)
  book.format = format
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

export function mockChatReply(message: string, bookId?: string, source?: string): string {
  if (source === 'home') {
    return '（首页对话）我可以帮你找书、总结内容或讨论观点。有什么想了解的吗？'
  }
  if (bookId && (source === 'book' || source === 'reader')) {
    return `（书籍 ${bookId} 上下文）这是一个很好的问题！建议结合本书内容来理解，而非孤立背诵。`
  }
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

hydrateMockAnnotationsFromStorage()
