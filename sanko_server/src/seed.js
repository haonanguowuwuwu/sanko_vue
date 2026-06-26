/** 书城种子数据（与前端 catalogBooks.ts 对齐，便于联调） */

export const santiBook = {
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
  comments: [
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
      ],
    },
    {
      id: 'c2',
      user: '用户2',
      content: '一本非常有深度的书，千万千万不要往宇宙发送自己的坐标！',
      date: '2026-06-02',
      likes: 30,
      replyCount: 0,
    },
  ],
  editions: [
    { id: 'n0-epub', format: 'EPUB', fileSize: '1.40 MB' },
    { id: 'n0-pdf', format: 'PDF', fileSize: '15.10 MB' },
    { id: 'n0-mobi', format: 'MOBI', fileSize: '602 KB' },
    { id: 'n0-azw3', format: 'AZW3', fileSize: '1.20 MB' },
    { id: 'n0-txt', format: 'TXT', fileSize: '890 KB' },
  ],
}

const placeholderBooks = [
  { id: 'f2', title: '书籍2', author: '作者2', coverColor: '#1a5fb4', coverTitle: '书籍2', purchaseType: 'paid' },
  { id: 'f3', title: '书籍3', author: '作者3', coverColor: '#2d8659', coverTitle: '书籍3', purchaseType: 'free' },
  { id: 'f4', title: '书籍4', author: '作者4', coverColor: '#6b3fa0', coverTitle: '书籍4', purchaseType: 'paid' },
  { id: 'f5', title: '书籍5', author: '作者5', coverColor: '#b83232', coverTitle: '书籍5', purchaseType: 'free' },
]

export const catalogBooks = [santiBook, ...placeholderBooks]

export const catalogFilters = {
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
  tags: ['豪门', '孤儿', '宠物', '种田文', '无敌文', '科幻', '硬核'],
}

export const defaultSettings = {
  disableRecycleBin: true,
  hideBookshelfBooks: false,
  directDeleteFromShelf: false,
  noPdfCoverAsBookCover: true,
  noCropBookCovers: false,
  showBookshelfBookCount: true,
  enableSoftwareProtection: false,
}

export const defaultShelves = [
  { id: 'shelf-1', name: '开心时间', bookIds: [] },
  { id: 'shelf-2', name: '学习资料', bookIds: [] },
]

export const defaultPointsSummary = {
  balance: 12580,
  totalEarned: 5260,
  totalUsed: 4560,
}

export const defaultPointsOrders = [
  {
    id: 'ORD20260625001',
    time: '2026-06-25 14:30:00',
    type: 'recharge',
    change: 500,
    balance: 12580,
    description: '积分充值-支付宝',
    status: 'completed',
  },
]
