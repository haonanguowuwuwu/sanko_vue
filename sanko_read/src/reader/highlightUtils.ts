import type { ReaderHighlight } from '@/types/reader'
import { highlightColorToKookitIndex } from '@/reader/highlightColors'

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

export function kookitBlockId(chapterDocIndex: number): string {
  return `kookit-ch${chapterDocIndex}`
}

export function pdfChapterLabel(pageIndex: number): string {
  return `第 ${pageIndex + 1} 页`
}
