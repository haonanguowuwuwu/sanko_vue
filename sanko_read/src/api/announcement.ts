import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import { mockDelay } from '@/api/mock/state'

export interface Announcement {
  id: string
  title: string
  content: string
}

const MOCK_ANNOUNCEMENT: Announcement = {
  id: 'ann-1',
  title: '公告',
  content:
    '欢迎来到 sanko 云端书城！\n\n' +
    '· 登录后可同步书架、阅读进度与积分\n' +
    '· 分类页支持标签筛选与屏蔽\n' +
    '· 书籍介绍页可查看评分、评论，并使用 AI 助手\n\n' +
    '祝你阅读愉快！',
}

export async function fetchLatestAnnouncement(): Promise<Announcement> {
  if (USE_MOCK) {
    return mockDelay({ ...MOCK_ANNOUNCEMENT })
  }
  return request<Announcement>('/api/announcement/latest')
}
