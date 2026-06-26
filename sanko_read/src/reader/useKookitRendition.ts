import { ref, shallowRef, onUnmounted, nextTick, type Ref } from 'vue'
import { BookHelper, StyleHelper, Kookit } from '@/reader/kookitLoader'
import { buildRenditionConfig } from '@/reader/renditionOptions'
import { getRecordLocation, setRecordLocation, type BookRecordLocation } from '@/reader/readerConfig'
import { configService } from '@/reader/configService'
import {
  isPaginatedTextFormat,
  isPdfFormat,
  supportsAnnotationHighlight,
  isEpubFormat,
  loadReaderSettings,
  normalizeSettingsForFormat,
} from '@/reader/readerSettings'
import { bootPdfReader, isPdfPagePainted } from '@/reader/pdfBoot'
import { ensurePdfJsReady } from '@/reader/pdfjsSetup'
import {
  applyPdfPageBorderStyles,
  applyReaderPageBorderStyles,
  getPaginatedPageBorderCss,
} from '@/reader/readerPageBorderStyles'
import { spreadIndexFromPosition, spreadIndexToLocation, SPREAD_PAGE_STRIDE } from '@/reader/spreadIndex'
import {
  collectPdfHighlightPageIndices,
  getPdfPageIndexFromHighlight,
  pdfChapterLabel,
  toKookitHighlightItems,
  toKookitPdfHighlightItems,
  type TextSelectionPayload,
} from '@/reader/highlightUtils'
import { getHighlightColorDef } from '@/reader/highlightColors'
import type { ReaderHighlight } from '@/types/reader'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import {
  buildEmptyBufferMessage,
  normalizeReaderLoadError,
  withReaderLoadTimeout,
} from '@/reader/readerLoadErrors'

export interface UseKookitRenditionOptions {
  bookId: string
  format: string
  charset?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KookitRenditionInstance = any

const CONTAINER_READY_MAX_FRAMES = 90
const RENDER_RETRY_MAX = 5

function isReplaceChildrenError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /replaceChildren/i.test(msg)
}

