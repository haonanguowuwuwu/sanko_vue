export interface MockStoredBookFile {
  buffer: ArrayBuffer
  format: string
  mime: string
  fileName: string
  blobUrl: string | null
}

const store = new Map<string, MockStoredBookFile>()

const EXT_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  epub: 'EPUB',
  txt: 'TXT',
  docx: 'DOCX',
  mobi: 'MOBI',
  azw3: 'AZW3',
  azw: 'AZW',
  md: 'MD',
  fb2: 'FB2',
}

const FORMAT_MIME: Record<string, string> = {
  PDF: 'application/pdf',
  EPUB: 'application/epub+zip',
  TXT: 'text/plain; charset=utf-8',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  MOBI: 'application/x-mobipocket-ebook',
  AZW3: 'application/vnd.amazon.ebook',
  AZW: 'application/vnd.amazon.ebook',
  MD: 'text/markdown; charset=utf-8',
  FB2: 'application/x-fictionbook+xml',
}

export function parseFormatFromFileName(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXT_FORMAT[ext] ?? null
}

export function getMimeForFormat(format: string): string {
  return FORMAT_MIME[format.toUpperCase()] ?? 'application/octet-stream'
}

function revokeBlobUrl(entry: MockStoredBookFile) {
  if (entry.blobUrl) {
    URL.revokeObjectURL(entry.blobUrl)
    entry.blobUrl = null
  }
}

export function storeMockBookFile(bookId: string, file: File, buffer: ArrayBuffer) {
  const format = parseFormatFromFileName(file.name)
  if (!format) {
    throw new Error(`暂不支持该文件格式：.${file.name.split('.').pop() ?? ''}`)
  }

  removeMockBookFile(bookId)

  store.set(bookId, {
    buffer,
    format,
    mime: file.type || getMimeForFormat(format),
    fileName: file.name,
    blobUrl: null,
  })
}

export function hasMockBookFile(bookId: string): boolean {
  return store.has(bookId)
}

export function mockGetBookFileUrl(bookId: string): {
  url: string
  expiresAt: string
  contentType: string
  contentLength: number
} | null {
  const entry = store.get(bookId)
  if (!entry) return null

  if (!entry.blobUrl) {
    const blob = new Blob([entry.buffer], { type: entry.mime })
    entry.blobUrl = URL.createObjectURL(blob)
  }

  return {
    url: entry.blobUrl,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    contentType: entry.mime,
    contentLength: entry.buffer.byteLength,
  }
}

export function getMockBookBuffer(bookId: string): ArrayBuffer | null {
  const entry = store.get(bookId)
  if (!entry) return null
  return entry.buffer
}

export function removeMockBookFile(bookId: string) {
  const entry = store.get(bookId)
  if (!entry) return
  revokeBlobUrl(entry)
  store.delete(bookId)
}

export function clearMockBookFiles() {
  for (const bookId of store.keys()) {
    removeMockBookFile(bookId)
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
