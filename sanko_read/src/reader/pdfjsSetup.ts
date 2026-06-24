import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

declare global {
  interface Window {
    pdfjsLib: typeof pdfjsLib
  }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
window.pdfjsLib = pdfjsLib

let pdfJsReadyPromise: Promise<void> | null = null

/** 预加载 PDF.js worker，减少首次打开 PDF 的冷启动失败 */
export function ensurePdfJsReady(): Promise<void> {
  if (pdfJsReadyPromise) return pdfJsReadyPromise

  pdfJsReadyPromise = (async () => {
    try {
      await fetch(workerSrc, { method: 'GET', cache: 'force-cache' })
    } catch {
      // worker 预取失败不阻断，后续渲染仍会尝试加载
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })()

  return pdfJsReadyPromise
}

void ensurePdfJsReady()
