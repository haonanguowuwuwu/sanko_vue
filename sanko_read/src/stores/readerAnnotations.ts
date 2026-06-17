import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HighlightColor, ReaderHighlight } from '@/types/reader'
import { formatAnnotationTime } from '@/utils/readerMeta'
import * as annotationsApi from '@/api/annotations'

export const useReaderAnnotationsStore = defineStore('readerAnnotations', () => {
  const highlights = ref<ReaderHighlight[]>([])
  const bookmarks = ref<Record<string, number>>({})
  const bookmarkIds = ref<Record<string, string>>({})
  const loading = ref(false)
  const initialized = ref(false)

  const notes = computed(() =>
    highlights.value
      .filter((h) => Boolean(h.note?.trim()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )

  const highlightOnly = computed(() =>
    highlights.value
      .filter((h) => !h.note?.trim())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )

  function dedupeHighlightOnly() {
    const seen = new Set<string>()
    highlights.value = highlights.value.filter((h) => {
      if (h.note?.trim()) return true
      const key = `${h.bookId}|${h.blockId}|${h.quote.trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async function fetchAll() {
    loading.value = true
    try {
      const [annotationList, bookmarkList] = await Promise.all([
        annotationsApi.listAnnotations(),
        annotationsApi.listBookmarks(),
      ])
      highlights.value = annotationList
      dedupeHighlightOnly()
      bookmarks.value = {}
      bookmarkIds.value = {}
      bookmarkList.forEach((bm) => {
        bookmarks.value[bm.bookId] = bm.spreadIndex
        bookmarkIds.value[bm.bookId] = bm.id
      })
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  function getHighlightsForBook(bookId: string) {
    return highlights.value.filter((h) => h.bookId === bookId)
  }

  function getHighlightsForBlock(bookId: string, blockId: string) {
    return getHighlightsForBook(bookId).filter((h) => h.blockId === blockId)
  }

  function isSameRange(
    h: ReaderHighlight,
    bookId: string,
    blockId: string,
    start: number,
    end: number,
  ) {
    return h.bookId === bookId && h.blockId === blockId && h.start === start && h.end === end
  }

  function findPlainHighlight(
    bookId: string,
    blockId: string,
    start: number,
    end: number,
    quote: string,
  ) {
    return highlights.value.find(
      (h) =>
        !h.note?.trim() &&
        h.bookId === bookId &&
        h.blockId === blockId &&
        (isSameRange(h, bookId, blockId, start, end) || h.quote.trim() === quote.trim()),
    )
  }

  async function togglePlainHighlight(
    bookId: string,
    blockId: string,
    spreadIndex: number,
    start: number,
    end: number,
    color: HighlightColor,
    quote: string,
    chapter: string,
  ): Promise<'added' | 'removed' | 'updated'> {
    const existing = findPlainHighlight(bookId, blockId, start, end, quote)

    if (existing) {
      if (existing.color === color) {
        await removeHighlight(existing.id)
        return 'removed'
      }
      const updated = await annotationsApi.updateAnnotation(existing.id, {
        color,
        start,
        end,
        quote,
        chapter,
        spreadIndex,
      })
      Object.assign(existing, updated)
      return 'updated'
    }

    const highlight = await annotationsApi.createAnnotation({
      bookId,
      blockId,
      spreadIndex,
      start,
      end,
      color,
      quote,
      chapter,
    })
    highlights.value.push(highlight)
    return 'added'
  }

  async function addHighlight(
    bookId: string,
    blockId: string,
    spreadIndex: number,
    start: number,
    end: number,
    color: HighlightColor,
    quote: string,
    chapter: string,
    note?: string,
  ) {
    const trimmedNote = note?.trim()
    const hasNote = Boolean(trimmedNote)

    const existing = highlights.value.find((h) => isSameRange(h, bookId, blockId, start, end))

    if (existing) {
      const updated = await annotationsApi.updateAnnotation(existing.id, {
        color,
        quote,
        chapter,
        spreadIndex,
        note: hasNote ? trimmedNote : existing.note,
      })
      Object.assign(existing, updated)
      return existing
    }

    if (hasNote) {
      const plainDup = highlights.value.find(
        (h) =>
          !h.note?.trim() &&
          h.bookId === bookId &&
          h.blockId === blockId &&
          h.quote.trim() === quote.trim(),
      )
      if (plainDup) {
        const updated = await annotationsApi.updateAnnotation(plainDup.id, {
          note: trimmedNote,
          color,
          start,
          end,
          chapter,
          spreadIndex,
        })
        Object.assign(plainDup, updated)
        plainDup.createdAt = formatAnnotationTime()
        return plainDup
      }
    }

    if (!hasNote) {
      const quoteDup = highlights.value.find(
        (h) =>
          !h.note?.trim() &&
          h.bookId === bookId &&
          h.blockId === blockId &&
          h.quote.trim() === quote.trim(),
      )
      if (quoteDup) {
        const updated = await annotationsApi.updateAnnotation(quoteDup.id, {
          color,
          start,
          end,
        })
        Object.assign(quoteDup, updated)
        return quoteDup
      }
    }

    const highlight = await annotationsApi.createAnnotation({
      bookId,
      blockId,
      spreadIndex,
      start,
      end,
      color,
      quote,
      chapter,
      note: trimmedNote,
    })
    highlights.value.push(highlight)
    return highlight
  }

  async function updateNote(id: string, note: string) {
    const item = highlights.value.find((h) => h.id === id)
    if (!item) return
    const updated = await annotationsApi.updateAnnotation(id, { note })
    Object.assign(item, updated)
  }

  async function removeHighlight(id: string) {
    await annotationsApi.deleteAnnotation(id)
    highlights.value = highlights.value.filter((h) => h.id !== id)
  }

  async function toggleBookmark(bookId: string, spreadIndex: number) {
    if (bookmarks.value[bookId] === spreadIndex) {
      const bmId = bookmarkIds.value[bookId]
      if (bmId) {
        await annotationsApi.deleteBookmark(bmId)
      }
      delete bookmarks.value[bookId]
      delete bookmarkIds.value[bookId]
    } else {
      const bm = await annotationsApi.createBookmark(bookId, spreadIndex)
      bookmarks.value[bookId] = spreadIndex
      bookmarkIds.value[bookId] = bm.id
    }
  }

  function isBookmarked(bookId: string, spreadIndex: number) {
    return bookmarks.value[bookId] === spreadIndex
  }

  function getBookmarkSpread(bookId: string) {
    return bookmarks.value[bookId]
  }

  function applyRemoteData(nextHighlights: ReaderHighlight[], nextBookmarks: Record<string, number>) {
    highlights.value = [...nextHighlights]
    dedupeHighlightOnly()
    bookmarks.value = { ...nextBookmarks }
    bookmarkIds.value = {}
  }

  return {
    highlights,
    notes,
    highlightOnly,
    bookmarks,
    loading,
    initialized,
    fetchAll,
    getHighlightsForBook,
    getHighlightsForBlock,
    addHighlight,
    togglePlainHighlight,
    updateNote,
    removeHighlight,
    toggleBookmark,
    isBookmarked,
    getBookmarkSpread,
    applyRemoteData,
  }
})
