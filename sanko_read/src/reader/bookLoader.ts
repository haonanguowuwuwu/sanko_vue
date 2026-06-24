import { USE_MOCK } from '@/api/config'
import { getMockBookBuffer } from '@/api/mock/fileStore'
import { getBookFileUrl } from '@/api/books'

export async function loadBookBuffer(bookId: string): Promise<ArrayBuffer> {
  if (USE_MOCK) {
    const buffer = getMockBookBuffer(bookId)
    if (buffer) {
      return buffer
    }
  }

  const { url } = await getBookFileUrl(bookId)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载书籍失败 (${response.status})`)
  }
  return response.arrayBuffer()
}
