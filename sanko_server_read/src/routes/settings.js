import { Router } from 'express'
import { ok } from '../response.js'
import { store } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(ok({ ...store.settings }))
})

router.patch('/', (req, res) => {
  Object.assign(store.settings, req.body ?? {})
  res.json(ok({ ...store.settings }))
})

export default router
