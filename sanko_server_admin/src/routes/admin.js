import { Router } from 'express'
import { ok, fail } from '../response.js'
import {
  store,
  addAuditLog,
  exportBootstrap,
  getDashboardStats,
  findBook,
  findUser,
  todayStr,
  nextId,
} from '../store.js'
import { applyBookContent } from '../bookContent.js'
import { filterByKeyword } from '../utils.js'
import { requireAdminAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAdminAuth)

router.get('/bootstrap', (_req, res) => {
  res.json(ok(exportBootstrap()))
})

router.get('/dashboard/stats', (_req, res) => {
  res.json(ok(getDashboardStats()))
})

router.get('/users', (req, res) => {
  const list = filterByKeyword(store.users, req.query.keyword, ['username', 'email', 'id'])
  res.json(ok(list))
})

router.post('/users', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const email = String(req.body?.email ?? '').trim()
  if (!username || !email) {
    return fail(res, '请填写用户名和邮箱')
  }
  const user = {
    id: nextId('u', store.users),
    username,
    email,
    registeredAt: todayStr(),
    status: '正常',
  }
  store.users.unshift(user)
  addAuditLog({
    type: 'book',
    target: user.username,
    operator: 'admin',
    action: '新建用户',
    detail: `创建用户 ${user.username}`,
  })
  res.json(ok(user))
})

router.patch('/users/:id', (req, res) => {
  const user = findUser(req.params.id)
  if (!user) return fail(res, '用户不存在', 404, 404)
  const username = String(req.body?.username ?? user.username).trim()
  const email = String(req.body?.email ?? user.email).trim()
  if (username === user.username && email === user.email) {
    return res.json(ok(user))
  }
  user.username = username
  user.email = email
  addAuditLog({
    type: 'book',
    target: user.username,
    operator: 'admin',
    action: '编辑用户',
    detail: '更新用户资料',
  })
  res.json(ok(user))
})

router.post('/users/:id/toggle-status', (req, res) => {
  const user = findUser(req.params.id)
  if (!user) return fail(res, '用户不存在', 404, 404)
  user.status = user.status === '正常' ? '禁用' : '正常'
  addAuditLog({
    type: 'book',
    target: user.username,
    operator: 'admin',
    action: user.status === '禁用' ? '禁用用户' : '启用用户',
    detail: `用户状态变更为 ${user.status}`,
  })
  res.json(ok(user))
})

router.get('/books', (req, res) => {
  const status = req.query.status
  let list = store.books
  if (status && status !== 'all') {
    list = list.filter((b) => b.status === status)
  }
  list = filterByKeyword(list, req.query.keyword, ['title', 'author', 'id'])
  res.json(ok(list))
})

router.get('/books/:id', (req, res) => {
  const book = findBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  res.json(ok(book))
})

router.post('/books', (req, res) => {
  const title = String(req.body?.title ?? '').trim()
  const author = String(req.body?.author ?? '').trim()
  const category = String(req.body?.category ?? '').trim()
  const purchaseType = String(req.body?.purchaseType ?? '免费').trim()
  if (!title || !author) {
    return fail(res, '请填写书名和作者')
  }
  const book = applyBookContent({
    id: nextId('b', store.books),
    title,
    author,
    category: category || '未分类',
    purchaseType,
    status: 'approved',
    updatedAt: todayStr(),
    format: 'EPUB',
    fileSize: '1.0 MB',
    coverColor: '#457b9d',
    coverTitle: title.slice(0, 6),
    synopsis: '暂无简介',
    tableOfContents: ['第一章'],
    previewExcerpt: '正文预览暂无。',
    fullContent: '正文预览暂无。',
  })
  store.books.unshift(book)
  addAuditLog({
    type: 'book',
    target: book.title,
    operator: 'admin',
    action: '新建书籍',
    detail: `管理员创建书籍《${book.title}》`,
  })
  res.json(ok(book))
})

router.patch('/books/:id', (req, res) => {
  const book = findBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  const next = {
    title: req.body?.title != null ? String(req.body.title).trim() : book.title,
    author: req.body?.author != null ? String(req.body.author).trim() : book.author,
    category: req.body?.category != null ? String(req.body.category).trim() : book.category,
    purchaseType:
      req.body?.purchaseType != null ? String(req.body.purchaseType).trim() : book.purchaseType,
  }
  const unchanged =
    next.title === book.title &&
    next.author === book.author &&
    next.category === book.category &&
    next.purchaseType === book.purchaseType
  if (unchanged) {
    return res.json(ok(book))
  }
  const before = `${book.title} / ${book.category} / ${book.purchaseType}`
  book.title = next.title
  book.author = next.author
  book.category = next.category
  book.purchaseType = next.purchaseType
  book.updatedAt = todayStr()
  addAuditLog({
    type: 'book',
    target: book.title,
    operator: 'admin',
    action: '修改书籍条目',
    detail: `由「${before}」更新为「${book.title} / ${book.category} / ${book.purchaseType}」`,
  })
  res.json(ok(book))
})

