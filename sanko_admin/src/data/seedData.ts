import type { AdminDataState } from '@/types/modules'
import { defaultBookMeta, normalizeBooks } from '@/data/bookDefaults'

/** 数据结构变更时递增，自动弃用旧 localStorage 键 */
export const ADMIN_DATA_VERSION = 2
export const ADMIN_DATA_KEY = `sanko_admin_data_v${ADMIN_DATA_VERSION}`

const LEGACY_ADMIN_DATA_KEYS = ['sanko_admin_data', 'sanko_admin_data_v1']

export function purgeLegacyAdminDataKeys() {
  for (const key of LEGACY_ADMIN_DATA_KEYS) {
    localStorage.removeItem(key)
  }
}

export function createSeedData(): AdminDataState {
  return {
    users: [
      { id: 'u001', username: 'reader_a', email: 'a@sanko.local', registeredAt: '2026-01-10', status: '正常' },
      { id: 'u002', username: 'bookworm', email: 'b@sanko.local', registeredAt: '2026-02-03', status: '正常' },
      { id: 'u003', username: 'demo_user', email: 'demo@sanko.local', registeredAt: '2026-03-15', status: '禁用' },
    ],
    books: normalizeBooks([
      defaultBookMeta({
        id: 'b001',
        title: '三体',
        author: '刘慈欣',
        category: '科幻',
        purchaseType: '免费',
        status: 'approved',
        updatedAt: '2026-06-01',
      }),
      defaultBookMeta({
        id: 'b002',
        title: '活着',
        author: '余华',
        category: '文学',
        purchaseType: '积分',
        status: 'approved',
        updatedAt: '2026-05-20',
      }),
      defaultBookMeta({
        id: 'b003',
        title: '小王子',
        author: '圣埃克苏佩里',
        category: '出版',
        purchaseType: '免费',
        status: 'approved',
        updatedAt: '2026-04-12',
      }),
      defaultBookMeta({
        id: 'b004',
        title: '我的学习笔记',
        author: 'reader_a',
        category: '学习资料',
        purchaseType: '免费',
        status: 'pending',
        uploader: 'reader_a',
        uploadedAt: '2026-06-10 15:30',
        updatedAt: '2026-06-10',
        format: 'PDF',
        fileSize: '2.4 MB',
        coverColor: '#457b9d',
        coverTitle: '学习笔记',
        synopsis: '个人整理的高等数学与线性代数复习笔记，含例题与公式汇总。',
        tableOfContents: [
          '第一章 函数与极限',
          '第二章 导数与微分',
          '第三章 积分',
          '附录 公式速查',
        ],
        previewExcerpt:
          '极限是微积分的基础概念。设函数 f(x) 在点 x₀ 的某去心邻域内有定义，如果存在常数 A，对于任意给定的正数 ε，总存在正数 δ，使得当 0 < |x - x₀| < δ 时，|f(x) - A| < ε，则称 A 为函数 f(x) 当 x 趋近于 x₀ 时的极限……',
      }),
      defaultBookMeta({
        id: 'b005',
        title: '原创短篇集',
        author: 'bookworm',
        category: '文学',
        purchaseType: '免费',
        status: 'pending',
        uploader: 'bookworm',
        uploadedAt: '2026-06-09 09:45',
        updatedAt: '2026-06-09',
        format: 'EPUB',
        fileSize: '1.1 MB',
        coverColor: '#6d597a',
        coverTitle: '短篇集',
        synopsis: '作者原创短篇小说合集，共五篇，题材涵盖都市、悬疑与科幻。',
        tableOfContents: ['雨夜', '最后一班地铁', '镜中人', '信', '无人接听'],
        previewExcerpt:
          '雨是从傍晚开始下的。城市的路灯在积水里拉出长长的倒影，她站在公交站台，看着第 17 路车一次次从眼前经过，却始终没有停下。手机屏幕亮了一下，是他在三天前发来的最后一条消息：「别等了。」',
      }),
    ]),
    comments: [
      {
        id: 'c001',
        user: 'reader_a',
        book: '三体',
        content: '非常好看，强力推荐！',
        date: '2026-06-02',
        likes: 30,
        reported: 0,
      },
      {
        id: 'c002',
        user: 'demo_user',
        book: '活着',
        content: '读哭了……',
        date: '2026-05-28',
        likes: 12,
        reported: 1,
      },
      {
        id: 'c003',
        user: 'bookworm',
        book: '小王子',
        content: '经典永不过时。',
        date: '2026-06-08',
        likes: 8,
        reported: 0,
      },
    ],
    pointRecords: [
      { id: 'p001', user: 'reader_a', type: '充值', amount: '+500', balance: 1250, time: '2026-06-10 14:30' },
      { id: 'p002', user: 'bookworm', type: '消费', amount: '-80', balance: 320, time: '2026-06-09 09:15' },
      { id: 'p003', user: 'demo_user', type: '充值', amount: '+100', balance: 100, time: '2026-06-08 18:00' },
    ],
    pointOrders: [
      { id: 'o001', user: 'reader_a', amount: 50, method: '微信', status: '已完成', time: '2026-06-10 14:30' },
      { id: 'o002', user: 'demo_user', amount: 10, method: '支付宝', status: '已完成', time: '2026-06-08 18:00' },
      { id: 'o003', user: 'bookworm', amount: 20, method: '微信', status: '处理中', time: '2026-06-07 11:20' },
    ],
    readingHistory: [
      { id: 'h001', user: 'reader_a', book: '三体', action: '阅读', progress: '45%', time: '2026-06-10 20:10' },
      { id: 'h002', user: 'bookworm', book: '活着', action: '阅读', progress: '100%', time: '2026-06-10 19:00' },
      { id: 'h003', user: 'demo_user', book: '小王子', action: '加入书架', progress: '-', time: '2026-06-09 11:22' },
    ],
    auditLogs: [
      {
        id: 'a001',
        type: 'file',
        target: '我的学习笔记.pdf',
        operator: 'reader_a',
        action: '上传文件',
        detail: '用户上传 EPUB 文件，大小 2.4 MB',
        time: '2026-06-10 15:30',
      },
      {
        id: 'a002',
        type: 'book',
        target: '三体',
        operator: 'admin',
        action: '修改书籍条目',
        detail: '分类由「出版」改为「科幻」',
        time: '2026-06-01 10:00',
      },
      {
        id: 'a003',
        type: 'file',
        target: '原创短篇集.epub',
        operator: 'bookworm',
        action: '上传文件',
        detail: '用户上传 EPUB 文件，大小 1.1 MB',
        time: '2026-06-09 09:45',
      },
      {
        id: 'a004',
        type: 'book',
        target: '活着',
        operator: 'admin',
        action: '修改书籍条目',
        detail: '属性由「免费」改为「积分」',
        time: '2026-05-20 14:20',
      },
    ],
    chatSessions: [
      {
        id: 's001',
        user: 'reader_a',
        source: '首页',
        messageCount: 4,
        lastMessage: '推荐几本科幻书',
        updatedAt: '2026-06-10 21:00',
        messages: [
          { role: 'user', content: '推荐几本科幻书' },
          { role: 'assistant', content: '可以试试《三体》《球状闪电》和《流浪地球》。' },
          { role: 'user', content: '三体讲什么的？' },
          { role: 'assistant', content: '《三体》是刘慈欣的科幻长篇，讲述人类与三体文明的接触。' },
        ],
      },
      {
        id: 's002',
        user: 'bookworm',
        source: '阅读器',
        messageCount: 2,
        lastMessage: '总结第三章',
        updatedAt: '2026-06-10 16:30',
        messages: [
          { role: 'user', content: '总结第三章' },
          { role: 'assistant', content: '第三章主要讲述了主人公面对命运转折的关键情节……' },
        ],
      },
    ],
    chatConfig: {
      enabled: true,
      homeChat: true,
      readerAi: true,
      bookAi: true,
    },
    settings: {
      siteName: 'Sanko Read',
      maintenanceMode: false,
      allowRegister: true,
      announcementEnabled: true,
      announcementTitle: '系统公告',
      announcementContent: '欢迎使用 Sanko 阅读平台。',
    },
  }
}

export function loadPersistedData(): AdminDataState | null {
  const raw = localStorage.getItem(ADMIN_DATA_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AdminDataState
    parsed.books = normalizeBooks(parsed.books ?? [])
    return parsed
  } catch {
    return null
  }
}

export function persistData(data: AdminDataState) {
  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data))
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

export function nextId(prefix: string, existing: { id: string }[]) {
  const nums = existing
    .map((item) => Number.parseInt(item.id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
