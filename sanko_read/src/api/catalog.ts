import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { CatalogBook, CatalogComment } from '@/types/catalog'
import { featuredBooks, getCatalogBook } from '@/data/catalogBooks'
import { mockDelay, mockState } from '@/api/mock/state'

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

export interface CatalogCommentPage {
  items: CatalogComment[]
  total: number
  page: number
  pageSize: number
}

function mockCommentsForBook(bookId: string): CatalogComment[] {
  if (!mockState.catalogComments.has(bookId)) {
    const book = getCatalogBook(bookId)
    mockState.catalogComments.set(
      bookId,
      book?.comments ? JSON.parse(JSON.stringify(book.comments)) : [],
    )
  }
  return mockState.catalogComments.get(bookId)!
}

function mockFilterBooks(list: CatalogBook[]) {
  if (!mockState.blockedTags.size) return list
  return list.filter(
    (b) => !(b.tags ?? []).some((tag) => mockState.blockedTags.has(tag)),
  )
}

export async function fetchCatalogHome(): Promise<CatalogHomeData> {
  if (USE_MOCK) {
    return mockDelay({ featured: mockFilterBooks([...featuredBooks]) })
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
    let items = mockFilterBooks([...featuredBooks])
    if (params.tags && params.tags !== 'all') {
      if (mockState.blockedTags.has(params.tags)) {
        items = []
      } else {
        items = items.filter((b) => b.tags?.includes(params.tags!))
      }
    }
    if (params.attr === 'free') items = items.filter((b) => b.purchaseType === 'free')
    if (params.attr === 'paid') items = items.filter((b) => b.purchaseType === 'paid')
    return mockDelay({
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
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

export async function fetchBlockedTags(): Promise<string[]> {
  if (USE_MOCK) {
    return mockDelay([...mockState.blockedTags])
  }
  return request<string[]>('/api/catalog/blocked-tags')
}

export async function updateBlockedTags(tags: string[]): Promise<string[]> {
  if (USE_MOCK) {
    mockState.blockedTags = new Set(tags)
    return mockDelay([...mockState.blockedTags])
  }
  return request<string[]>('/api/catalog/blocked-tags', { method: 'PUT', body: { tags } })
}

export async function fetchCatalogComments(bookId: string): Promise<CatalogCommentPage> {
  if (USE_MOCK) {
    const items = mockCommentsForBook(bookId)
    return mockDelay({ items, total: items.length, page: 1, pageSize: items.length })
  }
  return request<CatalogCommentPage>(`/api/catalog/books/${bookId}/comments`)
}

export async function postCatalogComment(bookId: string, content: string): Promise<CatalogComment> {
  if (USE_MOCK) {
    const comment: CatalogComment = {
      id: `c-${Date.now()}`,
      user: mockState.username ?? '用户',
      content,
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      replyCount: 0,
      replies: [],
    }
    mockCommentsForBook(bookId).unshift(comment)
    return mockDelay(comment)
  }
  return request<CatalogComment>(`/api/catalog/books/${bookId}/comments`, {
    method: 'POST',
    body: { content },
  })
}

export async function postCommentReply(commentId: string, content: string): Promise<CatalogComment> {
  if (USE_MOCK) {
    for (const [, list] of mockState.catalogComments) {
      for (const comment of list) {
        if (comment.id === commentId) {
          const reply: CatalogComment = {
            id: `r-${Date.now()}`,
            user: mockState.username ?? '用户',
            content,
            date: new Date().toISOString().slice(0, 10),
            likes: 0,
            replyCount: 0,
          }
          if (!comment.replies) comment.replies = []
          comment.replies.push(reply)
          comment.replyCount = comment.replies.length
          return mockDelay(reply)
        }
      }
    }
    throw new Error('评论不存在')
  }
  return request<CatalogComment>(`/api/catalog/comments/${commentId}/replies`, {
    method: 'POST',
    body: { content },
  })
}

export async function likeCatalogComment(commentId: string): Promise<void> {
  if (USE_MOCK) {
    mockState.commentLikes.add(commentId)
    return mockDelay(undefined)
  }
  await request<void>(`/api/catalog/comments/${commentId}/like`, { method: 'POST' })
}

export async function unlikeCatalogComment(commentId: string): Promise<void> {
  if (USE_MOCK) {
    mockState.commentLikes.delete(commentId)
    return mockDelay(undefined)
  }
  await request<void>(`/api/catalog/comments/${commentId}/like`, { method: 'DELETE' })
}

export async function reportCatalogComment(commentId: string, reason: string): Promise<void> {
  if (USE_MOCK) {
    void reason
    return mockDelay(undefined)
  }
  await request<void>(`/api/catalog/comments/${commentId}/report`, {
    method: 'POST',
    body: { reason },
  })
}
