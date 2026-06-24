import { isPdfFormat } from '@/reader/readerSettings'

const PAGE_BORDER_COLOR = '#d5cec2'

/** 分页阅读（EPUB/DOCX 等 CSS 多栏）每页边框 */
export function getPaginatedPageBorderCss(): string {
  return [
    'html{background-color:transparent !important;}',
    `body{
      background-color:#ffffff !important;
      -webkit-box-decoration-break:clone;
      box-decoration-break:clone;
      box-shadow:inset 0 0 0 1px ${PAGE_BORDER_COLOR};
      box-sizing:border-box;
    }`,
  ].join('')
}

/** PDF 每页容器边框 */
export function getPdfPageBorderCss(): string {
  return [
    `.pdf-container{
      border:1px solid ${PAGE_BORDER_COLOR};
      box-sizing:border-box;
      background-color:#ffffff;
    }`,
  ].join('')
}

export function injectStyleIntoDocument(
  doc: Document | null | undefined,
  css: string,
  id = 'sanko-page-border-style',
): void {
  if (!doc?.head) return
  let styleEl = doc.getElementById(id) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = id
    doc.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPdfPageBorderStyles(rendition: any): void {
  if (!rendition) return
  injectStyleIntoDocument(rendition.getDocument?.(), getPdfPageBorderCss())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyReaderPageBorderStyles(rendition: any, format: string): void {
  if (!rendition) return
  if (isPdfFormat(format)) {
    applyPdfPageBorderStyles(rendition)
    return
  }
  const css = getPaginatedPageBorderCss()
  const docs = rendition.getAllDocuments?.()
  if (Array.isArray(docs) && docs.length > 0) {
    docs.forEach((doc: Document) => injectStyleIntoDocument(doc, css))
    return
  }
  injectStyleIntoDocument(rendition.getDocument?.(), css)
}
