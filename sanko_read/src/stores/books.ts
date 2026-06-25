import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Book } from '@/types/book'
import { formatAddedDate } from '@/types/book'
import * as booksApi from '@/api/books'
import { seedDemoAnnotationsIfNeeded } from '@/api/mock/demoAnnotations'
import { useSettingsStore } from '@/stores/settings'

export type SortField =
  | 'recent'
  | 'title'
  | 'addedAt'
  | 'readDuration'
  | 'author'
  | 'progress'
  | 'fileSize'

export type SortOrder = 'asc' | 'desc'

function parseFileSize(size: string): number {
  const num = parseFloat(size)
  if (size.includes('GB')) return num * 1024
  if (size.includes('KB')) return num / 1024
  return num
}

function compareBooks(a: Book, b: Book, field: SortField, order: SortOrder, lastReadMap: Record<string, string>) {
  const dir = order === 'asc' ? 1 : -1

  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title, 'zh-CN') * dir
    case 'author':
      return a.author.localeCompare(b.author, 'zh-CN') * dir
    case 'addedAt':
      return a.addedAt.localeCompare(b.addedAt) * dir
    case 'progress':
      return (a.progress - b.progress) * dir
    case 'fileSize':
      return (parseFileSize(a.fileSize) - parseFileSize(b.fileSize)) * dir
    case 'readDuration':
      return (a.progress * 10 - b.progress * 10) * dir
    case 'recent':
    default: {
      const ta = lastReadMap[a.id] ?? a.lastReadAt ?? a.addedAt
      const tb = lastReadMap[b.id] ?? b.lastReadAt ?? b.addedAt
      return tb.localeCompare(ta) * (order === 'asc' ? 1 : -1)
    }
  }
}

