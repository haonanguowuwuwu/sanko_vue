const EXT_TO_FORMAT = {
  epub: 'EPUB',
  pdf: 'PDF',
  txt: 'TXT',
  mobi: 'MOBI',
  azw3: 'AZW3',
  docx: 'DOCX',
  md: 'MD',
}

export function parseFormatFromFileName(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_FORMAT[ext] ?? null
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function contentTypeForFormat(format) {
  switch (format?.toUpperCase()) {
    case 'PDF':
      return 'application/pdf'
    case 'TXT':
    case 'MD':
      return 'text/plain; charset=utf-8'
    case 'EPUB':
    case 'MOBI':
    case 'AZW3':
      return 'application/epub+zip'
    default:
      return 'application/octet-stream'
  }
}
