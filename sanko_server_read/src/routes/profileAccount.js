import { Router } from 'express'
import { ok } from '../response.js'
import { store } from '../store.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/account', requireAuth, (req, res) => {
  res.json(
    ok({
      id: req.user.id,
      username: req.user.username,
      email: `${req.user.username}@sanko.local`,
      registeredAt: '2026-01-15',
      pointsBalance: store.pointsSummary.balance,
    }),
  )
})

export default router
