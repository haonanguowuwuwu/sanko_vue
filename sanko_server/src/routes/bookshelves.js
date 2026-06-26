import { Router } from 'express'
import { ok, fail } from '../response.js'
import { store } from '../store.js'

let shelfCounter = 10

const cloneShelves = () => store.shelves.map((s) => ({ ...s, bookIds: [...s.bookIds] }))

const router = Router()

router.get('/', (_req, res) => {
  res.json(ok(cloneShelves()))
})

router.post('/', (req, res) => {
  const name = String(req.body?.name ?? '').trim() || '新书架'
  const shelf = { id: `shelf-${shelfCounter++}`, name, bookIds: [] }
  store.shelves.push(shelf)
  res.json(ok({ ...shelf, bookIds: [] }))
})

router.put('/reorder', (req, res) => {
  const orderedIds = req.body?.orderedIds ?? []
  const map = new Map(store.shelves.map((s) => [s.id, s]))
  store.shelves = orderedIds.map((id) => map.get(id)).filter(Boolean)
  res.json(ok(cloneShelves()))
})

router.patch('/:id', (req, res) => {
  const shelf = store.shelves.find((s) => s.id === req.params.id)
  if (!shelf) return fail(res, '书架不存在', 404, 404)
  if (req.body?.name) shelf.name = String(req.body.name).trim()
  res.json(ok({ ...shelf, bookIds: [...shelf.bookIds] }))
})

router.delete('/:id', (req, res) => {
  store.shelves = store.shelves.filter((s) => s.id !== req.params.id)
  res.json(ok(null))
})

router.post('/:id/books', (req, res) => {
  const shelf = store.shelves.find((s) => s.id === req.params.id)
  const bookId = req.body?.bookId
  if (!shelf || !bookId) return fail(res, '参数错误')
  if (!shelf.bookIds.includes(bookId)) shelf.bookIds.push(bookId)
  res.json(ok(null))
})

router.delete('/:id/books/:bookId', (req, res) => {
  const shelf = store.shelves.find((s) => s.id === req.params.id)
  if (!shelf) return fail(res, '书架不存在', 404, 404)
  shelf.bookIds = shelf.bookIds.filter((id) => id !== req.params.bookId)
  res.json(ok(null))
})

export default router
