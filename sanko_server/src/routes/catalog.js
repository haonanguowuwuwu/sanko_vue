import { Router } from 'express'
import { ok, fail } from '../response.js'
import { catalogBooks, catalogFilters, santiBook } from '../seed.js'
import { findCatalogBook, store } from '../store.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import {
  findCommentById,
  getBookComments,
  isCommentLiked,
  likeKey,
} from '../utils/catalogComments.js'

const router = Router()

function bookMatchesBlockedTags(book) {
  const blocked = store.blockedTags
  if (!blocked.size) return false
  return (book.tags ?? []).some((tag) => blocked.has(tag))
}

function filterCatalogList(list) {
  return list.filter((b) => !bookMatchesBlockedTags(b))
}

function formatDate() {
  return new Date().toISOString().slice(0, 10)
}

function bookRequiresPurchase(book) {
  return book?.purchaseType === 'paid'
}

function isCatalogBookPurchased(bookId) {
  return store.purchasedCatalogIds.has(bookId)
}

function ensureCatalogAccess(book, res) {
  if (bookRequiresPurchase(book) && !isCatalogBookPurchased(book.id)) {
    fail(res, '请先使用积分购买此书', 403, 403)
    return false
  }
  return true
}

router.get('/purchases', requireAuth, (_req, res) => {
  res.json(ok([...store.purchasedCatalogIds]))
})

router.post('/books/:id/purchase', requireAuth, (req, res) => {
  const book = findCatalogBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  if (!bookRequiresPurchase(book)) {
    return fail(res, '该书无需购买')
  }
  if (isCatalogBookPurchased(book.id)) {
    return res.json(ok({ purchased: true, balance: store.pointsSummary.balance }))
  }
  const price = book.pointsPrice ?? 0
  if (store.pointsSummary.balance < price) {
    return fail(res, '积分不足', 400)
  }
  store.pointsSummary.balance -= price
  store.pointsSummary.totalUsed += price
  store.purchasedCatalogIds.add(book.id)
  const orderId = `ORD${Date.now()}`
  store.pointsOrders.unshift({
    id: orderId,
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    type: 'use',
    change: -price,
    balance: store.pointsSummary.balance,
    description: `购买《${book.title}》电子书`,
    status: 'completed',
  })
  res.json(ok({ purchased: true, balance: store.pointsSummary.balance, orderId }))
})

router.get('/home', (_req, res) => {
  const featured = filterCatalogList(catalogBooks).map(({ comments: _c, ...book }) => book)
  res.json(
    ok({
      featured,
    }),
  )
})

router.get('/filters', (_req, res) => {
  res.json(ok(catalogFilters))
})

router.get('/blocked-tags', requireAuth, (_req, res) => {
  res.json(ok([...store.blockedTags]))
})

router.put('/blocked-tags', requireAuth, (req, res) => {
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map(String) : []
  store.blockedTags = new Set(tags)
  res.json(ok([...store.blockedTags]))
})

router.get('/books', optionalAuth, (req, res) => {
  let list = filterCatalogList([...catalogBooks])
  const { category, attr, tags } = req.query
  if (attr === 'free') list = list.filter((b) => b.purchaseType === 'free')
  if (attr === 'paid') list = list.filter((b) => b.purchaseType === 'paid')
  if (tags && tags !== 'all') {
    const tag = String(tags)
    if (store.blockedTags.has(tag)) {
      list = []
    } else {
      list = list.filter((b) => b.tags?.includes(tag))
    }
  }
  if (category && category !== 'all') {
    list = list.filter((b) => b.id === santiBook.id || b.id.startsWith('f'))
  }
  const items = list.map(({ comments: _c, ...book }) => book)
  res.json(
    ok({
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    }),
  )
})

router.get('/books/:bookId/comments', (req, res) => {
  const book = findCatalogBook(req.params.bookId)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  const comments = getBookComments(req.params.bookId)
  res.json(ok({ items: comments, total: comments.length, page: 1, pageSize: comments.length }))
})

router.post('/books/:bookId/comments', requireAuth, (req, res) => {
  const book = findCatalogBook(req.params.bookId)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  const content = String(req.body?.content ?? '').trim()
  if (!content) return fail(res, '评论内容不能为空')
  const comment = {
    id: `c-${Date.now()}`,
    user: req.user.username,
    content,
    date: formatDate(),
    likes: 0,
    replyCount: 0,
    replies: [],
  }
  const rating = Number(req.body?.rating)
  if (rating >= 1 && rating <= 5) comment.rating = rating
  getBookComments(req.params.bookId).unshift(comment)
  res.json(ok(comment))
})

router.post('/comments/:id/replies', requireAuth, (req, res) => {
  const found = findCommentById(req.params.id)
  if (!found || found.parent) return fail(res, '评论不存在', 404, 404)
  const content = String(req.body?.content ?? '').trim()
  if (!content) return fail(res, '回复内容不能为空')
  const reply = {
    id: `r-${Date.now()}`,
    user: req.user.username,
    content,
    date: formatDate(),
    likes: 0,
    replyCount: 0,
  }
  if (!found.comment.replies) found.comment.replies = []
  found.comment.replies.push(reply)
  found.comment.replyCount = found.comment.replies.length
  res.json(ok(reply))
})

router.post('/comments/:id/like', requireAuth, (req, res) => {
  const found = findCommentById(req.params.id)
  if (!found) return fail(res, '评论不存在', 404, 404)
  const key = likeKey(req.user.id, req.params.id)
  if (!store.commentLikes.has(key)) {
    store.commentLikes.add(key)
    found.comment.likes += 1
  }
  res.json(ok(null))
})

router.delete('/comments/:id/like', requireAuth, (req, res) => {
  const found = findCommentById(req.params.id)
  if (!found) return fail(res, '评论不存在', 404, 404)
  const key = likeKey(req.user.id, req.params.id)
  if (store.commentLikes.has(key)) {
    store.commentLikes.delete(key)
    found.comment.likes = Math.max(0, found.comment.likes - 1)
  }
  res.json(ok(null))
})

router.post('/comments/:id/report', requireAuth, (req, res) => {
  const found = findCommentById(req.params.id)
  if (!found) return fail(res, '评论不存在', 404, 404)
  res.json(ok(null))
})

router.get('/books/:id', (req, res) => {
  const book = findCatalogBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  res.json(ok({ ...book, comments: getBookComments(req.params.id) }))
})

router.post('/books/:id/editions/:editionId/download', requireAuth, (req, res) => {
  const book = findCatalogBook(req.params.id)
  if (!book) return fail(res, '书籍不存在', 404, 404)
  if (!ensureCatalogAccess(book, res)) return
  const edition = book.editions?.find((e) => e.id === req.params.editionId)
  if (!edition) return fail(res, '版本不存在', 404, 404)
  const base = `${req.protocol}://${req.get('host')}`
  const format = edition.format.toUpperCase()
  const demoFile =
    format === 'PDF' ? 'demo.pdf' : format === 'TXT' ? 'demo.txt' : 'demo.epub'
  res.json(
    ok({
      message: `已开始下载 ${edition.format}（${edition.fileSize}）`,
      edition,
      downloadUrl: `${base}/files/${demoFile}`,
    }),
  )
})

export default router
