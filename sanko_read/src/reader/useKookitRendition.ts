import { ref, shallowRef, onUnmounted, nextTick, type Ref } from 'vue'
import { BookHelper, StyleHelper, Kookit } from '@/reader/kookitLoader'
import { buildRenditionConfig } from '@/reader/renditionOptions'
import { getRecordLocation, setRecordLocation, type BookRecordLocation } from '@/reader/readerConfig'
import { configService } from '@/reader/configService'
import {
  isPaginatedTextFormat,
  isPdfFormat,
  supportsAnnotationHighlight,
  loadReaderSettings,
  normalizeSettingsForFormat,
} from '@/reader/readerSettings'
import { bootPdfReader } from '@/reader/pdfBoot'
import { ensurePdfJsReady } from '@/reader/pdfjsSetup'
import {
  applyPdfPageBorderStyles,
  applyReaderPageBorderStyles,
  getPaginatedPageBorderCss,
} from '@/reader/readerPageBorderStyles'
import { spreadIndexFromPosition, spreadIndexToLocation, SPREAD_PAGE_STRIDE } from '@/reader/spreadIndex'
import {
  pdfChapterLabel,
  toKookitHighlightItems,
  toKookitPdfHighlightItems,
  type TextSelectionPayload,
} from '@/reader/highlightUtils'
import { getHighlightColorDef } from '@/reader/highlightColors'
import type { ReaderHighlight } from '@/types/reader'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'

export interface UseKookitRenditionOptions {
  bookId: string
  format: string
  charset?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KookitRenditionInstance = any

const RENDER_TIMEOUT_MS = 60_000
const CONTAINER_READY_MAX_FRAMES = 60

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

async function renderToWithTimeout(
  r: KookitRenditionInstance,
  el: HTMLElement,
  bookLocation?: BookRecordLocation,
): Promise<void> {
  const task =
    bookLocation != null ? r.renderTo(el, bookLocation) : r.renderTo(el)

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('打开书籍超时，请重试')), RENDER_TIMEOUT_MS)
  })

  try {
    await Promise.race([task, timeout])
  } finally {
    if (timer) clearTimeout(timer)
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

/** 合并选区所有 client rect，避免多行时取第一行最左缘 */
function getRangeUnionRect(range: Range): { left: number; top: number; width: number; height: number } | null {
  const rects = range.getClientRects()
  if (rects.length === 0) return null

  let minLeft = Infinity
  let minTop = Infinity
  let maxRight = -Infinity
  let maxBottom = -Infinity

  for (const rect of rects) {
    if (rect.width <= 0 && rect.height <= 0) continue
    minLeft = Math.min(minLeft, rect.left)
    minTop = Math.min(minTop, rect.top)
    maxRight = Math.max(maxRight, rect.right)
    maxBottom = Math.max(maxBottom, rect.bottom)
  }

  if (!Number.isFinite(minLeft)) return null
  return {
    left: minLeft,
    top: minTop,
    width: maxRight - minLeft,
    height: Math.max(maxBottom - minTop, 0),
  }
}

/** 取选区锚点矩形，兼容 PDF 单行 height=0 的情况 */
function getSelectionAnchorRect(range: Range): { left: number; top: number; width: number; height: number } | null {
  const union = getRangeUnionRect(range)
  if (union) return union

  const box = range.getBoundingClientRect()
  if (box.width > 0 || box.height > 0) {
    return {
      left: box.left,
      top: box.top,
      width: Math.max(box.width, 1),
      height: Math.max(box.height, 1),
    }
  }

  for (const rect of range.getClientRects()) {
    if (rect.width > 0 || rect.height > 0) {
      return {
        left: rect.left,
        top: rect.top,
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1),
      }
    }
  }

  return null
}

function hasVisibleSelectionRect(range: Range): boolean {
  return getSelectionAnchorRect(range) !== null
}

/**
 * 检测 PDF 子 iframe 内 DOMRect 是否已是顶层视口坐标。
 * 对比 documentElement 与 iframe 元素在视口中的位置，比按选区尺寸猜测更稳定。
 */
function pdfSubDocUsesViewportCoords(subDoc: Document): boolean {
  const frame = subDoc.defaultView?.frameElement as HTMLIFrameElement | null
  if (!frame) return true
  const frameRect = frame.getBoundingClientRect()
  const docRect = subDoc.documentElement.getBoundingClientRect()
  return (
    Math.abs(docRect.top - frameRect.top) <= 2 &&
    Math.abs(docRect.left - frameRect.left) <= 2
  )
}

function pdfCoordsToViewport(
  x: number,
  y: number,
  subDoc: Document,
): { x: number; y: number } {
  if (pdfSubDocUsesViewportCoords(subDoc)) {
    return { x, y }
  }
  const frame = subDoc.defaultView?.frameElement as HTMLIFrameElement | null
  if (!frame) return { x, y }
  const frameRect = frame.getBoundingClientRect()
  return {
    x: frameRect.left + x,
    y: frameRect.top + y,
  }
}

/** 菜单锚点 y 不能太小，否则 translate(-100%) 会把菜单顶出视口 */
function clampToolbarViewportPosition(x: number, y: number): { x: number; y: number } {
  const margin = 12
  const estToolbarHeight = 88
  return {
    x: Math.min(Math.max(x, margin), window.innerWidth - margin),
    y: Math.max(y, estToolbarHeight + margin + 8),
  }
}

