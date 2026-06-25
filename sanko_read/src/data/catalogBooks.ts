import type { Book } from '@/types/book'
import { formatAddedDate } from '@/types/book'
import type { CatalogBook, CatalogBookEdition, RankSection } from '@/types/catalog'

export type { CatalogBook, CatalogBookEdition, CatalogComment, RankSection } from '@/types/catalog'

const santiComments = [
  {
    id: 'c1',
    user: '用户1',
    content: '非常好看，强力推荐！',
    date: '2026-06-02',
    likes: 30,
    replyCount: 2,
    replies: [
      {
        id: 'c1-r1',
        user: '用户3',
        content: '同意，三体是我读过最好的科幻小说之一。',
        date: '2026-06-03',
        likes: 12,
        replyCount: 0,
      },
      {
        id: 'c1-r2',
        user: '用户6',
        content: '第一部节奏稍慢，但后面越来越精彩。',
        date: '2026-06-04',
        likes: 5,
        replyCount: 0,
      },
    ],
  },
  {
    id: 'c2',
    user: '用户2',
    content: '一本非常有深度的书，千万千万不要往宇宙发送自己的坐标！',
    date: '2026-06-02',
    likes: 30,
    replyCount: 4,
    replies: [
      {
        id: 'c2-r1',
        user: '用户4',
        content: '黑暗森林法则太震撼了。',
        date: '2026-06-04',
        likes: 8,
        replyCount: 0,
      },
      {
        id: 'c2-r2',
        user: '用户7',
        content: '程心这个角色争议很大，但正是这种争议让故事更有张力。',
        date: '2026-06-05',
        likes: 6,
        replyCount: 0,
      },
      {
        id: 'c2-r3',
        user: '用户8',
        content: '水滴攻击那段看得我头皮发麻。',
        date: '2026-06-06',
        likes: 15,
        replyCount: 0,
      },
      {
        id: 'c2-r4',
        user: '用户9',
        content: '建议先看一遍原著再看解读，体验完全不同。',
        date: '2026-06-07',
        likes: 3,
        replyCount: 0,
      },
    ],
  },
  {
    id: 'c3',
    user: '用户5',
    content: '刘慈欣的想象力真的无敌，读完久久不能平静。',
    date: '2026-06-05',
    likes: 18,
    replyCount: 0,
  },
] satisfies CatalogBook['comments']

const santiEditions: CatalogBookEdition[] = [
  { id: 'n0-epub', format: 'EPUB', fileSize: '1.40 MB' },
  { id: 'n0-pdf', format: 'PDF', fileSize: '15.10 MB' },
  { id: 'n0-mobi', format: 'MOBI', fileSize: '602 KB' },
  { id: 'n0-azw3', format: 'AZW3', fileSize: '1.20 MB' },
  { id: 'n0-txt', format: 'TXT', fileSize: '890 KB' },
]

export const santiBook: CatalogBook = {
  id: 'n0',
  title: '三体',
  author: '刘慈欣',
  coverColor: '#f0c419',
  coverTitle: '三体',
  description: '地球文明向宇宙发出第一声啼鸣，取得了探寻外星文明的突破性进展…',
  category: '科幻 · 长篇',
  purchaseType: 'free',
  tags: ['科幻', '硬核', '人文思考'],
  synopsis:
    '展现了残酷的宇宙社会结构，以及人类在面对未知文明时的挣扎与抉择。地球文明向宇宙发出第一声啼鸣，取得了探寻外星文明的突破性进展。三体人利用超技术锁死了地球的基础科学，庞大的宇宙舰队杀向地球…',
  comments: santiComments,
  editions: santiEditions,
}

export const featuredBooks: CatalogBook[] = [
  santiBook,
  { id: 'f2', title: '书籍2', author: '作者2', coverColor: '#1a5fb4', coverTitle: '书籍2' },
  { id: 'f3', title: '书籍3', author: '作者3', coverColor: '#2d8659', coverTitle: '书籍3' },
  { id: 'f4', title: '书籍4', author: '作者4', coverColor: '#6b3fa0', coverTitle: '书籍4' },
  { id: 'f5', title: '书籍5', author: '作者5', coverColor: '#b83232', coverTitle: '书籍5' },
]

