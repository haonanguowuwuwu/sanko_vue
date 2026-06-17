export interface Book {
  id: string
  title: string
  author: string
  progress: number
  coverColor: string
  coverTitle: string
  coverSubtitle?: string
  coverUrl?: string
  fileSize: string
  format: string
  addedAt: string
  category: string
  lastReadAt?: string
}

export type BookTemplate = Omit<Book, 'id' | 'addedAt'>

export const SAMPLE_BOOKS: BookTemplate[] = [
  {
    title: '《雅思词汇真经》',
    author: '刘洪波',
    progress: 4.18,
    coverColor: '#e86c1a',
    coverTitle: '雅思词汇真经',
    coverSubtitle: 'VOCABULARY FOR IELTS',
    fileSize: '12.6 MB',
    format: 'PDF',
    category: '学习资料',
  },
  {
    title: '《高等数学（上册）》',
    author: '同济大学数学系',
    progress: 12.5,
    coverColor: '#1a5fb4',
    coverTitle: '高等数学',
    coverSubtitle: 'ADVANCED MATHEMATICS',
    fileSize: '28.3 MB',
    format: 'PDF',
    category: '学习资料',
  },
  {
    title: '《Python编程：从入门到实践》',
    author: 'Eric Matthes',
    progress: 36.0,
    coverColor: '#2d8659',
    coverTitle: 'Python编程',
    coverSubtitle: 'PYTHON CRASH COURSE',
    fileSize: '18.9 MB',
    format: 'EPUB',
    category: '学习资料',
  },
  {
    title: '《三体》',
    author: '刘慈欣',
    progress: 68.42,
    coverColor: '#1c2833',
    coverTitle: '三体',
    coverSubtitle: 'THE THREE-BODY PROBLEM',
    fileSize: '2.4 MB',
    format: 'EPUB',
    category: '娱乐小说',
  },
  {
    title: '《解忧杂货店》',
    author: '东野圭吾',
    progress: 0,
    coverColor: '#8b4513',
    coverTitle: '解忧杂货店',
    coverSubtitle: 'MIRACLE GROCERY STORE',
    fileSize: '1.8 MB',
    format: 'EPUB',
    category: '娱乐小说',
  },
]

/** @deprecated 使用 SAMPLE_BOOKS */
export const DEMO_BOOK = SAMPLE_BOOKS[0]!

export function formatAddedDate(date: Date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
