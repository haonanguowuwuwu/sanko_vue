import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { HighlightColor, ReaderBookmark, ReaderHighlight } from '@/types/reader'
import {
  kookitBlockId,
  parsePdfHighlightRange,
  resolveKookitAnnotationLocation,
} from '@/reader/highlightUtils'
import { formatAnnotationTime } from '@/utils/readerMeta'
import * as annotationsApi from '@/api/annotations'

export const useReaderAnnotationsStore = defineStore('readerAnnotations', () => {
  const highlights = ref<ReaderHighlight[]>([])
  const bookmarks = ref<ReaderBookmark[]>([])
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
    const notedRangeKeys = new Set(
      highlights.value
        .filter((h) => h.note?.trim() && h.range)
        .map((h) => `${h.bookId}|${h.range}`),
    )
    const notedQuoteKeys = new Set(
      highlights.value
        .filter((h) => h.note?.trim())
        .map((h) => `${h.bookId}|${h.quote.trim()}`),
    )
    const seen = new Set<string>()
    highlights.value = highlights.value.filter((h) => {
      if (h.note?.trim()) return true
      const key = h.range
        ? `${h.bookId}|${h.range}`
        : `${h.bookId}|${h.blockId}|${h.quote.trim()}`
      if (h.range && notedRangeKeys.has(`${h.bookId}|${h.range}`)) return false
      if (notedQuoteKeys.has(`${h.bookId}|${h.quote.trim()}`)) return false
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
      bookmarks.value = bookmarkList.map((bm) => ({
        id: bm.id,
        bookId: bm.bookId,
        spreadIndex: bm.spreadIndex,
        chapter: bm.chapter,
        createdAt: bm.createdAt,
      }))
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  function getHighlightsForBook(bookId: string) {
    return highlights.value.filter((h) => h.bookId === bookId)
  }

  function getBookmarksForBook(bookId: string) {
    return bookmarks.value
      .filter((bm) => bm.bookId === bookId)
      .sort((a, b) => a.spreadIndex - b.spreadIndex)
  }

  function getHighlightsForChapter(bookId: string, chapterDocIndex: number) {
    return getHighlightsForBook(bookId).filter(
      (h) => h.range && h.chapterDocIndex === chapterDocIndex,
    )
  }

  function getPdfHighlightsForPage(bookId: string, pageIndex: number) {
    return highlights.value.filter((item) => {
      if (item.bookId !== bookId || !item.range?.trim()) return false
      const parsed = parsePdfHighlightRange(item.range)
      if (parsed) return parsed.page === pageIndex
      return item.chapterDocIndex === pageIndex
    })
  }

  function resolveKookitPdfPageIndex(range: string, chapterDocIndex: number): number {
    return parsePdfHighlightRange(range)?.page ?? chapterDocIndex
  }

  function getHighlightsForBlock(bookId: string, blockId: string) {
    return getHighlightsForBook(bookId).filter((h) => h.blockId === blockId)
  }

  function findPlainKookitHighlight(bookId: string, range: string, quote: string) {
    return highlights.value.find(
      (h) =>
        !h.note?.trim() &&
        h.bookId === bookId &&
        h.range === range,
    ) ?? highlights.value.find(
      (h) =>
        !h.note?.trim() &&
        h.bookId === bookId &&
        h.quote.trim() === quote.trim() &&
        Boolean(h.range),
    )
  }

  async function toggleKookitHighlight(
    bookId: string,
    payload: {
      range: string
      spreadIndex: number
      chapterDocIndex: number
      quote: string
      chapter: string
      color: HighlightColor
    },
  ): Promise<'added' | 'removed' | 'updated'> {
    const { range, spreadIndex, chapterDocIndex, quote, chapter, color } = payload
    const location = resolveKookitAnnotationLocation(range, spreadIndex, chapterDocIndex)
    const blockId = kookitBlockId(location.chapterDocIndex)
    const existing = findKookitAnnotation(bookId, range, quote)

    if (existing) {
      if (existing.color === color) {
        await removeHighlight(existing.id)
        return 'removed'
      }
      const updated = await annotationsApi.updateAnnotation(existing.id, {
        color,
        quote,
        chapter,
        spreadIndex: location.spreadIndex,
        range,
        chapterDocIndex: location.chapterDocIndex,
      })
      Object.assign(existing, updated)
      return 'updated'
    }

    const highlight = await annotationsApi.createAnnotation({
      bookId,
      blockId,
      spreadIndex: location.spreadIndex,
      start: 0,
      end: quote.length,
      color,
      quote,
      chapter,
      range,
      chapterDocIndex: location.chapterDocIndex,
    })
    highlights.value.push(highlight)
    return 'added'
  }

  async function addKookitNote(
    bookId: string,
    payload: {
      range: string
      spreadIndex: number
      chapterDocIndex: number
      quote: string
      chapter: string
      color: HighlightColor
      note: string
    },
  ) {
    const { range, spreadIndex, chapterDocIndex, quote, chapter, color, note } = payload
    const location = resolveKookitAnnotationLocation(range, spreadIndex, chapterDocIndex)
    const blockId = kookitBlockId(location.chapterDocIndex)
    const trimmedNote = note.trim()
    const existing = findKookitAnnotation(bookId, range, quote)

    if (existing) {
      const updated = await annotationsApi.updateAnnotation(existing.id, {
        color,
        quote,
        chapter,
        spreadIndex: location.spreadIndex,
        range,
        chapterDocIndex: location.chapterDocIndex,
        note: trimmedNote,
      })
      Object.assign(existing, updated)
      existing.note = trimmedNote
      existing.createdAt = formatAnnotationTime()
      dedupeHighlightOnly()
      return existing
    }

    const highlight = await annotationsApi.createAnnotation({
      bookId,
      blockId,
      spreadIndex: location.spreadIndex,
      start: 0,
      end: quote.length,
      color,
      quote,
      chapter,
      note: trimmedNote,
      range,
      chapterDocIndex: location.chapterDocIndex,
    })
    highlights.value.push(highlight)
    dedupeHighlightOnly()
    return highlight
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

  async function updateNote(id: string, note: string, color?: HighlightColor) {
    const item = highlights.value.find((h) => h.id === id)
    if (!item) return
    const trimmedNote = note.trim()
    const payload: { note: string; color?: HighlightColor } = { note: trimmedNote }
    if (color) payload.color = color
    const updated = await annotationsApi.updateAnnotation(id, payload)
    Object.assign(item, updated)
    item.note = trimmedNote
  }

  function findKookitAnnotation(bookId: string, range: string, quote: string) {
    return highlights.value.find(
      (h) => h.bookId === bookId && h.range === range,
    ) ?? highlights.value.find(
      (h) =>
        h.bookId === bookId &&
        h.quote.trim() === quote.trim() &&
        Boolean(h.range),
    )
  }

  async function removeHighlight(id: string) {
    await annotationsApi.deleteAnnotation(id)
    highlights.value = highlights.value.filter((h) => h.id !== id)
  }

  async function toggleBookmark(bookId: string, spreadIndex: number, chapter?: string) {
    const existing = bookmarks.value.find(
      (bm) => bm.bookId === bookId && bm.spreadIndex === spreadIndex,
    )

    if (existing) {
      await annotationsApi.deleteBookmark(existing.id)
      bookmarks.value = bookmarks.value.filter((bm) => bm.id !== existing.id)
      return
    }

    const bm = await annotationsApi.createBookmark(bookId, spreadIndex, chapter)
    bookmarks.value.push(bm)
  }

  function isBookmarked(bookId: string, spreadIndex: number) {
    return bookmarks.value.some(
      (bm) => bm.bookId === bookId && bm.spreadIndex === spreadIndex,
    )
  }

  function applyRemoteData(nextHighlights: ReaderHighlight[], nextBookmarks: ReaderBookmark[]) {
    highlights.value = [...nextHighlights]
    dedupeHighlightOnly()
    bookmarks.value = [...nextBookmarks]
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
    getHighlightsForChapter,
    getPdfHighlightsForPage,
    getBookmarksForBook,
    getHighlightsForBlock,
    addHighlight,
    addKookitNote,
    togglePlainHighlight,
    toggleKookitHighlight,
    findKookitAnnotation,
    updateNote,
    removeHighlight,
    toggleBookmark,
    isBookmarked,
    applyRemoteData,
  }
})
