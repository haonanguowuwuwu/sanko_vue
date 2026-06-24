<script setup lang="ts">
interface HomeBook {
  id: string
  title: string
  author: string
  coverColor: string
  coverTitle: string
  description?: string
}

interface RankSection {
  title: string
  highlight: HomeBook
  items: HomeBook[]
}

const featuredBooks: HomeBook[] = [
  {
    id: 'f1',
    title: '书籍1',
    author: '作者1',
    coverColor: '#c45c26',
    coverTitle: '书籍1',
  },
  {
    id: 'f2',
    title: '书籍2',
    author: '作者2',
    coverColor: '#1a5fb4',
    coverTitle: '书籍2',
  },
  {
    id: 'f3',
    title: '书籍3',
    author: '作者3',
    coverColor: '#2d8659',
    coverTitle: '书籍3',
  },
  {
    id: 'f4',
    title: '书籍4',
    author: '作者4',
    coverColor: '#6b3fa0',
    coverTitle: '书籍4',
  },
  {
    id: 'f5',
    title: '书籍5',
    author: '作者5',
    coverColor: '#b83232',
    coverTitle: '书籍5',
  },
]

const rankSections: RankSection[] = [
  {
    title: '新书榜',
    highlight: {
      id: 'n0',
      title: '三体',
      author: '刘慈欣',
      coverColor: '#1c2833',
      coverTitle: '三体',
      description: '地球文明向宇宙发出第一声啼鸣，取得了探寻外星文明的突破性进展…',
    },
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
    },
    items: [
      { id: 'm1', title: '挪威的森林', author: '村上春树', coverColor: '#196f3d', coverTitle: '挪威' },
      { id: 'm2', title: '百年孤独', author: '马尔克斯', coverColor: '#784212', coverTitle: '百年' },
      { id: 'm3', title: '活着', author: '余华', coverColor: '#7b241c', coverTitle: '活着' },
      { id: 'm4', title: '围城', author: '钱钟书', coverColor: '#512e5f', coverTitle: '围城' },
    ],
  },
]
</script>

<template>
  <div class="home-page">
    <section class="home-featured">
      <article v-for="book in featuredBooks" :key="book.id" class="home-featured__item">
        <div class="home-cover home-cover--featured" :style="{ background: book.coverColor }">
          <span class="home-cover__title">{{ book.coverTitle }}</span>
        </div>
        <h3 class="home-featured__title">{{ book.title }}</h3>
        <p class="home-featured__author">{{ book.author }}</p>
      </article>
    </section>

    <section class="home-ranks">
      <div v-for="section in rankSections" :key="section.title" class="home-rank">
        <h2 class="home-rank__heading">{{ section.title }}</h2>

        <article class="home-rank__highlight">
          <div
            class="home-cover home-cover--rank"
            :style="{ background: section.highlight.coverColor }"
          >
            <span class="home-cover__title">{{ section.highlight.coverTitle }}</span>
          </div>
          <div class="home-rank__highlight-body">
            <h3 class="home-rank__book-title">{{ section.highlight.title }}</h3>
            <p v-if="section.highlight.description" class="home-rank__desc">
              {{ section.highlight.description }}
            </p>
          </div>
        </article>

        <ul class="home-rank__list">
          <li v-for="(item, index) in section.items" :key="item.id" class="home-rank__row">
            <div
              class="home-cover home-cover--thumb"
              :style="{ background: item.coverColor }"
            >
              <span class="home-cover__title home-cover__title--small">{{ item.coverTitle }}</span>
            </div>
            <span class="home-rank__row-title">{{ item.title }}</span>
            <span class="home-rank__row-meta">{{ index + 2 }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  --home-inset-featured: 120px;
  --home-inset-ranks: 180px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.home-featured {
  display: flex;
  justify-content: center;
  gap: 64px;
  flex-shrink: 0;
  padding-inline: var(--home-inset-featured);
}

.home-featured__item {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 96px;
}

.home-featured__title {
  margin: 6px 0 0;
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.home-featured__author {
  margin: 2px 0 0;
  width: 100%;
  font-size: 12px;
  color: var(--sanko-green);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #fff;
  overflow: hidden;
}

.home-cover--featured {
  width: 100%;
  max-width: 96px;
  height: 128px;
}

.home-cover--rank {
  flex-shrink: 0;
  width: 56px;
  height: 74px;
}

.home-cover--thumb {
  flex-shrink: 0;
  width: 36px;
  height: 48px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.home-cover__title {
  font-size: 13px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.home-cover__title--small {
  font-size: 10px;
  letter-spacing: 1px;
}

.home-ranks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  flex: 1;
  min-height: 0;
  padding-inline: var(--home-inset-ranks);
}

.home-rank__heading {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sanko-green);
}

.home-rank__highlight {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.home-rank__highlight-body {
  min-width: 0;
}

.home-rank__book-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.home-rank__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--sanko-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-rank__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.home-rank__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-top: 1px solid var(--sanko-border);
}

.home-rank__row-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-rank__row-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

@media (max-width: 1100px) {
  .home-page {
    --home-inset-featured: 40px;
    --home-inset-ranks: 48px;
  }
  .home-featured {
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
  }

  .home-featured__item {
    width: 96px;
  }

  .home-ranks {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}

@media (max-width: 640px) {
  .home-featured {
    gap: 20px;
  }

  .home-featured__item {
    width: 80px;
  }
}
</style>
