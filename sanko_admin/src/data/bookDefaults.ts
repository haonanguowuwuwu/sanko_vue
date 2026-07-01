import type { AdminBook } from '@/types/modules'

const APPROVED_BOOK_META: Record<
  string,
  Omit<
    AdminBook,
    'id' | 'title' | 'author' | 'category' | 'purchaseType' | 'status' | 'updatedAt' | 'uploader' | 'uploadedAt' | 'rejectReason'
  >
> = {
  b001: {
    format: 'EPUB',
    fileSize: '1.4 MB',
    coverColor: '#2d6a4f',
    coverTitle: '三体',
    synopsis: '地球文明向宇宙发出第一声啼鸣，却引来了三体文明的回应。一部硬科幻史诗的开篇。',
    tableOfContents: ['第一部 科学边界', '第二部 三体游戏', '第三章 射手与农场主', '第四章 三体、周文王、长夜'],
    previewExcerpt:
      '汪淼觉得，来找他的这四个人是一个奇怪的组合：两名警察和两名军人。如果那两个军人是武警还算正常，但这是两名陆军军官。',
  },
  b002: {
    format: 'EPUB',
    fileSize: '860 KB',
    coverColor: '#bc4749',
    coverTitle: '活着',
    synopsis: '讲述了在大时代背景下，随着内战、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难。',
    tableOfContents: ['第一章', '第二章', '第三章', '第四章', '第五章'],
    previewExcerpt:
      '我比现在年轻十岁的时候，获得了一个游手好闲的职业，去乡间收集民间歌谣。那一年的整个夏天，我如同一只乱飞的麻雀，游荡在知了和阳光充斥的村舍田野。',
  },
  b003: {
    format: 'PDF',
    fileSize: '2.1 MB',
    coverColor: '#e09f3e',
    coverTitle: '小王子',
    synopsis: '一个来自外星球的小王子，讲述自己星球和玫瑰的故事，以及在地球上遇到的各类人物。',
    tableOfContents: ['第一章 画羊', '第二章 遇见飞行员', '第三章 玫瑰', '第四章 狐狸'],
    previewExcerpt:
      '当我还只有六岁的时候，在一本描写原始森林的名叫《真实的故事》的书中，看到了一副精彩的插画，画的是一条蟒蛇正在吞食一只大野兽。',
  },
}

export function defaultBookMeta(
  partial: Pick<AdminBook, 'id' | 'title' | 'author' | 'category' | 'purchaseType' | 'status'> &
    Partial<AdminBook>,
): AdminBook {
  const preset = APPROVED_BOOK_META[partial.id]
  const now = partial.updatedAt ?? '2026-06-01'
  return {
    format: partial.format ?? preset?.format ?? 'EPUB',
    fileSize: partial.fileSize ?? preset?.fileSize ?? '1.0 MB',
    coverColor: partial.coverColor ?? preset?.coverColor ?? '#5a7a6a',
    coverTitle: partial.coverTitle ?? preset?.coverTitle ?? partial.title.replace(/^《|》$/g, ''),
    synopsis: partial.synopsis ?? preset?.synopsis ?? '暂无简介',
    tableOfContents: partial.tableOfContents ?? preset?.tableOfContents ?? ['第一章', '第二章'],
    previewExcerpt:
      partial.previewExcerpt ??
      preset?.previewExcerpt ??
      '（正文预览待上传完成后由系统提取，当前为演示节选。）',
    uploader: partial.uploader,
    uploadedAt: partial.uploadedAt,
    rejectReason: partial.rejectReason,
    updatedAt: now,
    ...partial,
  }
}

export function normalizeBooks(books: AdminBook[]): AdminBook[] {
  return books.map((book) => defaultBookMeta(book))
}
