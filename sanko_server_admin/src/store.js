import { createSeedData, DEFAULT_ADMIN } from './seed.js'
import { applyBookContent } from './bookContent.js'
import { nextId, nowStr, todayStr } from './utils.js'

function cloneSeed() {
  return structuredClone(createSeedData())
}

/** 把 bookContent.js 中的正文合并进内存书籍（保留 status 等运行时字段） */
export function syncBookContent() {
  store.books = store.books.map((book) => {
    const enriched = applyBookContent(book)
    return {
      ...book,
      previewExcerpt: enriched.previewExcerpt,
      fullContent: enriched.fullContent,
    }
  })
}

export const store = {
  sessions: new Map(),
  adminProfile: { ...DEFAULT_ADMIN },
  ...cloneSeed(),
}

syncBookContent()

export function resetStore() {
  const fresh = cloneSeed()
  store.sessions.clear()
  store.adminProfile = { ...DEFAULT_ADMIN }
  Object.assign(store, fresh)
  syncBookContent()
}

export function addAuditLog(log) {
  store.auditLogs.unshift({
    id: nextId('a', store.auditLogs),
    time: nowStr(),
    ...log,
  })
}

export function getDashboardStats() {
  const pending = store.books.filter((b) => b.status === 'pending').length
  return [
    { label: '用户总数', value: String(store.users.length), sub: '注册用户' },
    {
      label: '书籍总数',
      value: String(store.books.filter((b) => b.status === 'approved').length),
      sub: `${pending} 本待审核`,
    },
    { label: '评论总数', value: String(store.comments.length), sub: '全部评论' },
    { label: 'AI 会话', value: String(store.chatSessions.length), sub: '活跃会话' },
  ]
}

export function findBook(id) {
  return store.books.find((b) => b.id === id) ?? null
}

export function findUser(id) {
  return store.users.find((u) => u.id === id) ?? null
}

export function exportBootstrap() {
  return {
    users: store.users,
    books: store.books,
    comments: store.comments,
    pointRecords: store.pointRecords,
    pointOrders: store.pointOrders,
    readingHistory: store.readingHistory,
    auditLogs: store.auditLogs,
    chatSessions: store.chatSessions,
    chatConfig: store.chatConfig,
    settings: store.settings,
  }
}

export { todayStr, nextId }
