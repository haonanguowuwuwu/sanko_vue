import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { adminApi } from '@/api/admin'
import type {
  AdminBook,
  AdminDataState,
  AdminUser,
  AuditLog,
  BookStatus,
  ChatConfig,
  SystemSettings,
} from '@/types/modules'

const emptyState = (): AdminDataState => ({
  users: [],
  books: [],
  comments: [],
  pointRecords: [],
  pointOrders: [],
  readingHistory: [],
  auditLogs: [],
  chatSessions: [],
  chatConfig: { enabled: true, homeChat: true, readerAi: true, bookAi: true },
  settings: {
    siteName: 'Sanko Read',
    maintenanceMode: false,
    allowRegister: true,
    announcementEnabled: false,
    announcementTitle: '',
    announcementContent: '',
  },
})

export const useAdminDataStore = defineStore('adminData', () => {
  const data = ref<AdminDataState>(emptyState())
  const loaded = ref(false)
  const loading = ref(false)

  async function reloadBootstrap() {
    loading.value = true
    try {
      data.value = await adminApi.bootstrap()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadBootstrap() {
    await reloadBootstrap()
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

  async function createUser(payload: Pick<AdminUser, 'username' | 'email'>) {
    await adminApi.createUser(payload)
    await reloadBootstrap()
    return data.value.users[0] ?? null
  }

  async function updateUser(id: string, patch: Pick<AdminUser, 'username' | 'email'>) {
    await adminApi.updateUser(id, patch)
    await reloadBootstrap()
  }

  async function toggleUserStatus(id: string) {
    await adminApi.toggleUserStatus(id)
    await reloadBootstrap()
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

  async function fetchBook(id: string): Promise<AdminBook | null> {
    try {
      const book = await adminApi.getBook(id)
      const idx = data.value.books.findIndex((b) => b.id === id)
      if (idx >= 0) {
        data.value.books[idx] = book
      } else {
        data.value.books.push(book)
      }
      return book
    } catch {
      return getBookById(id)
    }
  }

  async function createBook(
    payload: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>,
  ) {
    await adminApi.createBook(payload)
    await reloadBootstrap()
    return data.value.books[0] ?? null
  }

  async function updateBook(
    id: string,
    patch: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>,
  ) {
    await adminApi.updateBook(id, patch)
    await reloadBootstrap()
  }

  async function setBookStatus(id: string, status: BookStatus, rejectReason?: string) {
    if (status === 'approved') {
      await adminApi.approveBook(id)
    } else if (status === 'rejected') {
      await adminApi.rejectBook(id, rejectReason ?? '')
    } else if (status === 'offline') {
      await adminApi.offlineBook(id)
    }
    await reloadBootstrap()
  }

  async function approveBook(id: string) {
    await setBookStatus(id, 'approved')
  }

  async function rejectBook(id: string, reason: string) {
    await setBookStatus(id, 'rejected', reason)
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

  async function deleteComment(id: string) {
    await adminApi.deleteComment(id)
    await reloadBootstrap()
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

  async function saveChatConfig(config: ChatConfig) {
    await adminApi.saveChatConfig(config)
    await reloadBootstrap()
  }

  async function saveSettings(settings: SystemSettings) {
    await adminApi.saveSettings(settings)
    await reloadBootstrap()
  }

  return {
    data,
    loaded,
    loading,
    dashboardStats,
    pendingBookCount,
    loadBootstrap,
    reloadBootstrap,
    createUser,
    updateUser,
    toggleUserStatus,
    filterUsers,
    createBook,
    updateBook,
    getBookById,
    fetchBook,
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
  }
})
