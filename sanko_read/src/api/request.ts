import { API_BASE_URL, TOKEN_STORAGE_KEY } from '@/api/config'
import type { ApiResponse } from '@/api/types'
import { ApiError } from '@/api/types'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: customHeaders, ...rest } = options

  const headers = new Headers(customHeaders)

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getStoredToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  })

  if (response.status === 401) {
    setStoredToken(null)
    throw new ApiError('未登录或登录已过期', 401)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(response.statusText || '请求失败', response.status)
    }
    return undefined as T
  }

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || payload.code !== 0) {
    throw new ApiError(payload.message || '请求失败', payload.code ?? response.status)
  }

  return payload.data
}
