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
