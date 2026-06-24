/** PDF 首次打开时的启动与绘制确认（规避 kookit 静默失败与 pdfScale 缓存问题） */

export interface KookitPdfRendition {
  getDocument?: () => Document | null
  getPosition?: () => Record<string, unknown>
  goToChapterDocIndex?: (index: number) => Promise<void>
  goToPosition?: (payload: string) => Promise<void>
  renderPdfPage?: (index: number, doc: Document) => Promise<void>
  handlePDFScrollEvent?: (doc: Document) => Promise<void>
  getChapterDoc?: () => unknown[]
  pdfScale?: number
}

const LAYOUT_MAX_FRAMES = 90
const PAINT_TIMEOUT_MS = 12_000
const BOOT_MAX_ATTEMPTS = 8

async function waitFrames(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

function resetPdfScale(r: KookitPdfRendition): void {
  if ('pdfScale' in r) {
    r.pdfScale = 0
  }
}

function getMainIframe(pageArea: HTMLElement): HTMLIFrameElement | null {
  return pageArea.querySelector('iframe')
}

function getPageCount(r: KookitPdfRendition, doc: Document): number {
  const fromDom = doc.querySelectorAll('.pdf-container').length
  if (fromDom > 0) return fromDom
  const chapters = r.getChapterDoc?.()
  return Array.isArray(chapters) ? chapters.length : 0
}

function getCurrentChapterIndex(r: KookitPdfRendition): number {
  const pos = r.getPosition?.()
  const idx = pos?.chapterDocIndex
  if (idx == null || idx === '') return 0
  return typeof idx === 'number' ? idx : parseInt(String(idx), 10) || 0
}

export function isPdfPagePainted(r: KookitPdfRendition, pageIndex: number): boolean {
  const doc = r.getDocument?.()
  if (!doc) return false

  const subIframe = doc.getElementById(`pdf-iframe-${pageIndex}`) as HTMLIFrameElement | null
  const subDoc = subIframe?.contentDocument
  if (!subDoc) return false

  const canvas = subDoc.querySelector('#canvas canvas') as HTMLCanvasElement | null
  if (canvas && canvas.width > 0 && canvas.height > 0) {
    return true
  }

  const layer = subDoc.querySelector('#koodoPDFLayer') as HTMLElement | null
  return Boolean(
    layer &&
      layer.style.visibility !== 'hidden' &&
      layer.querySelector('canvas') &&
      (layer.querySelector('canvas') as HTMLCanvasElement).width > 0,
  )
}

/** PDF 滚动模式：外层 #page-area 能否上下滚动 */
export function isPdfScrollReady(pageArea: HTMLElement): boolean {
  if (pageArea.clientHeight <= 0) return false
  return pageArea.scrollHeight > pageArea.clientHeight + 8
}

/**
 * kookit 的 goToChapter 不会设置滚动总高度，只有 goToPosition 会。
 * 首次打开无阅读记录时走 goToChapterDocIndex，需在此补设主 iframe 高度。
 */
export function ensurePdfScrollIframeHeight(
  r: KookitPdfRendition,
  pageArea: HTMLElement,
): boolean {
  const doc = r.getDocument?.()
  const iframe = getMainIframe(pageArea)
  if (!doc || !iframe) return false

  const pageCount = getPageCount(r, doc)
  if (pageCount <= 1) {
    return pageCount === 1
  }

  const inlineHeight = parseFloat(iframe.style.height || '0')
  if (inlineHeight > pageArea.clientHeight + 8) {
    return true
  }

  const pageIndex = getCurrentChapterIndex(r)
  const container =
    (doc.getElementById(`pdf-container-${pageIndex}`) as HTMLElement | null) ||
    (doc.querySelector('.pdf-container') as HTMLElement | null)
  if (!container) return false

  const pageHeight = container.getBoundingClientRect().height
  if (pageHeight <= 0) return false

  iframe.style.height = `${pageHeight * pageCount}px`
  return parseFloat(iframe.style.height) > pageArea.clientHeight + 8
}

async function waitForPdfPagePainted(
  r: KookitPdfRendition,
  pageIndex: number,
  timeoutMs = PAINT_TIMEOUT_MS,
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (isPdfPagePainted(r, pageIndex)) return true
    await new Promise<void>((resolve) => setTimeout(resolve, 40))
  }
  return false
}

async function waitForPdfLayoutReady(
  r: KookitPdfRendition,
  el: HTMLElement,
  retryRender: () => Promise<void>,
): Promise<Document> {
  let retried = false

  for (let i = 0; i < LAYOUT_MAX_FRAMES; i++) {
    const doc = r.getDocument?.()
    if (doc?.body && doc.body.clientWidth > 0 && el.clientWidth > 0 && el.clientHeight > 0) {
      const containers = doc.querySelectorAll('.pdf-container')
      if (containers.length > 0) {
        return doc
      }
    }

    if (!retried && i === 30) {
      retried = true
      await retryRender()
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  const doc = r.getDocument?.()
  if (doc?.body) return doc
  throw new Error('PDF 渲染初始化失败，请重试')
}

export async function bootPdfReader(
  r: KookitPdfRendition,
  el: HTMLElement,
  navigate: () => Promise<void>,
  retryRender: () => Promise<void>,
): Promise<void> {
  await waitFrames(2)
  await waitForPdfLayoutReady(r, el, retryRender)

  for (let attempt = 0; attempt < BOOT_MAX_ATTEMPTS; attempt++) {
    resetPdfScale(r)

    const doc = r.getDocument?.()
    if (!doc?.body) {
      await retryRender()
      await waitFrames(3)
      continue
    }

    await navigate()

    const pageIndex = getCurrentChapterIndex(r)
    if (typeof r.renderPdfPage === 'function') {
      await r.renderPdfPage(pageIndex, doc)
    }

    ensurePdfScrollIframeHeight(r, el)
    await waitFrames(2)
    ensurePdfScrollIframeHeight(r, el)

    const painted = await waitForPdfPagePainted(r, pageIndex, 8000)
    const scrollReady = isPdfScrollReady(el) || getPageCount(r, doc) <= 1

    if (painted && scrollReady) {
      if (typeof r.handlePDFScrollEvent === 'function') {
        await r.handlePDFScrollEvent(doc)
        await waitFrames(2)
        await r.handlePDFScrollEvent(doc)
      }
      return
    }

    if (!scrollReady && r.goToPosition) {
      await r.goToPosition(
        JSON.stringify({
          chapterDocIndex: pageIndex,
          count: 0,
          isFirst: true,
        }),
      )
      ensurePdfScrollIframeHeight(r, el)
    }

    await waitFrames(4 + attempt * 2)
  }

  throw new Error('PDF 页面渲染超时，请重试')
}
