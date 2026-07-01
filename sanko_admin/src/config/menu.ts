import type { Component } from 'vue'
import {
  ChatDotRound,
  Coin,
  Comment,
  DataBoard,
  Document,
  Setting,
  Timer,
  User,
} from '@element-plus/icons-vue'

export interface AdminMenuItem {
  path: string
  label: string
  icon: Component
}

export const adminMenuItems: AdminMenuItem[] = [
  { path: '/dashboard', label: '概览', icon: DataBoard },
  { path: '/users', label: '用户', icon: User },
  { path: '/books', label: '书籍', icon: Document },
  { path: '/comments', label: '评论', icon: Comment },
  { path: '/points', label: '积分', icon: Coin },
  { path: '/history', label: '历史', icon: Timer },
  { path: '/chat', label: 'AI 聊天', icon: ChatDotRound },
  { path: '/settings', label: '管理后台', icon: Setting },
]
