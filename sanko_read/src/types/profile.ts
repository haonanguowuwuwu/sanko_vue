export type PointsOrderType = 'recharge' | 'earn' | 'use'

export type PointsOrderStatus = 'completed' | 'pending' | 'failed'

export interface PointsSummary {
  balance: number
  totalEarned: number
  totalUsed: number
}

export interface PointsOrder {
  id: string
  time: string
  type: PointsOrderType
  change: number
  balance: number
  description: string
  status: PointsOrderStatus
}

export interface RechargePreset {
  amount: number
  color: string
}

export const RECHARGE_PRESETS: RechargePreset[] = [
  { amount: 10, color: '#8fa8b8' },
  { amount: 20, color: '#7a96a8' },
  { amount: 30, color: '#a8c4a0' },
  { amount: 50, color: '#c8dcc0' },
  { amount: 100, color: '#e8e0a8' },
]

export const POINTS_RULES = {
  earn: '当前积分可用于购买电子书、解锁高级功能及参与平台活动。每日签到、完成阅读任务均可获得积分奖励。',
  use: '积分可用于购买电子书、兑换会员权益、参与抽奖活动。购买时优先消耗积分，不足部分可补差价。',
}
