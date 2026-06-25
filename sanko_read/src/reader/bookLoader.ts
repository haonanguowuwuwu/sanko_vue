import { USE_MOCK } from '@/api/config'
import { getMockBookBuffer } from '@/api/mock/fileStore'
import { getBookFileUrl } from '@/api/books'
import { buildEmptyBufferMessage } from '@/reader/readerLoadErrors'

function assertNonEmptyBuffer(buffer: ArrayBuffer, format: string): ArrayBuffer {
  if (buffer.byteLength === 0) {
    throw new Error(buildEmptyBufferMessage(format))
  }
  return buffer
}

export async function loadBookBuffer(bookId: string, format = '书籍'): Promise<ArrayBuffer> {
  const normalizedFormat = format.toUpperCase()

  if (USE_MOCK) {
    const buffer = getMockBookBuffer(bookId)
    if (buffer) {
      return assertNonEmptyBuffer(buffer, normalizedFormat)
    }
  }

  const { url } = await getBookFileUrl(bookId)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载书籍失败 (${response.status})`)
  }
  return assertNonEmptyBuffer(await response.arrayBuffer(), normalizedFormat)
}
