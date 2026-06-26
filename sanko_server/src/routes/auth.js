import { Router } from 'express'
import { ok, fail } from '../response.js'
import { store } from '../store.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  if (!username || !password) {
    return fail(res, '请输入用户名和密码')
  }
  const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const user = { id: `user-${Date.now()}`, username }
  store.sessions.set(token, user)
  res.json(ok({ token, user }))
})

router.post('/logout', requireAuth, (_req, res) => {
  const header = _req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) store.sessions.delete(token)
  res.json(ok(null))
})

router.get('/me', optionalAuth, (req, res) => {
  if (!req.user) {
    return fail(res, '未登录', 401, 401)
  }
  res.json(
    ok({
      ...req.user,
      email: `${req.user.username}@sanko.local`,
      registeredAt: '2026-01-15',
    }),
  )
})

export default router
