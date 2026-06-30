import type { CatalogBook, CatalogBookEdition } from '@/types/catalog'

function editions(id: string, sizes: Partial<Record<string, string>>): CatalogBookEdition[] {
  const defaults: Record<string, string> = {
    EPUB: '1.20 MB',
    PDF: '12.50 MB',
    MOBI: '580 KB',
    AZW3: '1.05 MB',
    TXT: '720 KB',
  }
  return Object.entries(sizes).map(([format, fileSize]) => ({
    id: `${id}-${format.toLowerCase()}`,
    format,
    fileSize: fileSize ?? defaults[format] ?? '1 MB',
  }))
}

export const guimiBook: CatalogBook = {
  id: 'f2',
  title: '诡秘之主',
  author: '爱潜水的乌贼',
  coverColor: '#2c3e50',
  coverTitle: '诡秘',
  description: '蒸汽与机械的浪潮中，谁能触及非凡？历史和黑暗的迷雾里，又是谁在耳语…',
  category: '奇幻 · 长篇',
  purchaseType: 'paid',
  pointsPrice: 320,
  tags: ['奇幻', '克苏鲁', '升级'],
  rating: 4.8,
  ratingMax: 5.0,
  synopsis:
    '克莱恩·莫雷蒂一觉醒来，成为了诡秘世界里的值夜者。魔药、序列、非凡特性、古老神灵……在这个充满危险与机遇的时代，他必须在保守秘密的同时不断变强。诡秘、占卜、封印物与各个隐秘组织的博弈，构成了一部波澜壮阔的奇幻史诗。',
  editions: editions('f2', { EPUB: '2.10 MB', PDF: '18.20 MB', TXT: '1.05 MB' }),
  comments: [
    {
      id: 'f2-c1',
      user: '卷毛猫',
      content: '世界观太宏大了，每一卷都有新惊喜，就是有时候名字记不住（笑）。',
      date: '2026-06-01',
      likes: 42,
      replyCount: 0,
      rating: 5,
    },
    {
      id: 'f2-c2',
      user: '夜行者',
      content: '值夜者设定太酷了，强烈建议耐心看到第二卷。',
      date: '2026-06-03',
      likes: 18,
      replyCount: 0,
      rating: 4,
    },
  ],
}

export const jieyouBook: CatalogBook = {
  id: 'f3',
  title: '解忧杂货店',
  author: '东野圭吾',
  coverColor: '#8b6914',
  coverTitle: '解忧',
  description: '僻静的街道旁有一家杂货店，只要写下烦恼投进店前门卷帘门的投信口…',
  category: '文学 · 中篇',
  purchaseType: 'free',
  tags: ['治愈', '温情', '推理'],
  rating: 4.6,
  ratingMax: 5.0,
  synopsis:
    '僻静的街道旁有一家杂货店，只要写下烦恼投进店前门卷帘门的投信口，第二天就会在店内的牛奶箱里得到回答。因男友身患绝症，在爱情与梦想之间徘徊的女孩；为了音乐梦想离家漂泊，却在现实中寸步难行的少年；面对家庭巨变，挣扎在亲情与未来之间的少女……他们的来信，会收到怎样的回信？',
  editions: editions('f3', { EPUB: '980 KB', PDF: '8.40 MB', MOBI: '520 KB' }),
  comments: [
    {
      id: 'f3-c1',
      user: '午后茶',
      content: '温暖到哭，适合在安静的晚上一口气读完。',
      date: '2026-06-02',
      likes: 25,
      replyCount: 0,
      rating: 5,
    },
  ],
}

export const doupoBook: CatalogBook = {
  id: 'f4',
  title: '斗破苍穹',
  author: '天蚕土豆',
  coverColor: '#922b21',
  coverTitle: '斗破',
  description: '这里是属于斗气的世界，没有花俏的魔法，有的，仅仅是繁衍到巅峰的斗气。',
  category: '玄幻 · 长篇',
  purchaseType: 'paid',
  pointsPrice: 280,
  tags: ['玄幻', '热血', '升级'],
  rating: 4.5,
  ratingMax: 5.0,
  synopsis:
    '这里是属于斗气的世界，没有花俏的魔法，有的，仅仅是繁衍到巅峰的斗气！萧炎，萧家历史上空前绝后的斗气修炼天才，四岁练气，十岁拥有九段斗之气，十一岁突破十段……然而却在一夜之间，天才变废物，受尽冷眼。三年之后，一枚来自母亲的戒指，改变了他的命运……',
  editions: editions('f4', { EPUB: '3.20 MB', PDF: '22.00 MB', TXT: '1.80 MB', MOBI: '890 KB' }),
  comments: [
    {
      id: 'f4-c1',
      user: '斗气少年',
      content: '经典爽文，退婚流鼻祖，看着就是爽！',
      date: '2026-06-04',
      likes: 56,
      replyCount: 1,
      rating: 5,
      replies: [
        {
          id: 'f4-c1-r1',
          user: '路人甲',
          content: '三十年河东三十年河西！',
          date: '2026-06-05',
          likes: 12,
          replyCount: 0,
        },
      ],
    },
  ],
}

export const huozheBook: CatalogBook = {
  id: 'f5',
  title: '活着',
  author: '余华',
  coverColor: '#7b241c',
  coverTitle: '活着',
  description: '讲述了在大时代背景下，随着内战、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难…',
  category: '文学 · 中篇',
  purchaseType: 'free',
  tags: ['文学', '现实', '人生'],
  rating: 4.9,
  ratingMax: 5.0,
  synopsis:
    '讲述了在大时代背景下，随着内战、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难，到了最后所有亲人都先后离他而去，仅剩下他和一头老牛相依为命。余华以冷峻而又温情的笔触，写出了中国人对"活着"最朴素的理解。',
  editions: editions('f5', { EPUB: '760 KB', PDF: '6.20 MB', TXT: '480 KB' }),
  comments: [
    {
      id: 'f5-c1',
      user: '书虫小王',
      content: '读完沉默了很久，活着本身就是意义。',
      date: '2026-06-06',
      likes: 38,
      replyCount: 0,
      rating: 5,
    },
    {
      id: 'f5-c2',
      user: '文学爱好者',
      content: '福贵的一生就是中国近代史的缩影，字字泣血。',
      date: '2026-06-07',
      likes: 22,
      replyCount: 0,
      rating: 5,
    },
  ],
}
