import { Router } from 'express'
import { ok, fail } from '../response.js'
import { store } from '../store.js'

const router = Router()

router.get('/', (req, res) => {
  const bookId = req.query.bookId
  const list = bookId
    ? store.bookmarks.filter((b) => b.bookId === bookId)
    : [...store.bookmarks]
  res.json(ok(list))
})

router.post('/', (req, res) => {
  const bookmark = {
    ...req.body,
    id: `bm-${Date.now()}`,
  }
  store.bookmarks.push(bookmark)
  res.json(ok(bookmark))
})

router.delete('/:id', (req, res) => {
  store.bookmarks = store.bookmarks.filter((b) => b.id !== req.params.id)
  res.json(ok(null))
})

export default router
