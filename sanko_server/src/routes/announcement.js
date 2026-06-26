import { Router } from 'express'
import { ok } from '../response.js'

const router = Router()

const LATEST = {
  id: 'ann-1',
  title: '公告',
  content:
    '欢迎来到 sanko 云端书城！\n\n' +
    '· 登录后可同步书架、阅读进度与积分\n' +
    '· 分类页支持标签筛选与屏蔽\n' +
    '· 书籍介绍页可查看评分、评论，并使用 AI 助手\n\n' +
    '祝你阅读愉快！',
}

router.get('/latest', (_req, res) => {
  res.json(ok({ ...LATEST }))
})

export default router
