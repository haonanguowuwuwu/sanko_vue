import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { ok, fail } from '../response.js'
import { store, findPersonalBook } from '../store.js'
import { requireAuth } from '../middleware/auth.js'
import { contentTypeForFormat, formatFileSize, parseFormatFromFileName } from '../utils/fileHelpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../../uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      cb(null, `${req.params.id}${ext}`)
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const SAMPLE_IMPORT_TEMPLATES = [
  {
    title: '《雅思词汇真经》',
    author: '刘洪波',
    coverColor: '#e86c1a',
    coverTitle: '雅思词汇真经',
    format: 'PDF',
    fileSize: '12.6 MB',
    category: '学习资料',
  },
  {
    title: '《高等数学（上册）》',
    author: '同济大学数学系',
    coverColor: '#1a5fb4',
    coverTitle: '高等数学',
    format: 'PDF',
    fileSize: '28.3 MB',
    category: '学习资料',
  },
]

const router = Router()

function purgeBook(id) {
  store.personalBooks = store.personalBooks.filter((b) => b.id !== id)
  store.trashedBooks = store.trashedBooks.filter((b) => b.id !== id)
  store.favoriteIds.delete(id)
  store.bookFormats.delete(id)
  const uploaded = store.bookFiles.get(id)
  if (uploaded) {
    store.bookFiles.delete(id)
    fs.unlink(path.join(uploadsDir, uploaded.storedName), () => {})
  }
  store.shelves.forEach((shelf) => {
    shelf.bookIds = shelf.bookIds.filter((bid) => bid !== id)
  })
}

router.use(requireAuth)

router.post('/', (req, res) => {
  const body = req.body ?? {}
  const existing = findPersonalBook(body.id)
  if (existing) {
    return res.json(ok({ ...existing }))
  }
  const book = {
    id: body.id ?? `book-${Date.now()}`,
    title: body.title ?? '未命名',
    author: body.author ?? '未知',
    progress: body.progress ?? 0,
    coverColor: body.coverColor ?? '#5a7a6a',
    coverTitle: body.coverTitle ?? body.title ?? '书',
    fileSize: body.fileSize ?? '—',
    format: body.format ?? '—',
    addedAt: body.addedAt ?? new Date().toISOString().slice(0, 10),
    category: body.category ?? '未分类',
    lastReadAt: body.lastReadAt,
  }
  store.personalBooks.push(book)
  if (book.format && book.format !== '—') {
    store.bookFormats.set(book.id, book.format.toUpperCase())
  }
  res.json(ok(book))
})

router.get('/', (_req, res) => {
  res.json(ok([...store.personalBooks]))
})

router.get('/reading-history', (_req, res) => {
  const list = store.personalBooks
    .filter((b) => b.lastReadAt || b.progress > 0)
    .sort((a, b) => {
      const ta = a.lastReadAt ?? ''
      const tb = b.lastReadAt ?? ''
      return tb.localeCompare(ta)
    })
  res.json(ok(list))
})

router.get('/trash', (_req, res) => {
  res.json(ok([...store.trashedBooks]))
})

router.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase()
  const matched = store.personalBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q),
  )
  res.json(ok(matched))
})

router.post('/import', importUpload.single('file'), (req, res) => {
  const today = new Date().toISOString().slice(0, 10)

  if (req.file) {
    const format = parseFormatFromFileName(req.file.originalname)
    if (!format) {
      return fail(res, `暂不支持该文件格式：.${req.file.originalname.split('.').pop() ?? ''}`)
    }
    const rawTitle = req.file.originalname.replace(/\.[^.]+$/, '')
    const title = rawTitle.startsWith('《') ? rawTitle : `《${rawTitle}》`
    const id = `book-${Date.now()}`
    const ext = path.extname(req.file.originalname) || '.bin'
    const storedName = `${id}${ext}`
    fs.writeFileSync(path.join(uploadsDir, storedName), req.file.buffer)
    const book = {
      id,
      title,
      author: '本地导入',
      progress: 0,
      coverColor: '#5a7a6a',
      coverTitle: rawTitle.replace(/^《|》$/g, ''),
      fileSize: formatFileSize(req.file.size),
      format,
      addedAt: today,
      category: '本地导入',
    }
    store.personalBooks.push(book)
    store.bookFormats.set(id, format)
    store.bookFiles.set(id, {
      storedName,
      format,
      fileSize: book.fileSize,
    })
    return res.json(ok(book))
  }

  const importedTitles = new Set([
    ...store.personalBooks.map((b) => b.title),
    ...store.trashedBooks.map((b) => b.title),
  ])
  const template = SAMPLE_IMPORT_TEMPLATES.find((s) => !importedTitles.has(s.title))
  if (!template) {
    return fail(res, '所有样本书籍已导入完毕')
  }

  const id = `book-${Date.now()}`
  const book = {
    id,
    title: template.title,
    author: template.author,
    progress: 0,
    coverColor: template.coverColor,
    coverTitle: template.coverTitle,
    fileSize: template.fileSize,
    format: template.format,
    addedAt: today,
    category: template.category,
  }
  store.personalBooks.push(book)
  store.bookFormats.set(id, template.format)
  res.json(ok(book))
})

router.get('/:id', (req, res) => {
  const book = findPersonalBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  res.json(ok({ ...book }))
})

router.patch('/:id/progress', (req, res) => {
  const book = findPersonalBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  if (typeof req.body?.progress === 'number') book.progress = req.body.progress
  if (req.body?.lastReadAt) book.lastReadAt = req.body.lastReadAt
  res.json(ok({ ...book }))
})

router.post('/:id/file', upload.single('file'), (req, res) => {
  const book = findPersonalBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  if (!req.file) return fail(res, '请上传文件')

  const format = parseFormatFromFileName(req.file.originalname)
  if (!format) {
    fs.unlink(req.file.path, () => {})
    return fail(res, `暂不支持该文件格式：.${req.file.originalname.split('.').pop() ?? ''}`)
  }

  const storedName = req.file.filename
  store.bookFiles.set(book.id, {
    storedName,
    format,
    fileSize: formatFileSize(req.file.size),
  })
  book.format = format
  book.fileSize = formatFileSize(req.file.size)
  store.bookFormats.set(book.id, format)

  res.json(ok({ ...book }))
})

router.delete('/:id', (req, res) => {
  const book = findPersonalBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  purgeBook(req.params.id)
  res.json(ok(null))
})

const DEMO_FORMAT_FILE = {
  EPUB: 'demo.epub',
  PDF: 'demo.pdf',
  TXT: 'demo.txt',
  MOBI: 'demo.epub',
  AZW3: 'demo.epub',
  DOCX: 'demo.txt',
}

router.get('/:id/file-url', (req, res) => {
  const book = findPersonalBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)

  const format = String(
    req.query.format ?? store.bookFormats.get(book.id) ?? book.format ?? 'EPUB',
  ).toUpperCase()

  const base = `${req.protocol}://${req.get('host')}`
  const expiresAt = new Date(Date.now() + 3600_000).toISOString()

  const uploaded = store.bookFiles.get(book.id)
  if (uploaded) {
    return res.json(
      ok({
        url: `${base}/files/uploads/${uploaded.storedName}`,
        expiresAt,
        contentType: contentTypeForFormat(uploaded.format),
        contentLength: undefined,
      }),
    )
  }

  const fileName = DEMO_FORMAT_FILE[format] ?? 'demo.epub'
  res.json(
    ok({
      url: `${base}/files/${fileName}`,
      expiresAt,
      contentType: contentTypeForFormat(format),
    }),
  )
})

export default router