async function waitForReaderContainer(el: HTMLElement): Promise<void> {
  await nextTick()
  for (let i = 0; i < CONTAINER_READY_MAX_FRAMES; i++) {
    if (el.isConnected && el.clientWidth > 0 && el.clientHeight > 0) {
      return
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

function hasValidSavedLocation(saved: BookRecordLocation): boolean {
  if (!saved || Object.keys(saved).length === 0) return false
  if (saved.cfi) return true
  const idx = saved.chapterDocIndex
  if (idx == null || idx === '') return false
  const parsed = typeof idx === 'number' ? idx : parseInt(String(idx), 10)
  return !Number.isNaN(parsed) && parsed >= 0
}

/** TXT 解析只传章节定位字段，避免把阅读进度对象误传给 txtToHtml */
function getTxtParseLocation(saved: BookRecordLocation): BookRecordLocation | undefined {
  if (!hasValidSavedLocation(saved)) return undefined
  return {
    text: saved.text,
    chapterTitle: saved.chapterTitle,
    chapterDocIndex: saved.chapterDocIndex,
  }
}

async function renderToRendition(
  r: KookitRenditionInstance,
  el: HTMLElement,
  bookLocation?: BookRecordLocation,
): Promise<void> {
  for (let attempt = 0; attempt < RENDER_RETRY_MAX; attempt++) {
    if (!el.isConnected) {
      await waitForReaderContainer(el)
    }
    try {
      if (bookLocation != null) {
        await r.renderTo(el, bookLocation)
      } else {
        await r.renderTo(el)
      }
      return
    } catch (error) {
      if (!isReplaceChildrenError(error) || attempt === RENDER_RETRY_MAX - 1) {
        throw error
      }
      await nextTick()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
  }
}

async function restoreReadingPosition(
  r: KookitRenditionInstance,
  saved: BookRecordLocation,
  format?: string,
): Promise<void> {
  const isPdf = format?.toUpperCase() === 'PDF'
  const chapterDocIndex = hasValidSavedLocation(saved)
    ? typeof saved.chapterDocIndex === 'number'
      ? saved.chapterDocIndex
      : parseInt(String(saved.chapterDocIndex), 10) || 0
    : 0

  if (isPdf && r.goToPosition) {
    await r.goToPosition(
      JSON.stringify({
        ...(hasValidSavedLocation(saved) ? saved : {}),
        chapterDocIndex,
        count: saved.cfi ? 'ignore' : saved.count ?? 0,
        isFirst: true,
      }),
    )
    return
  }

  if (hasValidSavedLocation(saved) && r.goToPosition) {
    await r.goToPosition(
      JSON.stringify({
        ...saved,
        chapterDocIndex,
        count: saved.cfi ? 'ignore' : saved.count ?? 0,
        isFirst: true,
      }),
    )
    return
  }

  if (r.goToChapterDocIndex) {
    await r.goToChapterDocIndex(0)
  }
}

function resolvePdfPageIndex(node: Node): number | null {
  const doc = node.ownerDocument
  if (!doc) return null
  const frame = doc.defaultView?.frameElement as HTMLIFrameElement | null
  if (!frame?.id?.startsWith('pdf-iframe-')) return null
  const idx = parseInt(frame.id.slice('pdf-iframe-'.length), 10)
  return Number.isNaN(idx) ? null : idx
}

function findHighlightKeyFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null
  const el = target.closest('[data-key]')
  const key = el?.getAttribute('data-key')
  return key?.trim() ? key : null
}

function isPdfSubFrameNode(target: Node, mainDoc?: Document | null): boolean {
  const ownerDoc = target.ownerDocument
  if (!ownerDoc || ownerDoc === document || ownerDoc === mainDoc) return false
  const frame = ownerDoc.defaultView?.frameElement
  return frame instanceof HTMLIFrameElement && frame.id.startsWith('pdf-iframe-')
}

/** PDF 划词菜单：固定在读区左侧垂直居中，与选区无关 */
function getFixedPdfToolbarPosition(pageArea: HTMLElement | null): { x: number; y: number } {
  const margin = 12
  if (!pageArea) {
    return { x: margin + 8, y: window.innerHeight / 2 }
  }
  const rect = pageArea.getBoundingClientRect()
  return {
    x: rect.left + 8,
    y: rect.top + rect.height / 2,
  }
}

export interface ReaderChapterItem {
  index: number
  label: string
}

export function useKookitRendition(
  pageAreaRef: Ref<HTMLElement | null>,
  options: Ref<UseKookitRenditionOptions>,
) {
  const rendition = shallowRef<KookitRenditionInstance>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const chapterTitle = ref('')
  const progressPercent = ref(0)
  const currentSpreadIndex = ref(0)
  const textSelection = ref<TextSelectionPayload | null>(null)

  let selectionCleanup: (() => void) | null = null
  let refreshPdfSubDocBindings: (() => void) | null = null
  let refreshEpubIframeBindings: (() => void) | null = null
  let disposed = false
  const annotationsStore = useReaderAnnotationsStore()

  async function safeRenditionNav(action: () => Promise<void> | void): Promise<void> {
    if (disposed || loading.value || !rendition.value) return
    try {
      await action()
    } catch (error) {
      if (isReplaceChildrenError(error)) return
      throw error
    }
  }

  function applyReaderStyles(bookKey: string) {
    const r = rendition.value
    const format = options.value.format.toUpperCase()
    const pageBorderCss = isPdfFormat(format) ? '' : getPaginatedPageBorderCss()
    const css = StyleHelper.getDefaultCss(configService, bookKey) + pageBorderCss
    if (r?.setStyle) {
      r.setStyle(css)
    } else {
      const doc = r?.getDocument?.()
      if (!doc?.head) return
      let styleEl = doc.getElementById('default-style') as HTMLStyleElement | null
      if (styleEl) {
        styleEl.textContent = css
      } else {
        const newStyle = doc.createElement('style')
        newStyle.id = 'default-style'
        newStyle.textContent = css
        doc.head.appendChild(newStyle)
      }
    }
    applyReaderPageBorderStyles(r, format)
  }

  async function syncProgressDisplay() {
    const r = rendition.value
    if (!r?.getProgress) return
    try {
      const info = await r.getProgress()
      const raw = info?.percentage ?? info?.percent
      if (raw != null) {
        const num = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
        if (!Number.isNaN(num)) {
          progressPercent.value = num <= 1 ? num * 100 : num
        }
      }
    } catch {
      // ignore progress errors during render
    }
  }

  function resolveCurrentSpreadIndex(r: KookitRenditionInstance): number {
    const pos = r.getPosition?.()
    if (!pos) return 0

    let currentPage: number | undefined
    const format = options.value.format.toUpperCase()
    if (isPaginatedTextFormat(format) && r.getProgress) {
      try {
        const progress = r.getProgress()
        const raw = progress?.currentPage
        if (raw != null) {
          const parsed = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
          if (!Number.isNaN(parsed) && parsed > 0) {
            currentPage = parsed
          }
        }
      } catch {
        // ignore progress read errors
      }
    }

    return spreadIndexFromPosition(pos as BookRecordLocation, { currentPage })
  }

  function updateCurrentSpreadIndex() {
    const r = rendition.value
    if (!r) return
    currentSpreadIndex.value = resolveCurrentSpreadIndex(r)
  }

  function clearTextSelection() {
    textSelection.value = null
  }

  async function captureTextSelection(r: KookitRenditionInstance) {
    const iframe = r.getIframe?.()
    const win = iframe?.contentWindow
    const doc = r.getDocument?.()
    if (!win || !doc) {
      clearTextSelection()
      return
    }

    const sel = win.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      clearTextSelection()
      return
    }

    const quote = sel.toString().trim()
    const domRange = sel.getRangeAt(0)
    const box = domRange.getBoundingClientRect()
    if (!box.width && !box.height) {
      clearTextSelection()
      return
    }

    const iframeRect = iframe.getBoundingClientRect()

    let characterRange: unknown = null
    if (r.getHightlightCoords) {
      characterRange = await r.getHightlightCoords()
    }
    if (!characterRange) {
      clearTextSelection()
      return
    }

    const pos = r.getPosition?.()
    const chapterDocIndex =
      typeof pos?.chapterDocIndex === 'number'
        ? pos.chapterDocIndex
        : parseInt(String(pos?.chapterDocIndex ?? 0), 10) || 0
    const titleFromPos = pos?.chapterTitle ?? pos?.chapter

    textSelection.value = {
      quote,
      range: JSON.stringify(characterRange),
      spreadIndex: resolveCurrentSpreadIndex(r),
      chapterDocIndex,
      chapter:
        chapterTitle.value ||
        (typeof titleFromPos === 'string' ? titleFromPos : '') ||
        `Chapter ${chapterDocIndex}`,
      x: iframeRect.left + box.left + box.width / 2,
      y: iframeRect.top + box.top,
    }
  }

  async function resolvePdfHighlightCoords(
    r: KookitRenditionInstance,
    pageIndex: number,
    subDoc: Document,
    domRange: Range,
  ): Promise<unknown> {
    if (!r.getHightlightCoords) return null

    const sel = subDoc.getSelection()
    const savedRange = domRange.cloneRange()

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(savedRange)
        }
        const coords = await r.getHightlightCoords(pageIndex)
        if (coords) return coords
      } catch {
        // kookit 可能在页面 canvas 未就绪时抛错，稍后重试
      }
      if (attempt < 3) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 40))
      }
    }

    return null
  }

  async function capturePdfTextSelection(r: KookitRenditionInstance, pageIndex: number) {
    const subDoc = r.getSubDocument?.(pageIndex) as Document | null | undefined
    if (!subDoc) {
      clearTextSelection()
      return
    }

    const sel = subDoc.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sel.toString().trim()) {
      clearTextSelection()
      return
    }

    const quote = sel.toString().trim()
    const domRange = sel.getRangeAt(0)
    const { x, y } = getFixedPdfToolbarPosition(pageAreaRef.value)
    const characterRange = await resolvePdfHighlightCoords(r, pageIndex, subDoc, domRange)
    const resolvedPage =
      characterRange &&
      typeof characterRange === 'object' &&
      characterRange !== null &&
      typeof (characterRange as { page?: unknown }).page === 'number'
        ? (characterRange as { page: number }).page
        : pageIndex

    textSelection.value = {
      quote,
      range: characterRange ? JSON.stringify(characterRange) : '',
      spreadIndex: resolvedPage,
      chapterDocIndex: resolvedPage,
      chapter: pdfChapterLabel(resolvedPage),
      x,
      y,
    }
  }

  function showToolbarForExistingHighlight(
    item: ReaderHighlight,
    clientX: number,
    clientY: number,
    pageIndex?: number,
  ) {
    if (!item.range?.trim()) return

    textSelection.value = {
      quote: item.quote,
      range: item.range,
      spreadIndex: item.spreadIndex,
      chapterDocIndex: item.chapterDocIndex ?? pageIndex ?? 0,
      chapter: item.chapter,
      x: clientX,
      y: clientY,
    }
  }

  function handleExistingHighlightClick(
    event: MouseEvent,
    subDoc: Document | null,
    pageIndex?: number,
  ) {
    const key = findHighlightKeyFromTarget(event.target)
    if (!key) return false

    const item = annotationsStore.highlights.find(
      (h) => h.id === key && h.bookId === options.value.bookId,
    )
    if (!item?.range?.trim()) return false

    event.preventDefault()
    event.stopPropagation()

    subDoc?.getSelection()?.removeAllRanges()

    const { x: toolbarX, y: toolbarY } = getFixedPdfToolbarPosition(pageAreaRef.value)

    showToolbarForExistingHighlight(
      item,
      toolbarX,
      toolbarY,
      pageIndex ?? item.chapterDocIndex,
    )
    return true
  }

  function getVisiblePdfPageIndices(r: KookitRenditionInstance): number[] {
    const doc = r.getDocument?.()
    const pageArea = pageAreaRef.value
    if (!doc || !pageArea) {
      return [getCurrentChapterIndex()]
    }

    const areaRect = pageArea.getBoundingClientRect()
    const indices: number[] = []

    doc.querySelectorAll('[id^="pdf-container-"]').forEach((el: Element) => {
      const rect = el.getBoundingClientRect()
      if (rect.bottom <= areaRect.top || rect.top >= areaRect.bottom) return
      const idx = parseInt(el.id.replace('pdf-container-', ''), 10)
      if (!Number.isNaN(idx)) indices.push(idx)
    })

    if (indices.length === 0) {
      return [getCurrentChapterIndex()]
    }

    return [...new Set(indices)].sort((a, b) => a - b)
  }

  function clearPdfPageHighlights(r: KookitRenditionInstance, pageIndex: number) {
    const subDoc = r.getSubDocument?.(pageIndex) as Document | null | undefined
    if (!subDoc) return

    subDoc
      .querySelectorAll('.kookit-note, .kookit-note-icon, .noteLayer [data-key], #koodoPDFLayer [data-key]')
      .forEach((el) => el.remove())

    const noteLayer = subDoc.querySelector('.noteLayer')
    if (noteLayer) {
      noteLayer.querySelectorAll('.kookit-note, [data-key]').forEach((el) => el.remove())
    }
  }

  function removePdfHighlightById(
    r: KookitRenditionInstance,
    pageIndex: number,
    highlightId: string,
  ) {
    const subDoc = r.getSubDocument?.(pageIndex) as Document | null | undefined
    if (!subDoc) return

    subDoc.querySelectorAll(`[data-key="${highlightId}"]`).forEach((el) => el.remove())

    if (typeof r.removeOneNote === 'function') {
      try {
        r.removeOneNote(highlightId, pageIndex)
      } catch {
        // ignore kookit remove errors
      }
    }
  }

  async function ensurePdfPageReady(r: KookitRenditionInstance, pageIndex: number): Promise<boolean> {
    const doc = r.getDocument?.()
    if (!doc) return false

    if (isPdfPagePainted(r, pageIndex)) {
      return Boolean(r.getSubDocument?.(pageIndex))
    }

    if (typeof r.renderPdfPage === 'function') {
      try {
        await r.renderPdfPage(pageIndex, doc)
      } catch {
        // 懒加载页可能尚未挂载，继续尝试 scroll 唤醒
      }
    }

    if (typeof r.handlePDFScrollEvent === 'function') {
      try {
        await r.handlePDFScrollEvent(doc)
      } catch {
        // ignore scroll handler errors
      }
    }

    for (let attempt = 0; attempt < 10; attempt++) {
      if (isPdfPagePainted(r, pageIndex) && r.getSubDocument?.(pageIndex)) {
        return true
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50))
    }

    return Boolean(r.getSubDocument?.(pageIndex))
  }

  async function renderPdfPageHighlights(r: KookitRenditionInstance, pageIndex: number) {
    const bookId = options.value.bookId
    const items = annotationsStore.getPdfHighlightsForPage(bookId, pageIndex)
    const payload = toKookitPdfHighlightItems(items, pageIndex)

    const ready = await ensurePdfPageReady(r, pageIndex)
    if (!ready) return

    if (payload.length === 0) {
      clearPdfPageHighlights(r, pageIndex)
      return
    }

    clearPdfPageHighlights(r, pageIndex)
    await r.renderHighlighters(payload)
    const subDoc = r.getSubDocument?.(pageIndex) as Document | null | undefined
    if (subDoc) {
      applyCustomPdfHighlightColors(subDoc, items)
    }
  }

  async function applyStoredPdfHighlights(
    r: KookitRenditionInstance,
    forcePageIndices: number[] = [],
  ) {
    const bookId = options.value.bookId
    const annotatedPages = collectPdfHighlightPageIndices(
      annotationsStore.getHighlightsForBook(bookId),
      bookId,
    )
    const visiblePages = getVisiblePdfPageIndices(r)
    const pageIndices = [...new Set([...annotatedPages, ...visiblePages, ...forcePageIndices])].sort(
      (a, b) => a - b,
    )

    for (const pageIndex of pageIndices) {
      try {
        await renderPdfPageHighlights(r, pageIndex)
      } catch (err) {
        console.warn('[PDF highlight] failed to render page', pageIndex, err)
      }
    }
  }

  async function refreshPdfHighlightsAfterRemove(
    r: KookitRenditionInstance,
    pageIndex: number,
    highlightId: string,
  ) {
    removePdfHighlightById(r, pageIndex, highlightId)
    await renderPdfPageHighlights(r, pageIndex)
  }

  function schedulePdfHighlightRefresh(r: KookitRenditionInstance) {
    void applyStoredPdfHighlights(r)
    window.setTimeout(() => void applyStoredPdfHighlights(r), 400)
  }

  function applyCustomPdfHighlightColors(subDoc: Document, items: ReaderHighlight[]) {
    for (const item of items) {
      const fill = getHighlightColorDef(item.color).fill
      subDoc.querySelectorAll(`.kookit-note[data-key="${item.id}"]`).forEach((el) => {
        const node = el as HTMLElement
        node.style.backgroundColor = fill
        node.style.opacity = '1'
        node.style.borderBottom = 'none'
      })
    }
  }

  function bindPdfTextSelection(r: KookitRenditionInstance) {
    const boundDocs = new WeakSet<Document>()
    const subDocCleanups: Array<() => void> = []

    const refreshSubDocBindings = () => {
      const doc = r.getDocument?.()
      if (!doc) return

      doc.querySelectorAll('iframe[id^="pdf-iframe-"]').forEach((iframeEl: Element) => {
        const subDoc = (iframeEl as HTMLIFrameElement).contentDocument
        if (!subDoc || boundDocs.has(subDoc)) return

        boundDocs.add(subDoc)

        const pageIndex = parseInt(
          (iframeEl as HTMLIFrameElement).id.replace('pdf-iframe-', ''),
          10,
        )

        const onHighlightClick = (event: MouseEvent) => {
          handleExistingHighlightClick(event, subDoc, Number.isNaN(pageIndex) ? undefined : pageIndex)
        }

        const onMouseUp = () => {
          window.setTimeout(() => {
            const sel = subDoc.getSelection()
            if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sel.toString().trim()) return
            if (findHighlightKeyFromTarget(sel.anchorNode)) return

            const resolvedPage = resolvePdfPageIndex(sel.getRangeAt(0).startContainer) ?? pageIndex
            if (resolvedPage == null || Number.isNaN(resolvedPage)) return
            void capturePdfTextSelection(r, resolvedPage)
          }, 30)
        }

        subDoc.addEventListener('click', onHighlightClick, true)
        subDoc.addEventListener('mouseup', onMouseUp)
        subDocCleanups.push(() => {
          subDoc.removeEventListener('click', onHighlightClick, true)
          subDoc.removeEventListener('mouseup', onMouseUp)
        })

        injectPdfHighlightPointerStyles(subDoc)
      })
    }

    function injectPdfHighlightPointerStyles(subDoc: Document) {
      const styleId = 'sanko-pdf-highlight-style'
      const css = `
        .noteLayer,
        #koodoPDFLayer {
          pointer-events: none !important;
        }
        .noteLayer .kookit-note[data-key],
        #koodoPDFLayer .kookit-note[data-key] {
          pointer-events: auto !important;
          cursor: pointer;
        }
      `
      let style = subDoc.getElementById(styleId) as HTMLStyleElement | null
      if (style) {
        style.textContent = css
        return
      }
      style = subDoc.createElement('style')
      style.id = styleId
      style.textContent = css
      ;(subDoc.head || subDoc.documentElement).appendChild(style)
    }

    refreshSubDocBindings()
    refreshPdfSubDocBindings = refreshSubDocBindings

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (target instanceof Element && target.closest('.selection-toolbar, .reader-note-dialog')) {
        return
      }
      const mainDoc = r.getDocument?.()
      if (mainDoc?.contains(target)) return
      if (isPdfSubFrameNode(target, mainDoc)) return
      const pageArea = pageAreaRef.value
      if (pageArea?.contains(target)) return
      clearTextSelection()
    }

    document.addEventListener('mousedown', onMouseDown)

    const pageArea = pageAreaRef.value
    let scrollTimer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        refreshSubDocBindings()
        schedulePdfHighlightRefresh(r)
      }, 120)
    }

    pageArea?.addEventListener('scroll', onScroll, { passive: true })

    selectionCleanup = () => {
      subDocCleanups.forEach((fn) => fn())
      subDocCleanups.length = 0
      document.removeEventListener('mousedown', onMouseDown)
      pageArea?.removeEventListener('scroll', onScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
      refreshPdfSubDocBindings = null
    }
  }

  function bindEpubTextSelection(r: KookitRenditionInstance) {
    let iframeCleanup: (() => void) | null = null

    const refresh = () => {
      iframeCleanup?.()
      iframeCleanup = null

      const iframe = r.getIframe?.()
      const doc = iframe?.contentDocument
      if (!doc) return

      const onHighlightClick = (event: MouseEvent) => {
        handleExistingHighlightClick(event, doc)
      }

      const onMouseUp = () => {
        window.setTimeout(() => {
          void captureTextSelection(r)
        }, 12)
      }

      doc.addEventListener('click', onHighlightClick, true)
      doc.addEventListener('mouseup', onMouseUp)
      iframeCleanup = () => {
        doc.removeEventListener('click', onHighlightClick, true)
        doc.removeEventListener('mouseup', onMouseUp)
      }
    }

    refresh()
    refreshEpubIframeBindings = refresh

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (findHighlightKeyFromTarget(target)) return
      const iframe = r.getIframe?.()
      const doc = iframe?.contentDocument
      if (doc?.contains(target)) return
      if (target instanceof Element && target.closest('.selection-toolbar, .reader-note-dialog')) {
        return
      }
      clearTextSelection()
    }

    document.addEventListener('mousedown', onMouseDown)

    selectionCleanup = () => {
      iframeCleanup?.()
      iframeCleanup = null
      document.removeEventListener('mousedown', onMouseDown)
      refreshEpubIframeBindings = null
    }
  }

  function bindTextSelection(r: KookitRenditionInstance) {
    if (isPdfFormat(options.value.format)) {
      if (refreshPdfSubDocBindings) {
        refreshPdfSubDocBindings()
        return
      }
    }

    if (isEpubFormat(options.value.format)) {
      if (refreshEpubIframeBindings) {
        refreshEpubIframeBindings()
        return
      }
    }

    selectionCleanup?.()
    selectionCleanup = null
    clearTextSelection()

    if (!supportsAnnotationHighlight(options.value.format)) return

    if (isPdfFormat(options.value.format)) {
      bindPdfTextSelection(r)
      return
    }

    if (isEpubFormat(options.value.format)) {
      bindEpubTextSelection(r)
      return
    }

    const doc = r.getDocument?.()
    if (!doc) return

    const onHighlightClick = (event: MouseEvent) => {
      handleExistingHighlightClick(event, doc)
    }

    const onMouseUp = (event: MouseEvent) => {
      window.setTimeout(() => {
        if (findHighlightKeyFromTarget(event.target)) return
        void captureTextSelection(r)
      }, 12)
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (findHighlightKeyFromTarget(target)) return
      if (doc.contains(target)) return
      if (target instanceof Element && target.closest('.selection-toolbar, .reader-note-dialog')) {
        return
      }
      clearTextSelection()
    }

    doc.addEventListener('click', onHighlightClick, true)
    doc.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)

    selectionCleanup = () => {
      doc.removeEventListener('click', onHighlightClick, true)
      doc.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }

  async function removePdfHighlight(highlightId: string, pageIndex: number) {
    const r = rendition.value
    if (!r || !isPdfFormat(options.value.format)) return
    await refreshPdfHighlightsAfterRemove(r, pageIndex, highlightId)
  }

  async function applyStoredHighlights(forcePageIndices: number[] = []) {
    const r = rendition.value
    if (!r?.renderHighlighters || !supportsAnnotationHighlight(options.value.format)) return

    if (isPdfFormat(options.value.format)) {
      await applyStoredPdfHighlights(r, forcePageIndices)
      return
    }

    const chapterDocIndex =
      forcePageIndices.length > 0
        ? forcePageIndices[0]!
        : getCurrentChapterIndex()
    const items = annotationsStore.getHighlightsForChapter(
      options.value.bookId,
      chapterDocIndex,
    )
    const payload = toKookitHighlightItems(items)

    try {
      await r.renderHighlighters(payload)
      applyCustomHighlightColors(r, items)
    } catch {
      // ignore highlight render errors
    }
  }

  function applyCustomHighlightColors(r: KookitRenditionInstance, items: ReaderHighlight[]) {
    const doc = r.getDocument?.()
    if (!doc) return

    for (const item of items) {
      const fill = getHighlightColorDef(item.color).fill
      const spans = doc.querySelectorAll(`span.kookit-note[data-key="${item.id}"]`)
      spans.forEach((span: Element) => {
        ;(span as HTMLElement).style.backgroundColor = fill
      })
    }
  }

  function bindRenditionEvents() {
    const r = rendition.value
    if (!r?.on) return

    const onLocationChange = async () => {
      if (disposed || !rendition.value || !pageAreaRef.value?.isConnected) return
      try {
        const pos = r.getPosition?.()
        if (pos) {
          setRecordLocation(options.value.bookId, pos as BookRecordLocation)
          updateCurrentSpreadIndex()
          const title = pos.chapterTitle ?? pos.chapter
          chapterTitle.value = typeof title === 'string' ? title : ''
        }
        if (isPdfFormat(options.value.format)) {
          applyPdfPageBorderStyles(r)
        }
        if (supportsAnnotationHighlight(options.value.format)) {
          bindTextSelection(r)
          await applyStoredHighlights()
        }
        await syncProgressDisplay()
      } catch (error) {
        if (!isReplaceChildrenError(error)) {
          throw error
        }
      }
    }

    r.on('rendered', onLocationChange)
    r.on('page-changed', onLocationChange)
  }

  async function open(buffer: ArrayBuffer) {
    disposed = false
    loading.value = true
    error.value = null
    const format = options.value.format.toUpperCase()

    if (buffer.byteLength === 0) {
      loading.value = false
      const message = buildEmptyBufferMessage(format)
      error.value = message
      throw new Error(message)
    }

    try {
      await withReaderLoadTimeout(performOpen(buffer, format), format)
    } catch (e) {
      rendition.value?.removeContent?.()
      rendition.value = null
      const message = normalizeReaderLoadError(e, format)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function performOpen(buffer: ArrayBuffer, format: string) {
    if (rendition.value) {
      rendition.value.removeContent?.()
      rendition.value = null
    }

    const el = pageAreaRef.value
    if (!el) {
      throw new Error('阅读容器未就绪')
    }

    await waitForReaderContainer(el)

    const { charset } = options.value
    const settings = normalizeSettingsForFormat(loadReaderSettings(), format)
    configService.applySettings(settings)
    const config = buildRenditionConfig(format, charset ?? '')
    const r = BookHelper.getRendition(buffer, config as unknown as Record<string, unknown>, Kookit)
    if (!r) {
      throw new Error(`暂不支持 ${format} 格式`)
    }

    if (format === 'TXT' && r.getMetadata) {
      await r.getMetadata(buffer)
    }

    rendition.value = r
    const saved = getRecordLocation(options.value.bookId)

    if (format === 'PDF') {
      await ensurePdfJsReady()
    }

    if (format === 'TXT') {
      const parseLocation = getTxtParseLocation(saved)
      await renderToRendition(r, el, parseLocation)
    } else {
      await renderToRendition(r, el)
    }

    if (format === 'PDF') {
      await bootPdfReader(
        r,
        el,
        () => restoreReadingPosition(r, saved, format),
        () => renderToRendition(r, el),
      )
    } else {
      await restoreReadingPosition(r, saved, format)
    }

    applyReaderStyles(options.value.bookId)
    bindRenditionEvents()
    if (supportsAnnotationHighlight(format)) {
      bindTextSelection(r)
    }

    const pos = r.getPosition?.()
    if (pos) {
      updateCurrentSpreadIndex()
      const title = pos.chapterTitle
      chapterTitle.value = typeof title === 'string' ? title : ''
    }
    await syncProgressDisplay()
    if (supportsAnnotationHighlight(format)) {
      await applyStoredHighlights()
    }
  }

  async function prev() {
    await safeRenditionNav(async () => {
      await rendition.value?.prev?.()
      updateCurrentSpreadIndex()
    })
  }

  async function next() {
    await safeRenditionNav(async () => {
      await rendition.value?.next?.()
      updateCurrentSpreadIndex()
    })
  }

  async function goToChapterDocIndex(index: number) {
    await rendition.value?.goToChapterDocIndex?.(index)
  }

  async function goToSpreadIndex(spreadIndex: number) {
    const r = rendition.value
    if (!r) return

    const location = spreadIndexToLocation(spreadIndex)
    const format = options.value.format.toUpperCase()

    if (isPdfFormat(format) && r.goToPosition) {
      await r.goToPosition(
        JSON.stringify({
          chapterDocIndex: spreadIndex,
          count: 0,
          isFirst: true,
        }),
      )
      updateCurrentSpreadIndex()
      await applyStoredHighlights()
      return
    }

    const needsPageJump =
      isPaginatedTextFormat(format) &&
      (location.page != null || spreadIndex >= SPREAD_PAGE_STRIDE || spreadIndex === 0)

    if (needsPageJump && r.goToPosition) {
      await r.goToPosition(
        JSON.stringify({
          ...location,
          page: location.page ?? '1',
          count: 0,
          isFirst: true,
        }),
      )
      updateCurrentSpreadIndex()
      await applyStoredHighlights()
      return
    }

    await r.goToChapterDocIndex?.(spreadIndex)
    updateCurrentSpreadIndex()
    await applyStoredHighlights()
  }

  function getChapterList(): ReaderChapterItem[] {
    const r = rendition.value
    if (!r?.getChapterDoc) return []
    const format = options.value.format.toUpperCase()
    const isPdf = isPdfFormat(format)
    const docs = r.getChapterDoc()
    if (!Array.isArray(docs) || docs.length === 0) return []
    return docs.map((doc, index) => ({
      index,
      label:
        (typeof doc?.label === 'string' && doc.label.trim()) ||
        (isPdf ? pdfChapterLabel(index) : `Chapter ${index}`),
    }))
  }

  function getCurrentChapterIndex(): number {
    const pos = rendition.value?.getPosition?.()
    if (!pos) return 0
    const idx = pos.chapterDocIndex
    if (idx == null || idx === '') return 0
    return typeof idx === 'number' ? idx : parseInt(String(idx), 10) || 0
  }

  function getCurrentSpreadIndex(): number {
    return currentSpreadIndex.value
  }

  async function goToSavedLocation() {
    const r = rendition.value
    const saved = getRecordLocation(options.value.bookId)
    if (!r || !hasValidSavedLocation(saved)) return
    await restoreReadingPosition(r, saved, options.value.format)
  }

  async function refreshPendingSelectionRange(): Promise<string | null> {
    const current = textSelection.value
    if (!current?.quote.trim()) return null
    if (current.range?.trim()) return current.range
    if (!isPdfFormat(options.value.format)) return null

    const r = rendition.value
    const pageIndex = current.chapterDocIndex
    const subDoc = r?.getSubDocument?.(pageIndex) as Document | null | undefined
    if (!r || !subDoc) return null

    const sel = subDoc.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null

    const coords = await resolvePdfHighlightCoords(r, pageIndex, subDoc, sel.getRangeAt(0))
    if (!coords) return null

    const range = JSON.stringify(coords)
    textSelection.value = {
      ...current,
      range,
    }
    return range
  }

  function destroy() {
    disposed = true
    selectionCleanup?.()
    selectionCleanup = null
    refreshPdfSubDocBindings = null
    clearTextSelection()
    rendition.value?.removeContent?.()
    rendition.value = null
  }

  onUnmounted(destroy)

  return {
    rendition,
    loading,
    error,
    chapterTitle,
    progressPercent,
    currentSpreadIndex,
    textSelection,
    open,
    prev,
    next,
    goToSavedLocation,
    goToChapterDocIndex,
    goToSpreadIndex,
    getChapterList,
    getCurrentChapterIndex,
    getCurrentSpreadIndex,
    applyReaderStyles,
    applyStoredHighlights,
    removePdfHighlight,
    clearTextSelection,
    refreshPendingSelectionRange,
    destroy,
  }
}
