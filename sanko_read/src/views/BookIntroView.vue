<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Reading } from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import BookCommentSection from '@/components/book/BookCommentSection.vue'
import AddToBookshelfDialog from '@/components/AddToBookshelfDialog.vue'
import { catalogBookToLibraryBook, getCatalogBook } from '@/data/catalogBooks'
import { useBooksStore } from '@/stores/books'
import { useRequireLogin } from '@/composables/useRequireLogin'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const { isLoggedIn, requireLogin } = useRequireLogin()

const book = computed(() => getCatalogBook(route.params.id as string))
const liked = ref(false)
const blocked = ref(false)
const showAddToShelfDialog = ref(false)

const goBack = () => {
  router.push('/')
}

const toggleLike = () => {
  liked.value = !liked.value
  ElMessage.success(liked.value ? '已添加到喜欢' : '已从喜欢移除')
}

const toggleBlock = () => {
  blocked.value = !blocked.value
  ElMessage.info(blocked.value ? '已加入屏蔽' : '已取消屏蔽')
}

const startReading = () => {
  if (!book.value) return
  const readerPath = `/read/${book.value.id}`
  requireLogin(async () => {
    await booksStore.ensureBookInLibrary(catalogBookToLibraryBook(book.value!))
    void router.push(readerPath)
  }, '请先登录后再阅读', readerPath)
}

const openAddToShelf = () => {
  requireLogin(() => {
    showAddToShelfDialog.value = true
  }, '请先登录后再加入书架')
}

const onAddToShelfSuccess = async ({ shelfCount }: { shelfCount: number }) => {
  if (!book.value) return
  if (shelfCount > 0) {
    await booksStore.ensureBookInLibrary(catalogBookToLibraryBook(book.value))
    ElMessage.success('已加入书架')
  } else {
    ElMessage.success('已从书架移除')
  }
}
</script>

<template>
  <div v-if="book" class="book-intro">
    <header class="book-intro__toolbar">
      <button type="button" class="book-intro__back" aria-label="返回首页" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </button>
      <button
        type="button"
        class="book-intro__shield"
        :class="{ 'book-intro__shield--active': blocked }"
        @click="toggleBlock"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.54-3.07 8.83-7 9.93-3.93-1.1-7-5.39-7-9.93V6.3l7-3.12z"
          />
        </svg>
        加入屏蔽
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
          <dt>属性：</dt>
          <dd>{{ book.category ?? '—' }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>更新状态：</dt>
          <dd>{{ book.updateStatus ?? '—' }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>最新章节：</dt>
          <dd>{{ book.latestChapter ?? '—' }}</dd>
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
      <button type="button" class="book-intro__shelf" @click="openAddToShelf">
        <el-icon :size="18"><Reading /></el-icon>
        加入书架
      </button>
      <button
        type="button"
        class="book-intro__like"
        :class="{ 'book-intro__like--active': liked }"
        @click="toggleLike"
      >
        <HeartIcon :size="18" :filled="liked" />
        喜欢
      </button>
      <button type="button" class="book-intro__read" @click="startReading">开始阅读</button>
    </div>

    <BookCommentSection :initial-comments="book.comments" :interactive="isLoggedIn" />

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
  justify-content: space-between;
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

.book-intro__shield {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--sanko-green);
  border-radius: 999px;
  background: #fff;
  color: var(--sanko-green);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.book-intro__shield:hover,
.book-intro__shield--active {
  background: var(--sanko-green);
  color: #fff;
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
  gap: 16px;
  margin-bottom: 28px;
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