export const rankSections: RankSection[] = [
  {
    title: '新书榜',
    highlight: santiBook,
    items: [
      { id: 'n1', title: '诡秘之主', author: '爱潜水的乌贼', coverColor: '#2c3e50', coverTitle: '诡秘' },
      { id: 'n2', title: '大奉打更人', author: '卖报小郎君', coverColor: '#8b4513', coverTitle: '打更' },
      { id: 'n3', title: '道诡异仙', author: '狐尾的笔', coverColor: '#4a235a', coverTitle: '道诡' },
      { id: 'n4', title: '灵境行者', author: '卖报小郎君', coverColor: '#1a5276', coverTitle: '灵境' },
    ],
  },
  {
    title: '完结榜',
    highlight: {
      id: 'c0',
      title: '斗破苍穹',
      author: '天蚕土豆',
      coverColor: '#922b21',
      coverTitle: '斗破',
      description: '这里是属于斗气的世界，没有花俏的魔法，有的，仅仅是繁衍到巅峰的斗气。',
      category: '玄幻 · 长篇',
      purchaseType: 'paid',
      tags: ['玄幻', '热血', '升级'],
    },
    items: [
      { id: 'c1', title: '全职高手', author: '蝴蝶蓝', coverColor: '#117a65', coverTitle: '全职' },
      { id: 'c2', title: '庆余年', author: '猫腻', coverColor: '#7d6608', coverTitle: '庆余' },
      { id: 'c3', title: '择天记', author: '猫腻', coverColor: '#1f618d', coverTitle: '择天' },
      { id: 'c4', title: '将夜', author: '猫腻', coverColor: '#566573', coverTitle: '将夜' },
    ],
  },
  {
    title: '更多精彩',
    highlight: {
      id: 'm0',
      title: '解忧杂货店',
      author: '东野圭吾',
      coverColor: '#8b4513',
      coverTitle: '解忧',
      description: '僻静的街道旁有一家杂货店，只要写下烦恼投进店前门卷帘门的投信口…',
      category: '文学 · 中篇',
      purchaseType: 'free',
      tags: ['治愈', '温情', '推理'],
    },
    items: [
      { id: 'm1', title: '挪威的森林', author: '村上春树', coverColor: '#196f3d', coverTitle: '挪威' },
      { id: 'm2', title: '百年孤独', author: '马尔克斯', coverColor: '#784212', coverTitle: '百年' },
      { id: 'm3', title: '活着', author: '余华', coverColor: '#7b241c', coverTitle: '活着' },
      { id: 'm4', title: '围城', author: '钱钟书', coverColor: '#512e5f', coverTitle: '围城' },
    ],
  },
]

const catalogBookMap = new Map<string, CatalogBook>()

function registerBook(book: CatalogBook) {
  catalogBookMap.set(book.id, book)
}

featuredBooks.forEach(registerBook)
rankSections.forEach((section) => {
  registerBook(section.highlight)
  section.items.forEach(registerBook)
})

export function getCatalogBook(id: string): CatalogBook | undefined {
  return catalogBookMap.get(id)
}

export function getAllCatalogBooks(): CatalogBook[] {
  return Array.from(catalogBookMap.values())
}

export function catalogBookToLibraryBook(
  catalog: CatalogBook,
  edition?: CatalogBookEdition,
): Book {
  const selected = edition ?? catalog.editions?.[0]
  return {
    id: catalog.id,
    title: catalog.title,
    author: catalog.author,
    progress: 0,
    coverColor: catalog.coverColor,
    coverTitle: catalog.coverTitle,
    fileSize: selected?.fileSize ?? '—',
    format: selected?.format ?? '—',
    addedAt: formatAddedDate(),
    category: catalog.category?.split(' · ')[0] ?? '未分类',
  }
}

export function formatEditionLabel(edition: CatalogBookEdition): string {
  return `${edition.format}, ${edition.fileSize}`
}

export const purchaseTypeLabel: Record<NonNullable<CatalogBook['purchaseType']>, string> = {
  free: '无需积分购买',
  paid: '需要积分购买',
}
