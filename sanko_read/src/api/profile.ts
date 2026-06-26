import { USE_MOCK } from '@/api/config'
import { request } from '@/api/request'
import type { AccountProfile, PointsOrder, PointsSummary } from '@/types/profile'
import { mockDelay, mockState } from '@/api/mock/state'

export async function fetchPointsSummary(): Promise<PointsSummary> {
  if (USE_MOCK) {
    return mockDelay({ ...mockState.pointsSummary })
  }
  return request<PointsSummary>('/api/profile/points/summary')
}

export async function fetchPointsOrders(params?: {
  type?: string
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}): Promise<{ items: PointsOrder[]; total: number }> {
  if (USE_MOCK) {
    let items = [...mockState.pointsOrders]
    if (params?.type && params.type !== 'all') {
      items = items.filter((o) => o.type === params.type)
    }
    if (params?.startDate) {
      items = items.filter((o) => o.time.slice(0, 10) >= params.startDate!)
    }
    if (params?.endDate) {
      items = items.filter((o) => o.time.slice(0, 10) <= params.endDate!)
    }
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const start = (page - 1) * pageSize
    return mockDelay({
      items: items.slice(start, start + pageSize),
      total: items.length,
    })
  }
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  const qs = query.toString()
  return request<{ items: PointsOrder[]; total: number }>(
    `/api/profile/points/orders${qs ? `?${qs}` : ''}`,
  )
}

export async function rechargePoints(
  amount: number,
  method: 'wechat' | 'alipay',
): Promise<{ orderId: string }> {
  if (USE_MOCK) {
    const points = amount * 10
    mockState.pointsSummary.balance += points
    mockState.pointsSummary.totalEarned += points
    const order: PointsOrder = {
      id: `ORD${Date.now()}`,
      time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      type: 'recharge',
      change: points,
      balance: mockState.pointsSummary.balance,
      description: `积分充值-${method === 'wechat' ? '微信' : '支付宝'}`,
      status: 'completed',
    }
    mockState.pointsOrders.unshift(order)
    return mockDelay({ orderId: order.id })
  }
  return request<{ orderId: string }>('/api/profile/points/recharge', {
    method: 'POST',
    body: { amount, method },
  })
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  if (USE_MOCK) {
    return mockDelay({
      id: 'mock-user',
      username: mockState.username ?? '用户',
      email: `${mockState.username ?? 'user'}@sanko.local`,
      registeredAt: '2026-01-15',
      pointsBalance: mockState.pointsSummary.balance,
    })
  }
  return request<AccountProfile>('/api/profile/account')
}
