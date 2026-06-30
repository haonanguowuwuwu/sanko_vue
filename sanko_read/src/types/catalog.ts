export interface CatalogComment {
  id: string
  user: string
  content: string
  date: string
  likes: number
  replyCount: number
  /** 用户对该书的评分（1–5），仅主评论可能有 */
  rating?: number
  replies?: CatalogComment[]
}

/** 一本书关联的一个文件版本 */
export interface CatalogBookEdition {
  id: string
  format: string
  fileSize: string
}

export interface CatalogBook {
  id: string
  title: string
  author: string
  coverColor: string
  coverTitle: string
  description?: string
  category?: string
  /** 无需积分购买 / 需要积分购买 */
  purchaseType?: 'free' | 'paid'
  /** 积分购买价格（purchaseType 为 paid 时有效） */
  pointsPrice?: number
  tags?: string[]
  synopsis?: string
  /** 综合评分，满分默认 5 */
  rating?: number
  ratingMax?: number
  comments?: CatalogComment[]
  /** 同一书籍条目下的多种格式 */
  editions?: CatalogBookEdition[]
}

export interface RankSection {
  title: string
  highlight: CatalogBook
  items: CatalogBook[]
}
