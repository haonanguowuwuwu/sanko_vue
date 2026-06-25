/**
 * 生成 public/sample-books/ 下的演示用书文件（EPUB / PDF / DOCX）。
 * 运行：node scripts/generate-sample-books.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/sample-books')

const chapters = [
  {
    id: 'ch1',
    title: '欢迎使用 Sanko 阅读器',
    paragraphs: [
      '这是 Sanko 阅读器的演示样本书，用于展示 EPUB、PDF、DOCX 等格式的阅读效果。',
      '你可以尝试划词高亮、添加笔记、添加书签，并在侧边栏查看目录与标注列表。',
      '本内容为演示专用，篇幅不长，方便快速浏览各项功能。',
    ],
  },
  {
    id: 'ch2',
    title: '阅读与标注',
    paragraphs: [
      '选中一段文字后，会出现工具栏：可选择颜色高亮，或打开笔记对话框写下想法。',
      '高亮会保存在「高亮」页面；带笔记内容的标注会出现在「笔记」页面。',
      '点击列表中的条目，可以跳转回原文对应位置继续阅读。',
    ],
  },
  {
    id: 'ch3',
    title: '继续探索',
    paragraphs: [
      '你可以导入自己的 PDF、EPUB、DOCX、TXT 等文件到书库中阅读。',
      '阅读进度、书签和标注会保存在本地；刷新页面后仍可查看高亮与笔记。',
      '感谢使用 Sanko，祝阅读愉快。',
    ],
  },
]

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chapterXhtml(chapter) {
  const body = chapter.paragraphs.map((p) => `<p>${escapeXml(p)}</p>`).join('\n    ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(chapter.title)}</h1>
  ${body}
</body>
</html>`
}

async function buildEpub() {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  zip.file(
    'OEBPS/style.css',
    `body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.8; margin: 1.2em; }
h1 { font-size: 1.4em; margin-bottom: 0.8em; }
p { margin: 0 0 1em; text-indent: 2em; }`,
  )

  const manifestItems = chapters
    .map(
      (ch, i) =>
        `<item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join('\n    ')
  const spineItems = chapters.map((ch) => `<itemref idref="${ch.id}"/>`).join('\n    ')
  const navItems = chapters
    .map(
      (ch, i) =>
        `<li><a href="${ch.id}.xhtml">${escapeXml(ch.title)}</a></li>`,
    )
    .join('\n      ')

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Sanko 阅读器演示</dc:title>
    <dc:language>zh-CN</dc:language>
    <dc:creator>Sanko</dc:creator>
    <meta property="dcterms:modified">2026-06-25T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`,
  )

  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-CN">
<head><meta charset="UTF-8"/><title>目录</title></head>
<body>
  <nav epub:type="toc"><ol>
      ${navItems}
  </ol></nav>
</body>
</html>`,
  )

  for (const chapter of chapters) {
    zip.file(`OEBPS/${chapter.id}.xhtml`, chapterXhtml(chapter))
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  fs.writeFileSync(path.join(outDir, 'demo.epub'), buffer)
  console.log('wrote demo.epub', buffer.length, 'bytes')
}

async function buildDocx() {
  const zip = new JSZip()
  const bodyParts = chapters
    .flatMap((ch) => [
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(ch.title)}</w:t></w:r></w:p>`,
      ...ch.paragraphs.map(
        (p) =>
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`,
      ),
    ])
    .join('')

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  )
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
  )
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyParts}<w:sectPr/></w:body>
</w:document>`,
  )

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  fs.writeFileSync(path.join(outDir, 'demo.docx'), buffer)
  console.log('wrote demo.docx', buffer.length, 'bytes')
}

function pdfEscape(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf() {
  const pageTexts = chapters.map((ch) => `${ch.title}\n\n${ch.paragraphs.join('\n\n')}`)
  const pageCount = pageTexts.length
  const fontObjNum = 3 + pageCount * 2
  const totalObjs = fontObjNum
  const parts = ['%PDF-1.4\n']
  const offsets = [0]

  const pushObj = (num, body) => {
    offsets[num] = Buffer.byteLength(parts.join(''), 'utf8')
    parts.push(`${num} 0 obj\n${body}\nendobj\n`)
  }

  pushObj(1, '<< /Type /Catalog /Pages 2 0 R >>')

  const kids = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(' ')
  pushObj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`)

  for (let i = 0; i < pageCount; i++) {
    const pageObjNum = 3 + i * 2
    const contentObjNum = 4 + i * 2
    const lines = pageTexts[i].split('\n')
    const streamParts = ['BT', '/F1 12 Tf', '1 0 0 1 50 750 Tm']
    for (const line of lines) {
      streamParts.push(`(${pdfEscape(line || ' ')}) Tj`)
      streamParts.push('0 -16 Td')
    }
    streamParts.push('ET')
    const stream = streamParts.join('\n')

    pushObj(
      pageObjNum,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`,
    )
    pushObj(contentObjNum, `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
  }

  pushObj(fontObjNum, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let pdf = parts.join('')
  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${totalObjs + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= totalObjs; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  fs.writeFileSync(path.join(outDir, 'demo.pdf'), pdf, 'utf8')
  console.log('wrote demo.pdf', Buffer.byteLength(pdf, 'utf8'), 'bytes')
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  await buildEpub()
  await buildDocx()
  buildPdf()
  console.log('Sample books generated in', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
