import { request } from './request'
import type { AdminLoginResult, AdminProfile } from '@/types/admin'
import type {
  AdminBook,
  AdminComment,
  AdminDataState,
  AdminUser,
  AuditLog,
  BookStatus,
  ChatConfig,
  ChatSession,
  PointOrder,
  PointRecord,
  ReadingHistory,
  SystemSettings,
} from '@/types/modules'

export interface DashboardStat {
  label: string
  value: string
  sub: string
}

export const adminApi = {
  login(body: { username: string; password: string }) {
    return request<AdminLoginResult>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  logout() {
    return request<null>('/api/admin/auth/logout', { method: 'POST' })
  },

  me() {
    return request<AdminProfile>('/api/admin/auth/me')
  },

  updateProfile(body: Pick<AdminProfile, 'username' | 'email'>) {
    return request<AdminProfile>('/api/admin/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  changePassword(body: { current: string; next: string }) {
    return request<null>('/api/admin/auth/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  bootstrap() {
    return request<AdminDataState>('/api/admin/bootstrap')
  },

  dashboardStats() {
    return request<DashboardStat[]>('/api/admin/dashboard/stats')
  },

  listUsers(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<AdminUser[]>(`/api/admin/users${q}`)
  },

  createUser(body: Pick<AdminUser, 'username' | 'email'>) {
    return request<AdminUser>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateUser(id: string, body: Pick<AdminUser, 'username' | 'email'>) {
    return request<AdminUser>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  toggleUserStatus(id: string) {
    return request<AdminUser>(`/api/admin/users/${id}/toggle-status`, { method: 'POST' })
  },

  listBooks(keyword = '', status?: BookStatus | 'all') {
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (status && status !== 'all') params.set('status', status)
    const q = params.toString()
    return request<AdminBook[]>(`/api/admin/books${q ? `?${q}` : ''}`)
  },

  getBook(id: string) {
    return request<AdminBook>(`/api/admin/books/${id}`)
  },

  createBook(body: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>) {
    return request<AdminBook>('/api/admin/books', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateBook(id: string, body: Pick<AdminBook, 'title' | 'author' | 'category' | 'purchaseType'>) {
    return request<AdminBook>(`/api/admin/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  approveBook(id: string) {
    return request<AdminBook>(`/api/admin/books/${id}/approve`, { method: 'POST' })
  },

  rejectBook(id: string, reason: string) {
    return request<AdminBook>(`/api/admin/books/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  offlineBook(id: string) {
    return request<AdminBook>(`/api/admin/books/${id}/offline`, { method: 'POST' })
  },

  listComments(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<AdminComment[]>(`/api/admin/comments${q}`)
  },

  deleteComment(id: string) {
    return request<null>(`/api/admin/comments/${id}`, { method: 'DELETE' })
  },

  listPointRecords(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<PointRecord[]>(`/api/admin/points/records${q}`)
  },

  listPointOrders(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<PointOrder[]>(`/api/admin/points/orders${q}`)
  },

  listReadingHistory(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<ReadingHistory[]>(`/api/admin/history/reading${q}`)
  },

  listAuditLogs(keyword = '', type?: AuditLog['type'] | 'all') {
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (type && type !== 'all') params.set('type', type)
    const q = params.toString()
    return request<AuditLog[]>(`/api/admin/history/audit-logs${q ? `?${q}` : ''}`)
  },

  listChatSessions(keyword = '') {
    const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
    return request<ChatSession[]>(`/api/admin/chat/sessions${q}`)
  },

  getChatSession(id: string) {
    return request<ChatSession>(`/api/admin/chat/sessions/${id}`)
  },

  getChatConfig() {
    return request<ChatConfig>('/api/admin/chat/config')
  },

  saveChatConfig(config: ChatConfig) {
    return request<ChatConfig>('/api/admin/chat/config', {
      method: 'PATCH',
      body: JSON.stringify(config),
    })
  },

  getSettings() {
    return request<SystemSettings>('/api/admin/settings')
  },

  saveSettings(settings: SystemSettings) {
    return request<SystemSettings>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    })
  },
}
