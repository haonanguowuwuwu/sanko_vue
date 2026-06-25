<script setup lang="ts">
import { ref, computed } from 'vue'
import BookFilterBar, { type FilterRow } from '@/components/category/BookFilterBar.vue'
import TagMorePanel from '@/components/category/TagMorePanel.vue'
import TagShieldDialog from '@/components/category/TagShieldDialog.vue'

interface MockBook {
  id: string
  title: string
  author: string
  coverColor: string
  coverTitle: string
}

const baseFilterRows: FilterRow[] = [
  {
    label: '分类',
    key: 'category',
    options: [
      { label: '全部', value: 'all' },
      { label: '男生', value: 'male' },
      { label: '女生', value: 'female' },
      { label: '出版', value: 'publish' },
    ],
  },
  {
    label: '属性',
    key: 'attr',
    options: [
      { label: '全部', value: 'all' },
      { label: '无需积分购买', value: 'free' },
      { label: '需要积分购买', value: 'paid' },
    ],
  },
  {
    label: '标签',
    key: 'tags',
    options: [
      { label: '豪门', value: '豪门' },
      { label: '孤儿', value: '孤儿' },
      { label: '宠物', value: '宠物' },
      { label: '种田文', value: '种田文' },
      { label: '无敌文', value: '无敌文' },
    ],
    showMore: true,
    showTagShield: true,
  },
]

const allTags = [
  '豪门',
  '孤儿',
  '宠物',
  '种田文',
  '无敌文',
  '盗贼',
  '特工',
  '黑客',
  '江湖',
  '热血',
  '重生',
  '穿越',
  '系统',
  '末世',
  '星际',
  '电竞',
]

const defaultVisibleTags = ['豪门', '孤儿', '宠物', '种田文', '无敌文']

const filters = ref<Record<string, string>>({
  category: 'all',
  attr: 'all',
  tags: '豪门',
})

const filterRows = computed(() => {
  const rows = baseFilterRows.map((row) =>
    row.key === 'tags' ? { ...row, options: [...row.options] } : row,
  )
  const tagRow = rows.find((row) => row.key === 'tags')
  const currentTag = filters.value.tags
  if (
    tagRow &&
    currentTag &&
    !defaultVisibleTags.includes(currentTag) &&
    !tagRow.options.some((option) => option.value === currentTag)
  ) {
    tagRow.options.push({ label: currentTag, value: currentTag })
  }
  return rows
})

const mockBooks: MockBook[] = Array.from({ length: 10 }, (_, index) => {
  const n = index + 1
  const colors = ['#c45c26', '#1a5fb4', '#2d8659', '#6b3fa0', '#b83232', '#117a65', '#922b21', '#1c2833', '#8b4513', '#4a235a']
  return {
    id: `c${n}`,
    title: `书籍${n}`,
    author: `作者${n}`,
    coverColor: colors[index % colors.length]!,
    coverTitle: `书籍${n}`,
  }
})

const showTagMore = ref(false)
const showTagShield = ref(false)
const blockedTags = ref<string[]>(['种田文', '热血'])
const draftBlockedTags = ref<string[]>([])

const openTagShield = () => {
  draftBlockedTags.value = [...blockedTags.value]
  showTagShield.value = true
}

const toggleShieldTag = (tag: string) => {
  const list = draftBlockedTags.value
  draftBlockedTags.value = list.includes(tag)
    ? list.filter((item) => item !== tag)
    : [...list, tag]
}

const confirmShieldTags = () => {
  blockedTags.value = [...draftBlockedTags.value]
}

const selectTagFromMore = (tag: string) => {
  filters.value = { ...filters.value, tags: tag }
  showTagMore.value = false
}

const onMore = (key: string) => {
  if (key === 'tags') showTagMore.value = true
}
</script>

<template>
  <div class="categories-page">
    <div class="categories-page__filters">
      <BookFilterBar
        v-model="filters"
        :rows="filterRows"
        @more="onMore"
        @tag-shield="openTagShield"
      />
      <TagMorePanel
        v-model:visible="showTagMore"
        :tags="allTags"
        :active-tag="filters.tags ?? ''"
        @select="selectTagFromMore"
      />
    </div>

    <div class="categories-page__grid">
      <article v-for="book in mockBooks" :key="book.id" class="categories-book">
        <div class="categories-book__cover" :style="{ background: book.coverColor }">
          <span class="categories-book__cover-title">{{ book.coverTitle }}</span>
        </div>
        <h3 class="categories-book__title">{{ book.title }}</h3>
        <p class="categories-book__author">{{ book.author }}</p>
      </article>
    </div>

    <TagShieldDialog
      v-model:visible="showTagShield"
      :tags="allTags"
      :blocked-tags="draftBlockedTags"
      @toggle="toggleShieldTag"
      @confirm="confirmShieldTags"
    />
  </div>
</template>

<style scoped>
.categories-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.categories-page__filters {
  position: relative;
  flex-shrink: 0;
  padding-inline: 8px;
}

.categories-page__grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 24px 20px;
  padding: 4px 8px 16px;
  align-content: start;
}

.categories-book {
  min-width: 0;
}

.categories-book__cover {
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #fff;
  overflow: hidden;
}

.categories-book__cover-title {
  font-size: 15px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 3px;
}

.categories-book__title {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.categories-book__author {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

@media (max-width: 1100px) {
  .categories-page__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .categories-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .categories-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
