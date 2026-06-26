import { Router } from 'express'
import { ok, fail } from '../response.js'
import { catalogBooks, catalogFilters, santiBook } from '../seed.js'
import { findCatalogBook } from '../store.js'

const router = Router()

router.get('/home', (_req, res) => {
  res.json(
    ok({
      featured: catalogBooks,
    }),
  )
})

router.get('/filters', (_req, res) => {
  res.json(ok(catalogFilters))
})

router.get('/books', (req, res) => {
  let list = [...catalogBooks]
  const { category, attr, tags } = req.query
  if (attr === 'free') list = list.filter((b) => b.purchaseType === 'free')
  if (attr === 'paid') list = list.filter((b) => b.purchaseType === 'paid')
  if (tags && tags !== 'all') {
    const tag = String(tags)
    list = list.filter((b) => b.tags?.includes(tag))
  }
  if (category && category !== 'all') {
    // 占位：真实后端可按 category 字段筛选
    list = list.filter((b) => b.id === santiBook.id || b.id.startsWith('f'))
  }
  res.json(
    ok({
      items: list,
      total: list.length,
      page: 1,
      pageSize: list.length,
    }),
  )
})

router.get('/books/:id', (req, res) => {
  const book = findCatalogBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  res.json(ok(book))
})

router.post('/books/:id/editions/:editionId/download', (req, res) => {
  const book = findCatalogBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  const edition = book.editions?.find((e) => e.id === req.params.editionId)
  if (!edition) return fail(res, '版本不存在', 404, 404)
  res.json(
    ok({
      message: `已开始下载 ${edition.format}（${edition.fileSize}）`,
      edition,
    }),
  )
})

export default router