function isPdfSubFrameNode(target: Node, mainDoc?: Document | null): boolean {
  const ownerDoc = target.ownerDocument
  if (!ownerDoc || ownerDoc === document || ownerDoc === mainDoc) return false
  const frame = ownerDoc.defaultView?.frameElement
  return frame instanceof HTMLIFrameElement && frame.id.startsWith('pdf-iframe-')
}

/** 子 iframe 内坐标 → 浏览器视口坐标（fixed 定位用） */
function toPdfViewportPoint(
  x: number,
  y: number,
  subDoc: Document,
): { x: number; y: number } {
  return pdfCoordsToViewport(x, y, subDoc)
}

function rectToPdfViewportToolbarPosition(
  rect: { left: number; top: number; width: number; height: number },
  subDoc: Document,
): { x: number; y: number } {
  const centerX = rect.left + rect.width / 2
  const topY = rect.top
  const viewport = pdfCoordsToViewport(centerX, topY, subDoc)
  return clampToolbarViewportPosition(viewport.x, viewport.y)
}

/** PDF 子 iframe 内选区 rect 需叠加 frame 偏移才对应视口 fixed 定位 */
function getPdfSelectionToolbarPosition(range: Range, subDoc: Document): { x: number; y: number } {
  const anchorRect = getSelectionAnchorRect(range)
  if (!anchorRect) {
    return clampToolbarViewportPosition(0, 0)
  }
  return rectToPdfViewportToolbarPosition(anchorRect, subDoc)
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
  const annotationsStore = useReaderAnnotationsStore()

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
    if (!hasVisibleSelectionRect(domRange)) {
      clearTextSelection()
      return
    }

    const { x, y } = getPdfSelectionToolbarPosition(domRange, subDoc)
    const characterRange = await resolvePdfHighlightCoords(r, pageIndex, subDoc, domRange)

    textSelection.value = {
      quote,
      range: characterRange ? JSON.stringify(characterRange) : '',
      spreadIndex: pageIndex,
      chapterDocIndex: pageIndex,
      chapter: pdfChapterLabel(pageIndex),
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

    const highlightEl = (event.target as Element | null)?.closest('[data-key]') as HTMLElement | null
    let toolbarX = event.clientX
    let toolbarY = event.clientY

    if (highlightEl && subDoc) {
      const box = highlightEl.getBoundingClientRect()
      const pos = rectToPdfViewportToolbarPosition(box, subDoc)
      toolbarX = pos.x
      toolbarY = pos.y
    } else if (subDoc) {
      const pos = toPdfViewportPoint(event.clientX, event.clientY, subDoc)
      toolbarX = pos.x
      toolbarY = pos.y
    }

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
    subDoc.querySelectorAll('.kookit-note, .noteLayer [data-key], #koodoPDFLayer [data-key]').forEach(
      (el) => el.remove(),
    )
  }

  async function applyStoredPdfHighlights(r: KookitRenditionInstance) {
    const bookId = options.value.bookId
    const pageIndices = getVisiblePdfPageIndices(r)

    for (const pageIndex of pageIndices) {
      const items = annotationsStore.getHighlightsForChapter(bookId, pageIndex)
      const payload = toKookitPdfHighlightItems(items, pageIndex)

      try {
        if (payload.length === 0) {
          clearPdfPageHighlights(r, pageIndex)
          continue
        }
        await r.renderHighlighters(payload)
        const subDoc = r.getSubDocument?.(pageIndex) as Document | null | undefined
        if (subDoc) {
          applyCustomPdfHighlightColors(subDoc, items)
        }
      } catch {
        // ignore per-page highlight errors
      }
    }
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
        void applyStoredPdfHighlights(r)
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

  function bindTextSelection(r: KookitRenditionInstance) {
    if (isPdfFormat(options.value.format)) {
      if (refreshPdfSubDocBindings) {
        refreshPdfSubDocBindings()
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

  async function applyStoredHighlights() {
    const r = rendition.value
    if (!r?.renderHighlighters || !supportsAnnotationHighlight(options.value.format)) return

    if (isPdfFormat(options.value.format)) {
      await applyStoredPdfHighlights(r)
      return
    }

    const chapterDocIndex = getCurrentChapterIndex()
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
    }

    r.on('rendered', onLocationChange)
    r.on('page-changed', onLocationChange)
  }

  async function open(buffer: ArrayBuffer) {
    loading.value = true
    error.value = null
    try {
      if (rendition.value) {
        rendition.value.removeContent?.()
        rendition.value = null
      }

      const el = pageAreaRef.value
      if (!el) {
        throw new Error('阅读容器未就绪')
      }

      await waitForReaderContainer(el)

      const format = options.value.format.toUpperCase()
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
        await renderToWithTimeout(r, el, parseLocation)
      } else {
        await renderToWithTimeout(r, el)
      }

      if (format === 'PDF') {
        await bootPdfReader(
          r,
          el,
          () => restoreReadingPosition(r, saved, format),
          () => renderToWithTimeout(r, el),
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
    } catch (e) {
      error.value = e instanceof Error ? e.message : '打开书籍失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function prev() {
    await rendition.value?.prev?.()
    updateCurrentSpreadIndex()
  }

  async function next() {
    await rendition.value?.next?.()
    updateCurrentSpreadIndex()
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
      return
    }

    await r.goToChapterDocIndex?.(spreadIndex)
    updateCurrentSpreadIndex()
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
    clearTextSelection,
    refreshPendingSelectionRange,
    destroy,
  }
}
