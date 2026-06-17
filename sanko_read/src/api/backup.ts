import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { BackupResult } from '@/api/types'
import {
  mockCreateBackupPayload,
  mockDelay,
  mockResetFromBackup,
  mockState,
} from '@/api/mock/state'
import { exportJson } from '@/utils/exportData'

export async function createBackup(): Promise<BackupResult> {
  if (USE_MOCK) {
    const payload = mockCreateBackupPayload()
    exportJson(`sanko-backup-${Date.now()}.json`, payload)
    return mockDelay({ message: '备份已下载到本地' })
  }
  return request<BackupResult>('/api/backup', { method: 'POST' })
}

export async function restoreBackup(file: File): Promise<BackupResult> {
  if (USE_MOCK) {
    const text = await file.text()
    const data = JSON.parse(text) as ReturnType<typeof mockCreateBackupPayload>
    mockResetFromBackup({
      books: data.books ?? [],
      trashedBooks: data.trashedBooks ?? [],
      favoriteIds: data.favoriteIds ?? [],
      shelves: data.shelves ?? [],
      highlights: data.highlights ?? [],
      bookmarks: data.bookmarks ?? [],
      settings: data.settings ?? mockState.settings,
    })
    return mockDelay({ message: '已从本地备份恢复' })
  }

  const form = new FormData()
  form.append('file', file)
  return request<BackupResult>('/api/restore', { method: 'POST', body: form })
}
