export type UserStatus = '正常' | '禁用'

export interface AdminUser {
  id: string
  username: string
  email: string
  registeredAt: string
  status: UserStatus
}

export type BookStatus = 'pending' | 'approved' | 'rejected' | 'offline'

export interface AdminBook {
  id: string
  title: string
  author: string
  category: string
  purchaseType: string
  status: BookStatus
  uploader?: string
  uploadedAt?: string
  updatedAt: string
  format: string
  fileSize: string
  coverColor: string
  coverTitle: string
  synopsis: string
  tableOfContents: string[]
  previewExcerpt: string
  rejectReason?: string
}

export interface AdminComment {
  id: string
  user: string
  book: string
  content: string
  date: string
  likes: number
  reported: number
}

export interface PointRecord {
  id: string
  user: string
  type: string
  amount: string
  balance: number
  time: string
}

export interface PointOrder {
  id: string
  user: string
  amount: number
  method: string
  status: string
  time: string
}

export interface ReadingHistory {
  id: string
  user: string
  book: string
  action: string
  progress: string
  time: string
}

export type AuditLogType = 'file' | 'book'

export interface AuditLog {
  id: string
  type: AuditLogType
  target: string
  operator: string
  action: string
  detail: string
  time: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSession {
  id: string
  user: string
  source: string
  messageCount: number
  lastMessage: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface ChatConfig {
  enabled: boolean
  homeChat: boolean
  readerAi: boolean
  bookAi: boolean
}

export interface SystemSettings {
  siteName: string
  maintenanceMode: boolean
  allowRegister: boolean
  announcementEnabled: boolean
  announcementTitle: string
  announcementContent: string
}

export interface AdminDataState {
  users: AdminUser[]
  books: AdminBook[]
  comments: AdminComment[]
  pointRecords: PointRecord[]
  pointOrders: PointOrder[]
  readingHistory: ReadingHistory[]
  auditLogs: AuditLog[]
  chatSessions: ChatSession[]
  chatConfig: ChatConfig
  settings: SystemSettings
}
