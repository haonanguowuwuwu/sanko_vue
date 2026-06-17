export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface UserInfo {
  id: string
  username: string
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

export interface ChatRequest {
  message: string
  history?: ChatMessageDto[]
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
