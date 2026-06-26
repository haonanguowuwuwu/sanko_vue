<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Reading } from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import BookCommentSection from '@/components/book/BookCommentSection.vue'
import AddToBookshelfDialog from '@/components/AddToBookshelfDialog.vue'
import { useBooksStore } from '@/stores/books'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import { fetchCatalogBook, downloadCatalogEdition } from '@/api/catalog'
import type { CatalogBook, CatalogBookEdition } from '@/types/catalog'
import {
  catalogBookToLibraryBook,
  formatEditionLabel,
  purchaseTypeLabel,
} from '@/data/catalogBooks'
import { seedDemoAnnotationsIfNeeded } from '@/api/mock/demoAnnotations'
import { useRequireLogin } from '@/composables/useRequireLogin'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const annotationsStore = useReaderAnnotationsStore()
const { isLoggedIn, requireLogin } = useRequireLogin()

const book = ref<CatalogBook | null>(null)
const loading = ref(true)
const selectedEditionId = ref<string>('')
const showAddToShelfDialog = ref(false)

const selectedEdition = computed((): CatalogBookEdition | undefined => {
  if (!book.value?.editions?.length) return undefined
  return (
    book.value.editions.find((e) => e.id === selectedEditionId.value) ??
    book.value.editions[0]
  )
})

const isFavorited = computed(() =>
  book.value ? booksStore.isFavorite(book.value.id) : false,
)

const isInLibrary = computed(() =>
  book.value ? booksStore.books.some((b) => b.id === book.value!.id) : false,
)

const purchaseLabel = computed(() => {
  const type = book.value?.purchaseType
  return type ? purchaseTypeLabel[type] : '—'
})

