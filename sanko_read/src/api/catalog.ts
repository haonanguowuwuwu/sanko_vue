import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { CatalogBook } from '@/types/catalog'
import { featuredBooks, getCatalogBook } from '@/data/catalogBooks'
import { mockDelay } from '@/api/mock/state'

export interface CatalogHomeData {
  featured: CatalogBook[]
}

export interface CatalogBookPage {
  items: CatalogBook[]
  total: number
  page: number
  pageSize: number
}

export interface CatalogFilters {
  categories: { label: string; value: string }[]
  attrs: { label: string; value: string }[]
  tags: string[]
}

export async function fetchCatalogHome(): Promise<CatalogHomeData> {
  if (USE_MOCK) {
    return mockDelay({ featured: featuredBooks })
  }
  return request<CatalogHomeData>('/api/catalog/home')
}

export async function fetchCatalogFilters(): Promise<CatalogFilters> {
  if (USE_MOCK) {
    return mockDelay({
      categories: [
        { label: '全部', value: 'all' },
        { label: '男生', value: 'male' },
        { label: '女生', value: 'female' },
        { label: '出版', value: 'publish' },
      ],
      attrs: [
        { label: '全部', value: 'all' },
        { label: '无需积分购买', value: 'free' },
        { label: '需要积分购买', value: 'paid' },
      ],
      tags: ['豪门', '孤儿', '宠物', '种田文', '无敌文'],
    })
  }
  return request<CatalogFilters>('/api/catalog/filters')
}

export async function fetchCatalogBooks(params: {
  category?: string
  attr?: string
  tags?: string
  page?: number
  pageSize?: number
}): Promise<CatalogBookPage> {
  if (USE_MOCK) {
    return mockDelay({
      items: featuredBooks,
      total: featuredBooks.length,
      page: 1,
      pageSize: featuredBooks.length,
    })
  }
  const query = new URLSearchParams()
  if (params.category) query.set('category', params.category)
  if (params.attr) query.set('attr', params.attr)
  if (params.tags) query.set('tags', params.tags)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  const qs = query.toString()
  return request<CatalogBookPage>(`/api/catalog/books${qs ? `?${qs}` : ''}`)
}

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
