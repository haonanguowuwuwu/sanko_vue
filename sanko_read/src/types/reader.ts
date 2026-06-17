export type HighlightColor = 'blue' | 'green' | 'gray'

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
  createdAt: string
}

export interface ReaderBookmark {
  bookId: string
  spreadIndex: number
}
