function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportJson(filename: string, data: unknown) {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json')
}

export function recordsToMarkdown(
  title: string,
  records: { bookTitle: string; quote: string; note?: string; createdAt: string }[],
) {
  const lines = [`# ${title}`, '']
  records.forEach((r, i) => {
    lines.push(`## ${i + 1}. ${r.bookTitle}`)
    lines.push(`> ${r.quote}`)
    if (r.note?.trim()) lines.push('', r.note.trim())
    lines.push('', `*${r.createdAt}*`, '')
  })
  return lines.join('\n')
}

export function recordsToCsv(
  records: { bookTitle: string; quote: string; note?: string; createdAt: string }[],
) {
  const header = 'bookTitle,quote,note,createdAt'
  const rows = records.map((r) =>
    [r.bookTitle, r.quote, r.note ?? '', r.createdAt]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )
  return [header, ...rows].join('\n')
}

export function recordsToPlainText(
  title: string,
  records: { bookTitle: string; quote: string; note?: string; createdAt: string }[],
) {
  const lines = [title, '='.repeat(title.length), '']
  records.forEach((r, i) => {
    lines.push(`${i + 1}. [${r.bookTitle}] ${r.createdAt}`)
    lines.push(r.quote)
    if (r.note?.trim()) lines.push(`笔记：${r.note.trim()}`)
    lines.push('')
  })
  return lines.join('\n')
}

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'txt'

export function exportRecords(
  basename: string,
  format: ExportFormat,
  title: string,
  records: { bookTitle: string; quote: string; note?: string; createdAt: string }[],
) {
  switch (format) {
    case 'json':
      exportJson(`${basename}.json`, records)
      break
    case 'markdown':
      downloadFile(`${basename}.md`, recordsToMarkdown(title, records), 'text/markdown')
      break
    case 'csv':
      downloadFile(`${basename}.csv`, recordsToCsv(records), 'text/csv')
      break
    case 'txt':
      downloadFile(`${basename}.txt`, recordsToPlainText(title, records), 'text/plain')
      break
  }
}
