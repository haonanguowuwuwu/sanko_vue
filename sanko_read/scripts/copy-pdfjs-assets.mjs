import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pdfjsRoot = join(root, 'node_modules', 'pdfjs-dist')
const dest = join(root, 'public', 'lib', 'pdfjs')

if (!existsSync(pdfjsRoot)) {
  console.warn('[copy-pdfjs-assets] pdfjs-dist not installed, skipping')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
cpSync(join(pdfjsRoot, 'cmaps'), join(dest, 'cmaps'), { recursive: true })
cpSync(join(pdfjsRoot, 'standard_fonts'), join(dest, 'standard_fonts'), { recursive: true })

const cssFiles = ['text_layer_builder.css', 'annotation_layer_builder.css']
const cssBase =
  'https://raw.githubusercontent.com/mozilla/pdf.js/v4.10.38/web'

for (const file of cssFiles) {
  const target = join(dest, file)
  if (existsSync(target)) continue
  const response = await fetch(`${cssBase}/${file}`)
  if (!response.ok) {
    throw new Error(`Failed to download ${file}: ${response.status}`)
  }
  writeFileSync(target, await response.text())
}

console.log('[copy-pdfjs-assets] pdf.js static assets ready')
