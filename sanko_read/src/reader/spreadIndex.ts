import type { BookRecordLocation } from '@/reader/readerConfig'

/** 章节内分页偏移基数，用于区分「第 N 章」与「章内第 N 页」 */
export const SPREAD_PAGE_STRIDE = 10_000

export interface SpreadIndexOptions {
  /** kookit getProgress().currentPage，TXT/DOCX 等有时不写 tempLocation.page */
  currentPage?: number | null
}

function parsePositiveInt(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed
}

function encodePaginatedSpread(chapterIdx: number, page: number): number {
  if (chapterIdx === 0 && page === 1) return 0
  return SPREAD_PAGE_STRIDE * (chapterIdx + 1) + (page - 1)
}

export function spreadIndexFromPosition(
  pos: BookRecordLocation | Record<string, unknown> | null | undefined,
  options?: SpreadIndexOptions,
): number {
  if (!pos) return 0

  const chapterIdx = parseInt(String(pos.chapterDocIndex ?? 0), 10) || 0
  const page =
    parsePositiveInt(pos.page) ??
    parsePositiveInt(options?.currentPage) ??
    null

  if (page != null) {
    return encodePaginatedSpread(chapterIdx, page)
  }

  return chapterIdx
}

export function spreadIndexToLocation(spreadIndex: number): BookRecordLocation {
  if (spreadIndex >= SPREAD_PAGE_STRIDE) {
    const chapterIdx = Math.floor(spreadIndex / SPREAD_PAGE_STRIDE) - 1
    const page = (spreadIndex % SPREAD_PAGE_STRIDE) + 1
    return {
      chapterDocIndex: chapterIdx,
      page: String(page),
    }
  }

  return { chapterDocIndex: spreadIndex }
}
