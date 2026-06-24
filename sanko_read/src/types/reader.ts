export type HighlightColor = 'blue' | 'green' | 'cyan' | 'yellow' | 'purple' | 'gray'

export interface ReaderBlock {
  id: string
  type: 'paragraph' | 'title' | 'subtitle'
  text: string
  defaultBg?: 'gray'
}

export interface ReaderSpread {
  chapter: string
  left: { page: number; blocks: ReaderBlock[] }
  right: { page: number; blocks: ReaderBlock[] }
}

export interface ReaderHighlight {
  id: string
  bookId: string
  blockId: string
  spreadIndex: number
  start: number
  end: number
  color: HighlightColor
  quote: string
  chapter: string
  note?: string
  /** kookit rangy 字符 range 的 JSON 字符串 */
  range?: string
  chapterDocIndex?: number
  createdAt: string
}

export interface ReaderBookmark {
  id: string
  bookId: string
  spreadIndex: number
  chapter?: string
  createdAt?: string
}
