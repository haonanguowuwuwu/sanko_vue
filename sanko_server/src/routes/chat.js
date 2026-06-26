import { Router } from 'express'
import { ok } from '../response.js'

const router = Router()

router.post('/', (req, res) => {
  const { message, source, bookId } = req.body ?? {}
  const text = String(message ?? '').trim()
  let reply = '这是一个很好的问题！'

  if (source === 'home') {
    reply = `（来自首页）我可以帮你找书、总结内容或讨论观点。你问的是：「${text}」`
  } else if (source === 'book' || source === 'reader') {
    reply = `（来自书籍 ${bookId ?? '未知'}）关于「${text}」，建议结合本书内容理解。`
  } else {
    reply = `（source=${source ?? '未指定'}）${reply}`
  }

  res.json(ok({ reply }))
})

export default router