function filterBySearch(list: Book[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q),
  )
}

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([])
  const trashedBooks = ref<Book[]>([])
  const favoriteIds = ref<Set<string>>(new Set())
  const selectionMode = ref(false)
  const selectedIds = ref<Set<string>>(new Set())
  const sortField = ref<SortField>('recent')
  const sortOrder = ref<SortOrder>('desc')
  const lastReadMap = ref<Record<string, string>>({})
  const searchQuery = ref('')
  const loading = ref(false)
  const initialized = ref(false)

  const selectedCount = computed(() => selectedIds.value.size)
  const isAllSelected = computed(
    () => books.value.length > 0 && selectedIds.value.size === books.value.length,
  )

  const sortedBooks = computed(() =>
    [...books.value].sort((a, b) =>
      compareBooks(a, b, sortField.value, sortOrder.value, lastReadMap.value),
    ),
  )

  const searchableSortedBooks = computed(() =>
    filterBySearch(sortedBooks.value, searchQuery.value),
  )

  const sortedTrashedBooks = computed(() =>
    [...trashedBooks.value].sort((a, b) =>
      compareBooks(a, b, sortField.value, sortOrder.value, lastReadMap.value),
    ),
  )

  function sortBookList(list: Book[]) {
    return [...list].sort((a, b) =>
      compareBooks(a, b, sortField.value, sortOrder.value, lastReadMap.value),
    )
  }

  function setSortField(field: SortField) {
    sortField.value = field
  }

  function setSortOrder(order: SortOrder) {
    sortOrder.value = order
  }

  async function fetchAll() {
    loading.value = true
    try {
      const [bookList, trashList, favorites] = await Promise.all([
        booksApi.listBooks(),
        booksApi.listTrashedBooks(),
        booksApi.listFavoriteIds(),
      ])
      books.value = bookList
      trashedBooks.value = trashList
      favoriteIds.value = new Set(favorites)
      bookList.forEach((book) => {
        if (book.lastReadAt) {
          lastReadMap.value[book.id] = book.lastReadAt
        }
      })
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function touchLastRead(id: string) {
    const lastReadAt = formatAddedDate()
    lastReadMap.value[id] = lastReadAt
    const book = books.value.find((b) => b.id === id)
    if (book) book.lastReadAt = lastReadAt
    await booksApi.touchLastRead(id)
  }

  async function updateProgress(id: string, progress: number) {
    const book = books.value.find((b) => b.id === id)
    const lastReadAt = formatAddedDate()
    if (book) {
      book.progress = progress
      book.lastReadAt = lastReadAt
      lastReadMap.value[id] = lastReadAt
    }
    await booksApi.updateProgress(id, { progress, lastReadAt })
  }

  const allSelectedFavorited = computed(() => {
    if (selectedIds.value.size === 0) return false
    return [...selectedIds.value].every((id) => favoriteIds.value.has(id))
  })

  function isRecycleBinEnabled() {
    return !useSettingsStore().disableRecycleBin
  }

  function detachBookFromLibrary(id: string) {
    favoriteIds.value.delete(id)
    selectedIds.value.delete(id)
  }

  async function createBookEntry(payload: booksApi.CreateBookEntryPayload) {
    const book = await booksApi.createBookEntry(payload)
    books.value.push(book)
    return book
  }

  async function uploadBookFile(bookId: string, file: File) {
    const updated = await booksApi.uploadBookFile(bookId, file)
    const index = books.value.findIndex((b) => b.id === bookId)
    if (index !== -1) {
      books.value[index] = updated
    }
    return updated
  }

  async function importBook(file?: File) {
    const book = await booksApi.importBook(file)
    books.value.push(book)
    return book
  }

  /** @deprecated 使用 importBook */
  async function importNextSampleBook() {
    return importBook()
  }

  async function moveToRecycleBin(id: string) {
    await booksApi.trashBook(id)
    const index = books.value.findIndex((b) => b.id === id)
    if (index === -1) return
    const [book] = books.value.splice(index, 1)
    if (!book) return
    detachBookFromLibrary(id)
    trashedBooks.value.push(book)
  }

  async function removeBook(id: string) {
    await booksApi.deleteBook(id, true)
    books.value = books.value.filter((b) => b.id !== id)
    detachBookFromLibrary(id)
  }

  async function permanentlyDeleteFromRecycleBin(id: string) {
    await booksApi.deleteBook(id, true)
    trashedBooks.value = trashedBooks.value.filter((b) => b.id !== id)
  }

  async function restoreFromRecycleBin(id: string) {
    await booksApi.restoreBook(id)
    const index = trashedBooks.value.findIndex((b) => b.id === id)
    if (index === -1) return
    const [book] = trashedBooks.value.splice(index, 1)
    if (!book) return
    books.value.push(book)
  }

  async function removeSelected() {
    const ids = [...selectedIds.value]
    await Promise.all(ids.map((id) => removeBook(id)))
    exitSelectionMode()
  }

  async function moveSelectedToRecycleBin() {
    const ids = [...selectedIds.value]
    await Promise.all(ids.map((id) => moveToRecycleBin(id)))
    exitSelectionMode()
  }

  async function toggleFavorite(id: string) {
    if (favoriteIds.value.has(id)) {
      await booksApi.removeFavorite(id)
      favoriteIds.value.delete(id)
    } else {
      await booksApi.addFavorite(id)
      favoriteIds.value.add(id)
    }
  }

  async function addSelectedToFavorites() {
    const ids = [...selectedIds.value]
    await Promise.all(
      ids.map(async (id) => {
        if (!favoriteIds.value.has(id)) {
          await booksApi.addFavorite(id)
          favoriteIds.value.add(id)
        }
      }),
    )
  }

  async function removeSelectedFromFavorites() {
    const ids = [...selectedIds.value]
    await Promise.all(
      ids.map(async (id) => {
        if (favoriteIds.value.has(id)) {
          await booksApi.removeFavorite(id)
          favoriteIds.value.delete(id)
        }
      }),
    )
  }

  function isFavorite(id: string) {
    return favoriteIds.value.has(id)
  }

  function getBookById(id: string) {
    return books.value.find((b) => b.id === id) ?? trashedBooks.value.find((b) => b.id === id)
  }

  function enterSelectionMode(initialId?: string) {
    selectionMode.value = true
    selectedIds.value.clear()
    if (initialId) {
      selectedIds.value.add(initialId)
    }
  }

  function exitSelectionMode() {
    selectionMode.value = false
    selectedIds.value.clear()
  }

  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }

  function isSelected(id: string) {
    return selectedIds.value.has(id)
  }

  function selectAll() {
    if (isAllSelected.value) {
      selectedIds.value.clear()
    } else {
      selectedIds.value = new Set(books.value.map((b) => b.id))
    }
  }

  function selectAllFromList(bookIds: string[]) {
    const allInListSelected =
      bookIds.length > 0 && bookIds.every((id) => selectedIds.value.has(id))
    if (allInListSelected) {
      bookIds.forEach((id) => selectedIds.value.delete(id))
    } else {
      bookIds.forEach((id) => selectedIds.value.add(id))
    }
  }

  function isAllSelectedInList(bookIds: string[]) {
    return bookIds.length > 0 && bookIds.every((id) => selectedIds.value.has(id))
  }

  async function ensureBookInLibrary(book: Book) {
    const existing = books.value.find((b) => b.id === book.id)
    if (existing) {
      seedDemoAnnotationsIfNeeded(book.id, existing.format)
      return existing
    }
    const saved = await booksApi.ensureBook(book)
    books.value.push(saved)
    seedDemoAnnotationsIfNeeded(saved.id, saved.format)
    return saved
  }

  async function searchRemote(query: string) {
    searchQuery.value = query
    if (!query.trim()) {
      await fetchAll()
      return
    }
    loading.value = true
    try {
      books.value = await booksApi.searchBooks(query)
    } finally {
      loading.value = false
    }
  }

  function applyRemoteData(payload: {
    books: Book[]
    trashedBooks: Book[]
    favoriteIds: string[]
    lastReadMap: Record<string, string>
  }) {
    books.value = payload.books
    trashedBooks.value = payload.trashedBooks
    favoriteIds.value = new Set(payload.favoriteIds)
    lastReadMap.value = payload.lastReadMap
    payload.books.forEach((book) => {
      if (book.lastReadAt) {
        lastReadMap.value[book.id] = book.lastReadAt
      }
    })
  }

  return {
    books,
    trashedBooks,
    favoriteIds,
    selectionMode,
    selectedIds,
    sortField,
    sortOrder,
    lastReadMap,
    searchQuery,
    loading,
    initialized,
    selectedCount,
    isAllSelected,
    allSelectedFavorited,
    sortedBooks,
    searchableSortedBooks,
    sortedTrashedBooks,
    sortBookList,
    setSortField,
    setSortOrder,
    fetchAll,
    touchLastRead,
    updateProgress,
    isRecycleBinEnabled,
    createBookEntry,
    uploadBookFile,
    importBook,
    importNextSampleBook,
    moveToRecycleBin,
    removeBook,
    permanentlyDeleteFromRecycleBin,
    restoreFromRecycleBin,
    removeSelected,
    moveSelectedToRecycleBin,
    toggleFavorite,
    addSelectedToFavorites,
    removeSelectedFromFavorites,
    isFavorite,
    getBookById,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelect,
    isSelected,
    selectAll,
    selectAllFromList,
    isAllSelectedInList,
    searchRemote,
    ensureBookInLibrary,
    applyRemoteData,
  }
})
