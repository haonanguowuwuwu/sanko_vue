import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AdminBook,
  AdminUser,
  AuditLog,
  BookStatus,
  ChatConfig,
  SystemSettings,
} from '@/types/modules'
import {
  ADMIN_DATA_KEY,
  createSeedData,
  loadPersistedData,
  nextId,
  nowStr,
  persistData,
  purgeLegacyAdminDataKeys,
  todayStr,
} from '@/data/seedData'
import { defaultBookMeta } from '@/data/bookDefaults'

function initState() {
  purgeLegacyAdminDataKeys()
  return loadPersistedData() ?? createSeedData()
}

export const useAdminDataStore = defineStore('adminData', () => {
  const data = ref(initState())

  function save() {
    persistData(data.value)
  }

  function addAuditLog(log: Omit<AuditLog, 'id' | 'time'> & { time?: string }) {
    data.value.auditLogs.unshift({
      id: nextId('a', data.value.auditLogs),
      time: log.time ?? nowStr(),
      type: log.type,
      target: log.target,
      operator: log.operator,
      action: log.action,
      detail: log.detail,
    })
    save()
  }

  const dashboardStats = computed(() => [
    { label: '用户总数', value: String(data.value.users.length), sub: '注册用户' },
    {
      label: '书籍总数',
      value: String(data.value.books.filter((b) => b.status === 'approved').length),
      sub: `${data.value.books.filter((b) => b.status === 'pending').length} 本待审核`,
    },
    { label: '评论总数', value: String(data.value.comments.length), sub: '全部评论' },
    { label: 'AI 会话', value: String(data.value.chatSessions.length), sub: '活跃会话' },
  ])

  const pendingBookCount = computed(
    () => data.value.books.filter((b) => b.status === 'pending').length,
  )

  function createUser(payload: Pick<AdminUser, 'username' | 'email'>) {
    const user: AdminUser = {
      id: nextId('u', data.value.users),
      username: payload.username.trim(),
      email: payload.email.trim(),
      registeredAt: todayStr(),
      status: '正常',
    }
    data.value.users.unshift(user)
    addAuditLog({
      type: 'book',
      target: user.username,
      operator: 'admin',
      action: '新建用户',
      detail: `创建用户 ${user.username}`,
    })
    save()
    return user
  }

  function updateUser(id: string, patch: Pick<AdminUser, 'username' | 'email'>) {
    const user = data.value.users.find((u) => u.id === id)
    if (!user) return
    user.username = patch.username.trim()
    user.email = patch.email.trim()
    addAuditLog({
      type: 'book',
      target: user.username,
      operator: 'admin',
      action: '编辑用户',
      detail: '更新用户资料',
    })
    save()
  }

  function toggleUserStatus(id: string) {
    const user = data.value.users.find((u) => u.id === id)
    if (!user) return
    user.status = user.status === '正常' ? '禁用' : '正常'
    addAuditLog({
      type: 'book',
      target: user.username,
      operator: 'admin',
      action: user.status === '禁用' ? '禁用用户' : '启用用户',
      detail: `用户状态变更为 ${user.status}`,
    })
    save()
  }

  function filterUsers(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.users
    return data.value.users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    )
  }

  function getBookById(id: string) {
    return data.value.books.find((b) => b.id === id) ?? null
  }

  function createBook(
    payload: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>,
  ) {
    const book = defaultBookMeta({
      id: nextId('b', data.value.books),
      ...payload,
      status: 'approved',
      updatedAt: todayStr(),
    })
    data.value.books.unshift(book)
    addAuditLog({
      type: 'book',
      target: book.title,
      operator: 'admin',
      action: '新建书籍',
      detail: `管理员创建书籍《${book.title}》`,
    })
    save()
    return book
  }

  function updateBook(
    id: string,
    patch: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>,
  ) {
    const book = data.value.books.find((b) => b.id === id)
    if (!book) return
    const before = `${book.title} / ${book.category} / ${book.purchaseType}`
    Object.assign(book, patch)
    book.updatedAt = todayStr()
    addAuditLog({
      type: 'book',
      target: book.title,
      operator: 'admin',
      action: '修改书籍条目',
      detail: `由「${before}」更新为「${book.title} / ${book.category} / ${book.purchaseType}」`,
    })
    save()
  }

  function setBookStatus(id: string, status: BookStatus, rejectReason?: string) {
    const book = data.value.books.find((b) => b.id === id)
    if (!book) return
    book.status = status
    book.updatedAt = todayStr()
    if (status === 'rejected') {
      book.rejectReason = rejectReason?.trim() || '未填写原因'
    } else if (status === 'approved') {
      book.rejectReason = undefined
    }
    const actionMap: Record<BookStatus, string> = {
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
      action: actionMap[status],
      detail,
    })
    save()
  }

  function approveBook(id: string) {
    setBookStatus(id, 'approved')
  }

  function rejectBook(id: string, reason: string) {
    setBookStatus(id, 'rejected', reason)
  }

  function filterBooks(keyword: string, status?: BookStatus | 'all') {
    let list = data.value.books
    if (status && status !== 'all') {
      list = list.filter((b) => b.status === status)
    }
    const q = keyword.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q),
    )
  }

  function deleteComment(id: string) {
    const idx = data.value.comments.findIndex((c) => c.id === id)
    if (idx === -1) return
    const [removed] = data.value.comments.splice(idx, 1)
    if (removed) {
      addAuditLog({
        type: 'book',
        target: removed.book,
        operator: 'admin',
        action: '删除评论',
        detail: `删除用户 ${removed.user} 的评论`,
      })
    }
    save()
  }

  function filterComments(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.comments
    return data.value.comments.filter(
      (c) =>
        c.user.toLowerCase().includes(q) ||
        c.book.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q),
    )
  }

  function filterPointRecords(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.pointRecords
    return data.value.pointRecords.filter((r) => r.user.toLowerCase().includes(q))
  }

  function filterPointOrders(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.pointOrders
    return data.value.pointOrders.filter((o) => o.user.toLowerCase().includes(q))
  }

  function filterReadingHistory(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.readingHistory
    return data.value.readingHistory.filter(
      (h) =>
        h.user.toLowerCase().includes(q) ||
        h.book.toLowerCase().includes(q) ||
        h.action.toLowerCase().includes(q),
    )
  }

  function filterAuditLogs(keyword: string, type?: AuditLog['type'] | 'all') {
    let list = data.value.auditLogs
    if (type && type !== 'all') {
      list = list.filter((l) => l.type === type)
    }
    const q = keyword.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (l) =>
        l.target.toLowerCase().includes(q) ||
        l.operator.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q),
    )
  }

  function filterChatSessions(keyword: string) {
    const q = keyword.trim().toLowerCase()
    if (!q) return data.value.chatSessions
    return data.value.chatSessions.filter(
      (s) =>
        s.user.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q),
    )
  }

  function saveChatConfig(config: ChatConfig) {
    data.value.chatConfig = { ...config }
    addAuditLog({
      type: 'book',
      target: 'AI 配置',
      operator: 'admin',
      action: '更新 AI 配置',
      detail: `AI 总开关: ${config.enabled ? '开' : '关'}`,
    })
    save()
  }

  function saveSettings(settings: SystemSettings) {
    data.value.settings = { ...settings }
    addAuditLog({
      type: 'book',
      target: settings.siteName,
      operator: 'admin',
      action: '更新系统设置',
      detail: settings.announcementEnabled ? '已更新公告' : '已更新基本设置',
    })
    save()
  }

  function resetAllData() {
    purgeLegacyAdminDataKeys()
    localStorage.removeItem(ADMIN_DATA_KEY)
    data.value = createSeedData()
  }

  return {
    data,
    dashboardStats,
    pendingBookCount,
    save,
    createUser,
    updateUser,
    toggleUserStatus,
    filterUsers,
    createBook,
    updateBook,
    getBookById,
    setBookStatus,
    approveBook,
    rejectBook,
    filterBooks,
    deleteComment,
    filterComments,
    filterPointRecords,
    filterPointOrders,
    filterReadingHistory,
    filterAuditLogs,
    filterChatSessions,
    saveChatConfig,
    saveSettings,
    resetAllData,
  }
})
