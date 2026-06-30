import {
  catalogBooks,
  defaultPointsOrders,
  defaultPointsSummary,
  defaultSettings,
  defaultShelves,
} from './seed.js'

function seedCatalogComments() {
  const map = new Map()
  for (const book of catalogBooks) {
    map.set(book.id, book.comments ? JSON.parse(JSON.stringify(book.comments)) : [])
  }
  return map
}

/** 内存数据库，重启后清空 */
export const store = {
  sessions: new Map(),
  settings: { ...defaultSettings },
  personalBooks: [],
  trashedBooks: [],
  favoriteIds: new Set(),
  shelves: defaultShelves.map((s) => ({ ...s, bookIds: [...s.bookIds] })),
  highlights: [],
  bookmarks: [],
  pointsSummary: { ...defaultPointsSummary },
  pointsOrders: [...defaultPointsOrders],
  /** bookId -> 选中的 format（阅读 file-url 用） */
  bookFormats: new Map(),
  /** bookId -> { storedName, format, fileSize } 用户上传的文件 */
  bookFiles: new Map(),
  catalogComments: seedCatalogComments(),
  blockedTags: new Set(),
  commentLikes: new Set(),
  purchasedCatalogIds: new Set(),
}

export function resetStore() {
  store.sessions.clear()
  store.settings = { ...defaultSettings }
  store.personalBooks = []
  store.trashedBooks = []
  store.favoriteIds.clear()
  store.shelves = defaultShelves.map((s) => ({ ...s, bookIds: [...s.bookIds] }))
  store.highlights = []
  store.bookmarks = []
  store.pointsSummary = { ...defaultPointsSummary }
  store.pointsOrders = [...defaultPointsOrders]
  store.bookFormats.clear()
  store.bookFiles.clear()
  store.catalogComments = seedCatalogComments()
  store.blockedTags.clear()
  store.commentLikes.clear()
  store.purchasedCatalogIds.clear()
}

export function findCatalogBook(id) {
  return catalogBooks.find((b) => b.id === id) ?? null
}

export function findPersonalBook(id) {
  return store.personalBooks.find((b) => b.id === id) ?? null
}
