export const READER_SETTINGS_STORAGE_KEY = 'sanko-reader-settings'

export type ReaderMode = 'single' | 'double' | 'scroll'

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  textColor: string
  backgroundColor: string
  readerMode: ReaderMode
  isIndent: boolean
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.9,
  textColor: '#333333',
  backgroundColor: '#faf8f4',
  readerMode: 'double',
  isIndent: true,
}

export const READER_BACKGROUND_PRESETS = [
  { label: '米白', value: '#faf8f4' },
  { label: '纯白', value: '#ffffff' },
  { label: '护眼绿', value: '#e8f0e6' },
  { label: '羊皮纸', value: '#f7f3eb' },
  { label: '深灰', value: '#2b2b2b' },
] as const

export const DARK_BACKGROUND = '#2b2b2b'

const PAGINATED_TEXT_FORMATS = new Set(['DOCX', 'TXT', 'MD'])

const HTML_STYLE_FORMATS = new Set([
  'DOCX',
  'TXT',
  'MD',
  'EPUB',
  'HTML',
  'XHTML',
  'MHTML',
  'HTM',
  'XML',
  'FB2',
])

export function isPdfFormat(format: string): boolean {
  return format.toUpperCase() === 'PDF'
}

export function isPaginatedTextFormat(format: string): boolean {
  return PAGINATED_TEXT_FORMATS.has(format.toUpperCase())
}

export function isTextHighlightFormat(format: string): boolean {
  const normalized = format.toUpperCase()
  return normalized === 'TXT' || normalized === 'DOCX'
}

/** 支持划词高亮与笔记的格式（含 PDF 文本层） */
export function supportsAnnotationHighlight(format: string): boolean {
  const normalized = format.toUpperCase()
  return normalized === 'TXT' || normalized === 'DOCX' || normalized === 'PDF'
}

export function resolveReaderModeForFormat(format: string, mode?: ReaderMode): ReaderMode {
  if (isPdfFormat(format)) return 'scroll'
  const resolved = mode ?? loadReaderSettings().readerMode
  if (resolved === 'scroll') return 'double'
  return resolved === 'single' ? 'single' : 'double'
}

export function getBackgroundPresetsForFormat(format: string) {
  if (isPaginatedTextFormat(format) || isPdfFormat(format)) {
    return READER_BACKGROUND_PRESETS.filter((preset) => preset.value !== DARK_BACKGROUND)
  }
  return [...READER_BACKGROUND_PRESETS]
}

export function normalizeSettingsForFormat(
  settings: ReaderSettings,
  format: string,
): ReaderSettings {
  const normalized = { ...settings }
  normalized.readerMode = resolveReaderModeForFormat(format, settings.readerMode)
  if (
    (isPaginatedTextFormat(format) || isPdfFormat(format)) &&
    normalized.backgroundColor === DARK_BACKGROUND
  ) {
    normalized.backgroundColor = DEFAULT_READER_SETTINGS.backgroundColor
    if (normalized.textColor === '#e8e8e8') {
      normalized.textColor = DEFAULT_READER_SETTINGS.textColor
    }
  }
  return normalized
}

export function supportsReaderTextStyles(format: string): boolean {
  return HTML_STYLE_FORMATS.has(format.toUpperCase())
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (Number.isNaN(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

export function loadReaderSettings(): ReaderSettings {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_READER_SETTINGS }
  }
  try {
    const raw = localStorage.getItem(READER_SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_READER_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>
    return {
      fontSize: clampNumber(parsed.fontSize, 12, 28, DEFAULT_READER_SETTINGS.fontSize),
      lineHeight: clampNumber(parsed.lineHeight, 1.2, 3, DEFAULT_READER_SETTINGS.lineHeight),
      textColor:
        typeof parsed.textColor === 'string' ? parsed.textColor : DEFAULT_READER_SETTINGS.textColor,
      backgroundColor:
        typeof parsed.backgroundColor === 'string'
          ? parsed.backgroundColor
          : DEFAULT_READER_SETTINGS.backgroundColor,
      readerMode:
        parsed.readerMode === 'single' ||
        parsed.readerMode === 'double' ||
        parsed.readerMode === 'scroll'
          ? parsed.readerMode
          : DEFAULT_READER_SETTINGS.readerMode,
      isIndent: parsed.isIndent !== false,
    }
  } catch {
    return { ...DEFAULT_READER_SETTINGS }
  }
}

export function saveReaderSettings(settings: ReaderSettings): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(READER_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
