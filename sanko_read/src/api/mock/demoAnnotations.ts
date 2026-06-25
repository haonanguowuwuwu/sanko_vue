import type { ReaderHighlight } from '@/types/reader'
import { kookitBlockId } from '@/reader/highlightUtils'
import { formatAnnotationTime } from '@/utils/readerMeta'
import { getSampleBookFileSpec } from '@/api/mock/sampleBooks'
import { mockState } from '@/api/mock/state'
import { persistMockAnnotations } from '@/api/mock/annotationPersistence'

function buildDemoHighlights(bookId: string): ReaderHighlight[] {
  const chapter = '阅读与标注'
  const chapterDocIndex = 1
  const blockId = kookitBlockId(chapterDocIndex)
  const createdAt = formatAnnotationTime()

  return [
    {
      id: `demo-hl-${bookId}-highlight`,
      bookId,
      blockId,
      spreadIndex: chapterDocIndex,
      chapterDocIndex,
      start: 0,
      end: 36,
      color: 'purple',
      quote: '选中一段文字后，会出现工具栏：可选择颜色高亮，或打开笔记对话框写下想法。',
      chapter,
      createdAt,
    },
    {
      id: `demo-hl-${bookId}-note`,
      bookId,
      blockId,
      spreadIndex: chapterDocIndex,
      chapterDocIndex,
      start: 0,
      end: 28,
      color: 'green',
      quote: '高亮会保存在「高亮」页面；带笔记内容的标注会出现在「笔记」页面。',
      chapter,
      note: '示例笔记：阅读时可以在这里记录自己的想法。',
      createdAt,
    },
  ]
}

export function isDemoSampleBookFormat(format: string) {
  return Boolean(getSampleBookFileSpec(format))
}

export function seedDemoAnnotationsIfNeeded(bookId: string, format: string): boolean {
  if (!isDemoSampleBookFormat(format)) return false
  if (mockState.highlights.some((item) => item.bookId === bookId)) return false

  mockState.highlights.push(...buildDemoHighlights(bookId))
  persistMockAnnotations()
  return true
}
