import { configService } from '@/reader/configService'
import { resolveReaderModeForFormat, type ReaderMode } from '@/reader/readerSettings'

export interface KookitRenditionConfig {
  format: string
  readerMode: string
  charset: string
  animation: string
  convertChinese: string
  parserRegex: string
  isDarkMode: string
  isMobile: string
  password: string
  isConvertPDF: string
  backgroundColor: string
  isScannedPDF: string
  ocrEngine: string
  bookLayout?: string
  textRules?: unknown[]
  codeHighlighter?: string
  fullTranslationMode?: string
  textOrientation?: string
  isIndent?: string
  isHyphenation?: string
  isAllowScript?: string
  isBionic?: string
  scale?: number
  isKeepPDFBackground?: string
  paraSpacingValue?: string
  titleSizeValue?: string
}

const TEXT_FORMATS = new Set(['TXT', 'MD'])
const HTML_FORMATS = new Set(['DOCX', 'HTML', 'XHTML', 'MHTML', 'HTM', 'XML'])
const SCRIPT_ALLOWED_FORMATS = new Set([...HTML_FORMATS, 'TXT', 'MD', 'PDF'])

export function buildRenditionConfig(format: string, charset = ''): KookitRenditionConfig {
  const normalizedFormat = format.toUpperCase()
  const resolvedCharset =
    charset.trim() || (TEXT_FORMATS.has(normalizedFormat) ? 'utf-8' : '')
  const savedMode = configService.getReaderConfig('readerMode') as ReaderMode

  return {
    format: normalizedFormat,
    readerMode: resolveReaderModeForFormat(normalizedFormat, savedMode),
    charset: resolvedCharset,
    animation: 'none',
    convertChinese: 'no',
    parserRegex: '',
    isDarkMode: 'no',
    isMobile: 'no',
    password: '',
    isConvertPDF: 'no',
    backgroundColor: configService.getReaderConfig('backgroundColor') || '#faf8f4',
    isScannedPDF: 'no',
    ocrEngine: '',
    bookLayout: '',
    textRules: [],
    codeHighlighter: '',
    fullTranslationMode: 'no',
    textOrientation: 'horizontal',
    isIndent: configService.getReaderConfig('isIndent') || 'yes',
    isHyphenation: 'no',
    isAllowScript: SCRIPT_ALLOWED_FORMATS.has(normalizedFormat) ? 'yes' : 'no',
    isBionic: 'no',
    scale: 1,
    isKeepPDFBackground: 'no',
    paraSpacingValue: configService.getReaderConfig('paraSpacingValue') || '1.5',
    titleSizeValue: '1.2',
  }
}