function setBookStatus(book, status, rejectReason) {
  book.status = status
  book.updatedAt = todayStr()
  if (status === 'rejected') {
    book.rejectReason = rejectReason?.trim() || '未填写原因'
  } else if (status === 'approved') {
    delete book.rejectReason
  }
  const actionMap = {
    pending: '重新提交审核',
    approved: '审核通过',
    rejected: '审核驳回',
    offline: '下架书籍',
  }
  const detail =
    status === 'rejected' && book.rejectReason
      ? `书籍《${book.title}》已驳回，原因：${book.rejectReason}`
      : `书籍《${book.title}》状态变更为 ${status}`
  addAuditLog({
    type: 'book',
    target: book.title,
    operator: 'admin',
    action: actionMap[status] ?? '更新书籍状态',
    detail,
  })
}

router.post('/books/:id/approve', (req, res) => {
  const book = findBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  setBookStatus(book, 'approved')
  res.json(ok(book))
})

router.post('/books/:id/reject', (req, res) => {
  const book = findBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  const reason = String(req.body?.reason ?? '')
  if (!reason.trim()) {
    return fail(res, '请填写驳回原因')
  }
  setBookStatus(book, 'rejected', reason)
  res.json(ok(book))
})

router.post('/books/:id/offline', (req, res) => {
  const book = findBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  setBookStatus(book, 'offline')
  res.json(ok(book))
})

router.get('/comments', (req, res) => {
  const list = filterByKeyword(store.comments, req.query.keyword, ['user', 'book', 'content'])
  res.json(ok(list))
})

router.delete('/comments/:id', (req, res) => {
  const idx = store.comments.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return fail(res, '评论不存在', 404, 404)
  const [removed] = store.comments.splice(idx, 1)
  addAuditLog({
    type: 'book',
    target: removed.book,
    operator: 'admin',
    action: '删除评论',
    detail: `删除用户 ${removed.user} 的评论`,
  })
  res.json(ok(null))
})

router.get('/points/records', (req, res) => {
  const list = filterByKeyword(store.pointRecords, req.query.keyword, ['user'])
  res.json(ok(list))
})

router.get('/points/orders', (req, res) => {
  const list = filterByKeyword(store.pointOrders, req.query.keyword, ['user'])
  res.json(ok(list))
})

router.get('/history/reading', (req, res) => {
  const list = filterByKeyword(store.readingHistory, req.query.keyword, ['user', 'book', 'action'])
  res.json(ok(list))
})

router.get('/history/audit-logs', (req, res) => {
  const type = req.query.type
  let list = store.auditLogs
  if (type && type !== 'all') {
    list = list.filter((l) => l.type === type)
  }
  list = filterByKeyword(list, req.query.keyword, ['target', 'operator', 'action', 'detail'])
  res.json(ok(list))
})

router.get('/chat/sessions', (req, res) => {
  const list = filterByKeyword(store.chatSessions, req.query.keyword, ['user', 'lastMessage', 'source'])
  res.json(ok(list))
})

router.get('/chat/sessions/:id', (req, res) => {
  const session = store.chatSessions.find((s) => s.id === req.params.id)
  if (!session) return fail(res, '会话不存在', 404, 404)
  res.json(ok(session))
})

router.get('/chat/config', (_req, res) => {
  res.json(ok(store.chatConfig))
})

router.patch('/chat/config', (req, res) => {
  store.chatConfig = { ...store.chatConfig, ...req.body }
  addAuditLog({
    type: 'book',
    target: 'AI 配置',
    operator: 'admin',
    action: '更新 AI 配置',
    detail: `AI 总开关: ${store.chatConfig.enabled ? '开' : '关'}`,
  })
  res.json(ok(store.chatConfig))
})

router.get('/settings', (_req, res) => {
  res.json(ok(store.settings))
})

router.patch('/settings', (req, res) => {
  store.settings = { ...store.settings, ...req.body }
  addAuditLog({
    type: 'book',
    target: store.settings.siteName,
    operator: 'admin',
    action: '更新系统设置',
    detail: store.settings.announcementEnabled ? '已更新公告' : '已更新基本设置',
  })
  res.json(ok(store.settings))
})

export default router
