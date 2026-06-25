import type { ReaderBookmark, ReaderHighlight } from '@/types/reader'
import { mockState } from '@/api/mock/state'

const STORAGE_KEY = 'sanko_mock_annotations_v1'

interface MockAnnotationSnapshot {
  highlights: ReaderHighlight[]
  bookmarks: ReaderBookmark[]
}

export function loadMockAnnotationSnapshot(): MockAnnotationSnapshot {
  if (typeof localStorage === 'undefined') {
    return { highlights: [], bookmarks: [] }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { highlights: [], bookmarks: [] }
    const parsed = JSON.parse(raw) as MockAnnotationSnapshot
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    }
  } catch {
    return { highlights: [], bookmarks: [] }
  }
}

export function persistMockAnnotations() {
  if (typeof localStorage === 'undefined') return
  const snapshot: MockAnnotationSnapshot = {
    highlights: mockState.highlights,
    bookmarks: mockState.bookmarks,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function hydrateMockAnnotationsFromStorage() {
  const saved = loadMockAnnotationSnapshot()
  mockState.highlights = [...saved.highlights]
  mockState.bookmarks = [...saved.bookmarks]
}
