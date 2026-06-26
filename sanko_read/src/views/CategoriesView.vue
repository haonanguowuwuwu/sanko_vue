<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BookFilterBar, { type FilterRow } from '@/components/category/BookFilterBar.vue'
import TagMorePanel from '@/components/category/TagMorePanel.vue'
import TagShieldDialog from '@/components/category/TagShieldDialog.vue'
import {
  fetchBlockedTags,
  fetchCatalogBooks,
  fetchCatalogFilters,
  updateBlockedTags,
} from '@/api/catalog'
import type { CatalogBook } from '@/types/catalog'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const filters = ref<Record<string, string>>({
  category: 'all',
  attr: 'all',
  tags: '豪门',
})

const filterConfig = ref<{ categories: FilterRow['options']; attrs: FilterRow['options']; tags: string[] }>({
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
  tags: ['豪门', '孤儿', '宠物', '种田文', '无敌文'],
})

const defaultVisibleTags = ['豪门', '孤儿', '宠物', '种田文', '无敌文']

const books = ref<CatalogBook[]>([])
const loading = ref(false)
const showTagMore = ref(false)
const showTagShield = ref(false)
const blockedTags = ref<string[]>([])
const draftBlockedTags = ref<string[]>([])

const allTags = computed(() => filterConfig.value.tags)

const filterRows = computed((): FilterRow[] => {
  const tagOptions = defaultVisibleTags.map((tag) => ({ label: tag, value: tag }))
  const currentTag = filters.value.tags
  if (currentTag && !defaultVisibleTags.includes(currentTag) && !tagOptions.some((o) => o.value === currentTag)) {
    tagOptions.push({ label: currentTag, value: currentTag })
  }
  return [
    { label: '分类', key: 'category', options: filterConfig.value.categories },
    { label: '属性', key: 'attr', options: filterConfig.value.attrs },
    {
      label: '标签',
      key: 'tags',
      options: tagOptions,
      showMore: true,
      showTagShield: true,
    },
  ]
})

async function loadFilters() {
  try {
    const data = await fetchCatalogFilters()
    filterConfig.value = {
      categories: data.categories,
      attrs: data.attrs,
      tags: data.tags,
    }
    if (data.tags.length && !data.tags.includes(filters.value.tags ?? '')) {
      filters.value.tags = data.tags[0]!
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载筛选项失败'
    ElMessage.error(message)
  }
}

async function loadBlockedTags() {
  if (!userStore.isLoggedIn) {
    blockedTags.value = []
    return
  }
  try {
    blockedTags.value = await fetchBlockedTags()
  } catch {
    blockedTags.value = []
  }
}

async function loadBooks() {
  loading.value = true
  try {
    const page = await fetchCatalogBooks({
      category: filters.value.category,
      attr: filters.value.attr,
      tags: filters.value.tags,
    })
    books.value = page.items
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载书籍失败'
    ElMessage.error(message)
    books.value = []
  } finally {
    loading.value = false
  }
}

const openTagShield = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再设置标签屏蔽')
    return
  }
  draftBlockedTags.value = [...blockedTags.value]
  showTagShield.value = true
}

const toggleShieldTag = (tag: string) => {
  const list = draftBlockedTags.value
  draftBlockedTags.value = list.includes(tag)
    ? list.filter((item) => item !== tag)
    : [...list, tag]
}

const confirmShieldTags = async () => {
  try {
    blockedTags.value = await updateBlockedTags(draftBlockedTags.value)
    ElMessage.success('标签屏蔽已更新')
    await loadBooks()
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败'
    ElMessage.error(message)
  }
}

const selectTagFromMore = (tag: string) => {
  filters.value = { ...filters.value, tags: tag }
  showTagMore.value = false
}

const onMore = (key: string) => {
  if (key === 'tags') showTagMore.value = true
}

const openBook = (id: string) => {
  void router.push({ name: 'book-intro', params: { id } })
}

watch(
  filters,
  () => {
    void loadBooks()
  },
  { deep: true },
)

watch(
  () => userStore.isLoggedIn,
  () => {
    void loadBlockedTags()
    void loadBooks()
  },
)

onMounted(async () => {
  await loadFilters()
  await loadBlockedTags()
  await loadBooks()
})
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

    <div v-if="loading" class="categories-page__status">加载中…</div>

    <div v-else-if="books.length === 0" class="categories-page__status">暂无符合条件的书籍</div>

    <div v-else class="categories-page__grid">
      <article
        v-for="book in books"
        :key="book.id"
        class="categories-book"
        role="link"
        tabindex="0"
        @click="openBook(book.id)"
        @keydown.enter="openBook(book.id)"
      >
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

.categories-page__status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sanko-text-secondary);
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
  cursor: pointer;
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
