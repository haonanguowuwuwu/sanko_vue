import type { ReaderSpread } from '@/types/reader'

export const READER_SPREADS: ReaderSpread[] = [
  {
    chapter: 'chapter 0',
    left: {
      page: 1,
      blocks: [
        {
          id: 's0-l-p1',
          type: 'paragraph',
          text: '本书精选雅思考试高频词汇，按照话题分类编排，帮助考生在语境中高效记忆。每个单词都配有地道例句和用法说明，便于理解与应用。',
        },
        {
          id: 's0-l-p2',
          type: 'paragraph',
          text: '词汇学习不应孤立进行。通过逻辑词群、多维联想和反复巩固，才能在考试中快速反应、准确使用。',
        },
        {
          id: 's0-l-t1',
          type: 'title',
          text: '三、真经',
        },
        {
          id: 's0-l-s1',
          type: 'subtitle',
          text: '1. 逻辑词群记忆',
        },
        {
          id: 's0-l-p3',
          type: 'paragraph',
          text: '将意义相近或用法相关的词汇放在同一单元，形成记忆网络。例如：表示"增加"的 augment、expand、escalate 可以一起记忆，对比细微差别。',
          defaultBg: 'gray',
        },
        {
          id: 's0-l-p4',
          type: 'paragraph',
          text: '那么，为什么我们的英语水平一直全球倒数？因为我们背单词时只记中文意思，忽略了搭配和语境，导致"认识但不会用"。',
        },
      ],
    },
    right: {
      page: 2,
      blocks: [
        {
          id: 's0-r-s1',
          type: 'subtitle',
          text: '2. 五维词汇记忆',
        },
        {
          id: 's0-r-p1',
          type: 'paragraph',
          text: '从拼写、读音、词义、搭配、语域五个维度全面掌握一个单词，避免"认识但不会用"的常见问题。',
          defaultBg: 'gray',
        },
        {
          id: 's0-r-s2',
          type: 'subtitle',
          text: '3. 五大特点',
        },
        {
          id: 's0-r-p2',
          type: 'paragraph',
          text: '(1) 地道搭配：精选权威语料库中的高频搭配，如 make a decision、take action。',
        },
        {
          id: 's0-r-p3',
          type: 'paragraph',
          text: '(2) 学以致用：每个单词都配有真题例句，帮助你在考试场景中灵活运用。',
        },
        {
          id: 's0-r-p4',
          type: 'paragraph',
          text: '(3) 字根词源：通过词根词缀理解单词构成，举一反三扩大词汇量。',
        },
      ],
    },
  },
  {
    chapter: 'chapter 1',
    left: {
      page: 3,
      blocks: [
        {
          id: 's1-l-p1',
          type: 'paragraph',
          text: 'Chapter 1 介绍了自然地理类词汇。这类话题在雅思阅读中频繁出现，掌握核心词汇能显著提升阅读速度。',
        },
        {
          id: 's1-l-t1',
          type: 'title',
          text: '核心词汇',
        },
        {
          id: 's1-l-p2',
          type: 'paragraph',
          text: 'atmosphere — n. 大气层；氛围。The Earth\'s atmosphere protects us from harmful radiation.',
        },
        {
          id: 's1-l-p3',
          type: 'paragraph',
          text: 'hydrosphere — n. 水圈。The hydrosphere includes all water on Earth\'s surface.',
        },
      ],
    },
    right: {
      page: 4,
      blocks: [
        {
          id: 's1-r-p1',
          type: 'paragraph',
          text: 'lithosphere — n. 岩石圈。Earthquakes occur when plates in the lithosphere move.',
        },
        {
          id: 's1-r-p2',
          type: 'paragraph',
          text: 'biosphere — n. 生物圈。Human activity has a profound impact on the biosphere.',
        },
        {
          id: 's1-r-p3',
          type: 'paragraph',
          text: '继续阅读下一章，了解更多话题词汇……',
        },
      ],
    },
  },
]

export function getChapterByBlockId(blockId: string, spreads: ReaderSpread[] = READER_SPREADS): string {
  for (const spread of spreads) {
    const inSpread =
      spread.left.blocks.some((b) => b.id === blockId) ||
      spread.right.blocks.some((b) => b.id === blockId)
    if (inSpread) return spread.chapter
  }
  return 'chapter 0'
}

export function getSpreadIndexByBlockId(blockId: string): number {
  return READER_SPREADS.findIndex(
    (spread) =>
      spread.left.blocks.some((b) => b.id === blockId) ||
      spread.right.blocks.some((b) => b.id === blockId),
  )
}
