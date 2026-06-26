import { Router } from 'express'
import { ok } from '../response.js'
import { store } from '../store.js'

const router = Router()

router.get('/summary', (_req, res) => {
  res.json(ok({ ...store.pointsSummary }))
})

router.get('/orders', (req, res) => {
  let items = [...store.pointsOrders]
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.max(1, Number(req.query.pageSize) || 10)
  const total = items.length
  const start = (page - 1) * pageSize
  items = items.slice(start, start + pageSize)
  res.json(ok({ items, total, page, pageSize }))
})

router.post('/recharge', (req, res) => {
  const amount = Number(req.body?.amount ?? 0)
  const points = Math.floor(amount * 10)
  store.pointsSummary.balance += points
  store.pointsSummary.totalEarned += points
  const order = {
    id: `ORD${Date.now()}`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    type: 'recharge',
    change: points,
    balance: store.pointsSummary.balance,
    description: `积分充值-${req.body?.channel ?? '测试'}`,
    status: 'completed',
  }
  store.pointsOrders.unshift(order)
  res.json(ok({ orderId: order.id, balance: store.pointsSummary.balance }))
})

export default router
