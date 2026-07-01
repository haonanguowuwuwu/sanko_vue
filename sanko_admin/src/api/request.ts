import { API_BASE_URL } from './config'
import { ADMIN_TOKEN_KEY } from '@/types/admin'

export class ApiError extends Error {
  code: number

  constructor(message: string, code = 400) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: 'no-store',
    })
    let payload: ApiEnvelope<T> | null = null
    try {
      payload = (await res.json()) as ApiEnvelope<T>
    } catch {
      throw new ApiError(res.ok ? '响应解析失败' : `请求失败 (${res.status})`, res.status)
    }

    if (!res.ok || payload.code !== 0) {
      throw new ApiError(payload.message || '请求失败', payload.code || res.status)
    }
    return payload.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，请确认 sanko_server_admin 已启动', 0)
    }
    throw new ApiError('无法连接后端，请确认 sanko_server_admin 已启动 (8084)', 0)
  } finally {
    clearTimeout(timeout)
  }
}
