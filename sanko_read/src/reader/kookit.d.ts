declare module '@/assets/lib/kookit.min.js' {
  export interface KookitRenditionLike {
    renderTo(element: HTMLElement, location?: unknown): Promise<void>
    removeContent(): void
    prev(): Promise<void>
    next(): Promise<void>
    goToPosition(payload: string): Promise<void>
    goToChapterDocIndex?(index: number): Promise<void>
    getChapterDoc?(): Array<{ label?: string; href?: string }>
    getChapter?(): unknown[]
    renderPdfPage?(index: number, doc: Document): Promise<void>
    handlePDFScrollEvent?(doc: Document): Promise<void>
    pdfScale?: number
    getMetadata?(buffer: ArrayBuffer): Promise<{ charset?: string }>
    getPosition(): Record<string, unknown>
    getProgress(): Promise<{ percentage?: number; percent?: number; currentPage?: number }> | { percentage?: number; percent?: number; currentPage?: number }
    getHightlightCoords?(): Promise<unknown>
    renderHighlighters?(items: Array<{ range: string; color: number; key: string; notes: string }>): Promise<void>
    getIframe?(): HTMLIFrameElement | null
    getDocument(): Document | null
    on(event: string, handler: () => void): void
  }

  export const BookHelper: {
    getRendition(
      buffer: ArrayBuffer,
      config: Record<string, unknown>,
      kookit: Record<string, unknown>,
    ): KookitRenditionLike | undefined
  }

  export const StyleHelper: {
    getDefaultCss(configService: unknown, bookKey?: string): string
  }

  export const CacheRender: unknown
  export const ComicRender: unknown
  export const DocxRender: unknown
  export const EpubRender: unknown
  export const Fb2Render: unknown
  export const HtmlRender: unknown
  export const MdRender: unknown
  export const MobiRender: unknown
  export const PdfRender: unknown
  export const PdfTextRender: unknown
  export const TxtRender: unknown
}
