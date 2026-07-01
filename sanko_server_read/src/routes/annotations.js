import { Router } from 'express'
import { ok, fail } from '../response.js'
import { store } from '../store.js'

const router = Router()

router.get('/', (req, res) => {
  const bookId = req.query.bookId
  const list = bookId
    ? store.highlights.filter((h) => h.bookId === bookId)
    : [...store.highlights]
  res.json(ok(list))
})

router.post('/', (req, res) => {
  const highlight = {
    ...req.body,
    id: `hl-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  store.highlights.push(highlight)
  res.json(ok(highlight))
})

router.patch('/:id', (req, res) => {
  const item = store.highlights.find((h) => h.id === req.params.id)
  if (!item) return fail(res, '标注不存在', 404, 404)
  Object.assign(item, req.body)
  res.json(ok({ ...item }))
})

router.delete('/:id', (req, res) => {
  store.highlights = store.highlights.filter((h) => h.id !== req.params.id)
  res.json(ok(null))
})

export default router
