export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface UserInfo {
  id: string
  username: string
  email?: string
  registeredAt?: string
}

export interface AuthResult {
  token: string
  user: UserInfo
}

export interface BookmarkRecord {
  id: string
  bookId: string
  spreadIndex: number
}

export interface ChatMessageDto {
  role: 'user' | 'assistant'
  content: string
}

/** 聊天请求来源页面 */
export type ChatSource = 'home' | 'book' | 'reader'

export interface ChatRequest {
  message: string
  history?: ChatMessageDto[]
  /** 标明从哪个页面发起 */
  source: ChatSource
  /** 从书籍相关页面发起时携带 */
  bookId?: string
}

export interface ChatResponse {
  reply: string
}

export interface BackupResult {
  downloadUrl?: string
  message: string
}

export interface AppSettingsDto {
  disableRecycleBin: boolean
  hideBookshelfBooks: boolean
  directDeleteFromShelf: boolean
  noPdfCoverAsBookCover: boolean
  noCropBookCovers: boolean
  showBookshelfBookCount: boolean
  enableSoftwareProtection: boolean
}

export class ApiError extends Error {
  code: number

  constructor(message: string, code = -1) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
