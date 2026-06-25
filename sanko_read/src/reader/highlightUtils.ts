import type { ReaderHighlight } from '@/types/reader'
import { highlightColorToKookitIndex } from '@/reader/highlightColors'
import { SPREAD_PAGE_STRIDE } from '@/reader/spreadIndex'

export { highlightColorToKookitIndex } from '@/reader/highlightColors'

export interface KookitHighlightPayload {
  range: string
  color: number
  key: string
  notes: string
}

export interface KookitPdfHighlightPayload extends KookitHighlightPayload {
  chapterIndex: number
}

export interface PdfHighlightRange {
  page: number
  coords: number[][]
  readerMode?: string
}

export interface TextSelectionPayload {
  quote: string
  range: string
  spreadIndex: number
  chapterDocIndex: number
  chapter: string
  x: number
  y: number
}

export function isPdfHighlightRange(range: string | undefined): boolean {
  if (!range?.trim()) return false
  try {
    const parsed = JSON.parse(range) as Partial<PdfHighlightRange>
    return typeof parsed.page === 'number' && Array.isArray(parsed.coords)
  } catch {
    return false
  }
}

export function parsePdfHighlightRange(range: string): PdfHighlightRange | null {
  try {
    const parsed = JSON.parse(range) as Partial<PdfHighlightRange>
    if (typeof parsed.page !== 'number' || !Array.isArray(parsed.coords)) return null
    return parsed as PdfHighlightRange
  } catch {
    return null
  }
}

export function toKookitHighlightItems(highlights: ReaderHighlight[]): KookitHighlightPayload[] {
  return highlights
    .filter((item) => Boolean(item.range?.trim()) && !isPdfHighlightRange(item.range))
    .map((item) => ({
      range: item.range!,
      color: highlightColorToKookitIndex(item.color),
      key: item.id,
      notes: item.note?.trim() ?? '',
    }))
}

export function toKookitPdfHighlightItems(
  highlights: ReaderHighlight[],
  pageIndex: number,
): KookitPdfHighlightPayload[] {
  return highlights
    .filter((item) => {
      if (!item.range?.trim()) return false
      const parsed = parsePdfHighlightRange(item.range)
      return parsed != null && parsed.page === pageIndex
    })
    .map((item) => ({
      range: item.range!,
      color: highlightColorToKookitIndex(item.color),
      key: item.id,
      notes: item.note?.trim() ?? '',
      chapterIndex: pageIndex,
    }))
}

/** 从标注列表收集 PDF 页码（0-based） */
export function collectPdfHighlightPageIndices(
  highlights: ReaderHighlight[],
  bookId: string,
): number[] {
  const pages = new Set<number>()
  for (const item of highlights) {
    if (item.bookId !== bookId || !item.range?.trim()) continue
    const parsed = parsePdfHighlightRange(item.range)
    if (parsed) {
      pages.add(parsed.page)
      continue
    }
    if (typeof item.chapterDocIndex === 'number') {
      pages.add(item.chapterDocIndex)
    }
  }
  return [...pages].sort((a, b) => a - b)
}

export function getPdfHighlightsForPage(
  highlights: ReaderHighlight[],
  bookId: string,
  pageIndex: number,
): ReaderHighlight[] {
  return highlights.filter((item) => {
    if (item.bookId !== bookId || !item.range?.trim()) return false
    const parsed = parsePdfHighlightRange(item.range)
    if (parsed) return parsed.page === pageIndex
    return item.chapterDocIndex === pageIndex
  })
}

export function kookitBlockId(chapterDocIndex: number): string {
  return `kookit-ch${chapterDocIndex}`
}

export function pdfChapterLabel(pageIndex: number): string {
  return `第 ${pageIndex + 1} 页`
}

export function getPdfPageIndexFromHighlight(item: {
  range?: string
  chapterDocIndex?: number
}): number | null {
  const parsed = parsePdfHighlightRange(item.range ?? '')
  if (parsed) return parsed.page
  if (typeof item.chapterDocIndex === 'number') return item.chapterDocIndex
  return null
}

/** 保存标注时区分 PDF 页码与 TXT/DOCX 的 spread / 章节索引 */
export function resolveKookitAnnotationLocation(
  range: string,
  spreadIndex: number,
  chapterDocIndex: number,
): { spreadIndex: number; chapterDocIndex: number } {
  const pdfPage = parsePdfHighlightRange(range)?.page
  if (pdfPage != null) {
    return { spreadIndex: pdfPage, chapterDocIndex: pdfPage }
  }
  return { spreadIndex, chapterDocIndex }
}

/** 从标注记录解析阅读页跳转用的 spreadIndex */
export function resolveAnnotationSpreadIndex(item: ReaderHighlight): number {
  const pdfPage = parsePdfHighlightRange(item.range ?? '')
  if (pdfPage) return pdfPage.page

  if (item.spreadIndex >= SPREAD_PAGE_STRIDE) {
    return item.spreadIndex
  }
  if (item.spreadIndex > 0) {
    return item.spreadIndex
  }
  return item.chapterDocIndex ?? 0
}