const loadBook = async (id: string) => {
  loading.value = true
  try {
    const data = await fetchCatalogBook(id)
    book.value = data
    selectedEditionId.value = data?.editions?.[0]?.id ?? ''
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id as string,
  (id) => {
    if (id) void loadBook(id)
  },
  { immediate: true },
)

const goBack = () => {
  router.push('/')
}

async function ensureCurrentBookInLibrary() {
  if (!book.value || !selectedEdition.value) {
    ElMessage.warning('请先选择书籍版本')
    return null
  }
  const saved = await booksStore.ensureBookInLibrary(
    catalogBookToLibraryBook(book.value, selectedEdition.value),
  )
  const seeded = seedDemoAnnotationsIfNeeded(saved.id, saved.format)
  if (seeded) {
    await annotationsStore.fetchAll()
  }
  return saved
}

const toggleLike = () => {
  if (!book.value) return
  requireLogin(async () => {
    await ensureCurrentBookInLibrary()
    await booksStore.toggleFavorite(book.value!.id)
    ElMessage.success(
      booksStore.isFavorite(book.value!.id) ? '已添加到喜欢' : '已从喜欢移除',
    )
  }, '请先登录后再操作')
}

const startReading = () => {
  if (!book.value) return
  if (!selectedEdition.value) {
    ElMessage.warning('请先选择书籍版本')
    return
  }
  const readerPath = `/read/${book.value.id}`
  requireLogin(async () => {
    await ensureCurrentBookInLibrary()
    void router.push(readerPath)
  }, '请先登录后再阅读', readerPath)
}

const downloadEdition = () => {
  if (!book.value || !selectedEdition.value) {
    ElMessage.warning('请先选择书籍版本')
    return
  }
  const edition = selectedEdition.value
  requireLogin(async () => {
    try {
      await downloadCatalogEdition(book.value!.id, edition.id)
      ElMessage.success(`开始下载 ${edition.format} 版本（${edition.fileSize}）`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载失败'
      ElMessage.error(message)
    }
  }, '请先登录后再下载')
}

const openAddToShelf = () => {
  requireLogin(async () => {
    const wasInLibrary = isInLibrary.value
    const saved = await ensureCurrentBookInLibrary()
    if (!saved) return
    if (!wasInLibrary) {
      ElMessage.success('已加入书架')
    }
    showAddToShelfDialog.value = true
  }, '请先登录后再加入书架')
}

const onAddToShelfSuccess = ({ shelfCount }: { shelfCount: number }) => {
  if (!book.value) return
  if (shelfCount > 0) {
    ElMessage.success('已更新书架分组')
  } else {
    ElMessage.success('已更新书架分组')
  }
}
</script>

<template>
  <div v-if="loading" class="book-intro book-intro--empty">
    <p>加载中…</p>
  </div>

  <div v-else-if="book" class="book-intro">
    <header class="book-intro__toolbar">
      <button type="button" class="book-intro__back" aria-label="返回首页" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </button>
    </header>

    <section class="book-intro__hero">
      <div class="book-intro__cover" :style="{ background: book.coverColor }">
        <span class="book-intro__cover-title">{{ book.coverTitle }}</span>
      </div>

      <dl class="book-intro__meta">
        <div class="book-intro__meta-row">
          <dt>标题：</dt>
          <dd>{{ book.title }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>作者：</dt>
          <dd>{{ book.author }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>分类：</dt>
          <dd>{{ book.category ?? '—' }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>属性：</dt>
          <dd>{{ purchaseLabel }}</dd>
        </div>
        <div v-if="selectedEdition" class="book-intro__meta-row">
          <dt>文件：</dt>
          <dd>{{ formatEditionLabel(selectedEdition) }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="book.tags?.length" class="book-intro__tags">
      <span class="book-intro__tags-label">标签：</span>
      <span v-for="tag in book.tags" :key="tag" class="book-intro__tag">{{ tag }}</span>
    </section>

    <p class="book-intro__synopsis">
      {{ book.synopsis ?? book.description ?? '暂无简介' }}
    </p>

    <div class="book-intro__actions">
      <div v-if="book.editions?.length" class="book-intro__edition">
        <label class="book-intro__edition-label" for="book-edition-select">选择版本</label>
        <el-select
          id="book-edition-select"
          v-model="selectedEditionId"
          class="book-intro__edition-select"
          placeholder="选择格式"
        >
          <el-option
            v-for="edition in book.editions"
            :key="edition.id"
            :label="formatEditionLabel(edition)"
            :value="edition.id"
          />
        </el-select>
      </div>

      <button type="button" class="book-intro__shelf" @click="openAddToShelf">
        <el-icon :size="18"><Reading /></el-icon>
        {{ isInLibrary ? '管理书架' : '加入书架' }}
      </button>
      <button
        type="button"
        class="book-intro__like"
        :class="{ 'book-intro__like--active': isFavorited }"
        @click="toggleLike"
      >
        <HeartIcon :size="18" :filled="isFavorited" />
        {{ isFavorited ? '已喜欢' : '喜欢' }}
      </button>
      <button
        type="button"
        class="book-intro__download"
        :disabled="!selectedEdition"
        @click="downloadEdition"
      >
        下载
      </button>
      <button
        type="button"
        class="book-intro__read"
        :disabled="!selectedEdition"
        @click="startReading"
      >
        开始阅读
      </button>
    </div>

    <BookCommentSection
      v-if="book"
      :book-id="book.id"
      :initial-comments="book.comments"
      :interactive="isLoggedIn"
    />

    <AddToBookshelfDialog
      v-model:visible="showAddToShelfDialog"
      :book-ids="[book.id]"
      @success="onAddToShelfSuccess"
    />
  </div>

  <div v-else class="book-intro book-intro--empty">
    <p>未找到该书籍</p>
    <button type="button" class="book-intro__read" @click="goBack">返回首页</button>
  </div>
</template>

<style scoped>
.book-intro {
  --book-intro-inset: 120px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-inline: var(--book-intro-inset);
  padding-bottom: 32px;
}

.book-intro--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--sanko-text-secondary);
}

.book-intro__toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.book-intro__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--sanko-text);
  cursor: pointer;
  transition: background 0.15s;
}

.book-intro__back:hover {
  background: rgba(0, 0, 0, 0.05);
}

.book-intro__hero {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
}

.book-intro__cover {
  flex-shrink: 0;
  width: 140px;
  height: 186px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #1a1a1a;
}

.book-intro__cover-title {
  font-size: 28px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 4px;
}

.book-intro__meta {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding-top: 8px;
}

.book-intro__meta-row {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.book-intro__meta-row dt {
  flex-shrink: 0;
  margin: 0;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-intro__meta-row dd {
  margin: 0;
  color: var(--sanko-text);
}

.book-intro__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.book-intro__tags-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-intro__tag {
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.book-intro__synopsis {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--sanko-text-secondary);
}

.book-intro__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-bottom: 28px;
}

.book-intro__edition {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.book-intro__edition-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  white-space: nowrap;
}

.book-intro__edition-select {
  width: 180px;
}

.book-intro__download {
  padding: 10px 20px;
  border: 1px solid var(--sanko-green);
  border-radius: 999px;
  background: #fff;
  color: var(--sanko-green);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.book-intro__download:hover:not(:disabled) {
  background: rgba(0, 90, 43, 0.06);
}

.book-intro__download:disabled,
.book-intro__read:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.book-intro__shelf {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: none;
  background: none;
  color: #1a8a8f;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.book-intro__shelf:hover {
  opacity: 0.85;
}

.book-intro__like {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: none;
  background: none;
  color: #e74c3c;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.book-intro__like:not(.book-intro__like--active) {
  color: var(--sanko-text-secondary);
}

.book-intro__like:hover {
  opacity: 0.85;
}

.book-intro__read {
  padding: 10px 28px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.book-intro__read:hover {
  background: var(--sanko-green-hover);
}

@media (max-width: 1100px) {
  .book-intro {
    --book-intro-inset: 48px;
  }
}

@media (max-width: 640px) {
  .book-intro {
    --book-intro-inset: 16px;
  }

  .book-intro__hero {
    flex-direction: column;
    align-items: center;
  }

  .book-intro__meta {
    width: 100%;
  }

  .book-intro__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .book-intro__read {
    width: 100%;
    text-align: center;
  }
}
</style>
