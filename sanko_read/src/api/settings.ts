import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { AppSettingsDto } from '@/api/types'
import { mockDelay, mockState } from '@/api/mock/state'

export async function fetchSettings(): Promise<AppSettingsDto> {
  if (USE_MOCK) {
    return mockDelay({ ...mockState.settings })
  }
  return request<AppSettingsDto>('/api/settings')
}

export async function updateSettings(payload: Partial<AppSettingsDto>): Promise<AppSettingsDto> {
  if (USE_MOCK) {
    Object.assign(mockState.settings, payload)
    return mockDelay({ ...mockState.settings })
  }
  return request<AppSettingsDto>('/api/settings', { method: 'PATCH', body: payload })
}

export function syncMockSettings(settings: AppSettingsDto) {
  if (!USE_MOCK) return
  mockState.settings = { ...settings } as AppSettingsDto
}
