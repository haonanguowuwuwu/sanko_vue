export interface CatalogComment {
  id: string
  user: string
  content: string
  date: string
  likes: number
  replyCount: number
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
  tags?: string[]
  synopsis?: string
  comments?: CatalogComment[]
  /** 同一书籍条目下的多种格式 */
  editions?: CatalogBookEdition[]
}

export interface RankSection {
  title: string
  highlight: CatalogBook
  items: CatalogBook[]
}
