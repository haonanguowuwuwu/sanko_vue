import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { CatalogBook } from '@/types/catalog'
import { getCatalogBook } from '@/data/catalogBooks'
import { mockDelay } from '@/api/mock/state'

export async function fetchCatalogBook(id: string): Promise<CatalogBook | null> {
  if (USE_MOCK) {
    return mockDelay(getCatalogBook(id) ?? null)
  }
  try {
    return await request<CatalogBook>(`/api/catalog/books/${id}`)
  } catch {
    return null
  }
}

export async function downloadCatalogEdition(bookId: string, editionId: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(undefined)
    return
  }
  await request<void>(`/api/catalog/books/${bookId}/editions/${editionId}/download`, {
    method: 'POST',
  })
}
