export interface Bookshelf {
  id: string
  name: string
  bookIds: string[]
}

export const DEFAULT_BOOKSHELVES: Omit<Bookshelf, 'id'>[] = [
  { name: '开心时间', bookIds: [] },
  { name: '学习资料', bookIds: [] },
]
