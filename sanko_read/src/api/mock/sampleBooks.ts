import type { BookFileUrl } from '@/api/books'
import { storeMockBookBuffer } from '@/api/mock/fileStore'

export interface SampleBookFileSpec {
  fileName: string
  publicPath: string
  mime: string
}
const SAMPLE_FILE_BY_FORMAT: Record<string, SampleBookFileSpec> = {
  TXT: {
    fileName: 'demo.txt',
    publicPath: 'sample-books/demo.txt',
    mime: 'text/plain; charset=utf-8',
  },
  EPUB: {
    fileName: 'demo.epub',
    publicPath: 'sample-books/demo.epub',
    mime: 'application/epub+zip',
  },
  PDF: {
    fileName: 'demo.pdf',
    publicPath: 'sample-books/demo.pdf',
    mime: 'application/pdf',
  },
  DOCX: {
    fileName: 'demo.docx',
    publicPath: 'sample-books/demo.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
}

export function getSampleBookFileSpec(format: string): SampleBookFileSpec | null {
  return SAMPLE_FILE_BY_FORMAT[format.toUpperCase()] ?? null
}

export function resolveSampleBookPublicUrl(publicPath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const path = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath
  return new URL(`${normalizedBase}${path}`, window.location.origin).href
}

export function buildMockSampleBookFileUrl(format: string): BookFileUrl {
  const spec = getSampleBookFileSpec(format) ?? SAMPLE_FILE_BY_FORMAT.TXT!
  const url = resolveSampleBookPublicUrl(spec.publicPath)
  return {
    url,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    contentType: spec.mime,
  }
}

export async function mockAttachSampleFile(bookId: string, format: string): Promise<void> {
  const spec = getSampleBookFileSpec(format)
  if (!spec) return

  const url = resolveSampleBookPublicUrl(spec.publicPath)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`样例文件加载失败（${spec.fileName}）`)
  }

  const buffer = await response.arrayBuffer()
  if (buffer.byteLength === 0) {
    throw new Error(`样例文件为空（${spec.fileName}），请运行 npm run generate-samples`)
  }

  storeMockBookBuffer(bookId, format, spec.fileName, buffer)
}
