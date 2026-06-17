export type BookReadStatusFilter = '全部' | '未阅读' | '阅读中' | '已读完'

export const BOOK_READ_STATUS_OPTIONS: BookReadStatusFilter[] = [
  '全部',
  '未阅读',
  '阅读中',
  '已读完',
]

export function matchesReadStatus(progress: number, filter: BookReadStatusFilter): boolean {
  switch (filter) {
    case '未阅读':
      return progress <= 0
    case '阅读中':
      return progress > 0 && progress < 100
    case '已读完':
      return progress >= 100
    case '全部':
    default:
      return true
  }
}

export function filterBooksByReadStatus<T extends { progress: number }>(
  books: T[],
  filter: BookReadStatusFilter,
): T[] {
  if (filter === '全部') return books
  return books.filter((b) => matchesReadStatus(b.progress, filter))
}
