import { Router } from 'express'
import { ok } from '../response.js'
import { store } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(ok([...store.favoriteIds]))
})

router.post('/:bookId', (req, res) => {
  store.favoriteIds.add(req.params.bookId)
  res.json(ok(null))
})

router.delete('/:bookId', (req, res) => {
  store.favoriteIds.delete(req.params.bookId)
  res.json(ok(null))
})

export default router
