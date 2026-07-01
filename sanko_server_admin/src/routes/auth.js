import { Router } from 'express'
import crypto from 'node:crypto'
import { ok, fail } from '../response.js'
import { store, addAuditLog } from '../store.js'
import { nowStr } from '../utils.js'
import { requireAdminAuth } from '../middleware/auth.js'

const router = Router()

function publicProfile() {
  const { password: _, ...rest } = store.adminProfile
  return rest
}

function createToken() {
  return crypto.randomBytes(24).toString('hex')
}

router.post('/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  if (!username || !password) {
    return fail(res, '请输入用户名和密码')
  }
  if (username !== store.adminProfile.username || password !== store.adminProfile.password) {
    return fail(res, '用户名或密码错误', 401, 401)
  }
  const token = createToken()
  const lastLoginAt = nowStr()
  store.adminProfile.lastLoginAt = lastLoginAt
  store.sessions.set(token, { id: store.adminProfile.id, username: store.adminProfile.username })
  res.json(
    ok({
      token,
      profile: {
        id: store.adminProfile.id,
        username: store.adminProfile.username,
        email: store.adminProfile.email,
        role: store.adminProfile.role,
        lastLoginAt,
      },
    }),
  )
})

router.post('/logout', requireAdminAuth, (req, res) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  store.sessions.delete(token)
  res.json(ok(null))
})

router.get('/me', requireAdminAuth, (req, res) => {
  res.json(
    ok({
      id: store.adminProfile.id,
      username: store.adminProfile.username,
      email: store.adminProfile.email,
      role: store.adminProfile.role,
      lastLoginAt: store.adminProfile.lastLoginAt ?? nowStr(),
    }),
  )
})

router.patch('/profile', requireAdminAuth, (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const email = String(req.body?.email ?? '').trim()
  if (!username) {
    return fail(res, '用户名不能为空')
  }
  store.adminProfile.username = username
  store.adminProfile.email = email
  addAuditLog({
    type: 'book',
    target: username,
    operator: 'admin',
    action: '更新个人资料',
    detail: '管理员更新了账号资料',
  })
  res.json(ok(publicProfile()))
})

router.patch('/password', requireAdminAuth, (req, res) => {
  const current = String(req.body?.current ?? '')
  const next = String(req.body?.next ?? '')
  if (!current || !next) {
    return fail(res, '请填写完整密码信息')
  }
  if (current !== store.adminProfile.password) {
    return fail(res, '当前密码不正确')
  }
  store.adminProfile.password = next
  addAuditLog({
    type: 'book',
    target: store.adminProfile.username,
    operator: 'admin',
    action: '修改密码',
    detail: '管理员修改了登录密码',
  })
  res.json(ok(null, '密码已更新'))
})

export default router
