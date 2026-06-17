import { USE_MOCK } from '@/api/config'
import { request, setStoredToken } from '@/api/request'
import type { AuthResult, UserInfo } from '@/api/types'
import { mockDelay, mockState } from '@/api/mock/state'

export async function login(username: string, password: string): Promise<AuthResult> {
  if (USE_MOCK) {
    const name = username.trim() || '用户'
    if (!password.trim()) {
      throw new Error('请输入密码')
    }
    mockState.token = `mock-token-${Date.now()}`
    mockState.username = name
    const result: AuthResult = {
      token: mockState.token,
      user: { id: 'mock-user', username: name },
    }
    setStoredToken(result.token)
    return mockDelay(result)
  }

  const result = await request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  })
  setStoredToken(result.token)
  return result
}

export async function logout(): Promise<void> {
  if (USE_MOCK) {
    mockState.token = null
    mockState.username = null
    setStoredToken(null)
    return mockDelay(undefined)
  }

  await request<void>('/api/auth/logout', { method: 'POST' })
  setStoredToken(null)
}

export async function fetchMe(): Promise<UserInfo | null> {
  if (USE_MOCK) {
    if (!mockState.token || !mockState.username) return mockDelay(null)
    return mockDelay({ id: 'mock-user', username: mockState.username })
  }

  try {
    return await request<UserInfo>('/api/auth/me')
  } catch {
    setStoredToken(null)
    return null
  }
}
