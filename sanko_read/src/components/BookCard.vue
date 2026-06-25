<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { MoreFilled, Reading, Select, Delete, InfoFilled } from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import type { Book } from '@/types/book'
import { useBooksStore } from '@/stores/books'
import BookSelectCheckbox from '@/components/BookSelectCheckbox.vue'
import BookCoverFace from '@/components/BookCoverFace.vue'
import BookDeleteDialog from '@/components/BookDeleteDialog.vue'
import BookDetailDialog from '@/components/BookDetailDialog.vue'
import AddToBookshelfDialog from '@/components/AddToBookshelfDialog.vue'

const props = defineProps<{
  book: Book
}>()

const router = useRouter()
const booksStore = useBooksStore()
const { selectionMode } = storeToRefs(booksStore)
const menuVisible = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const showAddToShelfDialog = ref(false)

const isFavorited = computed(() => booksStore.isFavorite(props.book.id))

const openBook = () => {
  if (selectionMode.value) {
    booksStore.toggleSelect(props.book.id)
    return
  }
  router.push({ name: 'reader', params: { id: props.book.id } })
}

const handleCoverClick = () => {
  openBook()
}

const handleInfoClick = () => {
  if (selectionMode.value) {
    booksStore.toggleSelect(props.book.id)
    return
  }
  router.push({ name: 'reader', params: { id: props.book.id } })
}

const toggleFavorite = async () => {
  await booksStore.toggleFavorite(props.book.id)
  ElMessage.success(
    booksStore.isFavorite(props.book.id) ? '已添加到喜欢' : '已从喜欢移除',
  )
}

const handleHeartClick = (event: MouseEvent) => {
  event.stopPropagation()
  toggleFavorite()
}

const handleCommand = (command: string) => {
  menuVisible.value = false
  switch (command) {
    case 'favorite':
      toggleFavorite()
      break
    case 'bookshelf':
      showAddToShelfDialog.value = true
      break
    case 'multi':
      booksStore.enterSelectionMode(props.book.id)
      break
    case 'delete':
      if (booksStore.isRecycleBinEnabled()) {
        void booksStore.moveToRecycleBin(props.book.id).then(() => {
          ElMessage.success('已移入回收站')
        })
      } else {
        showDeleteDialog.value = true
      }
      break
    case 'info':
      showDetailDialog.value = true
      break
  }
}

const confirmDelete = async () => {
  await booksStore.removeBook(props.book.id)
  ElMessage.success('已删除书籍')
}

const onAddToShelfSuccess = ({ shelfCount }: { shelfCount: number }) => {
  ElMessage.success(shelfCount > 0 ? '已添加到书架' : '已从书架移除')
}
</script>

<template>
  <article class="book-card">
    <div
      class="book-card__cover"
      :class="{ 'book-card__cover--selectable': selectionMode }"
      @click="handleCoverClick"
    >
      <BookCoverFace :book="book" />

      <button
        type="button"
        class="book-card__heart"
        :class="{ 'book-card__heart--active': isFavorited }"
        :aria-label="isFavorited ? '从喜欢移除' : '添加到喜欢'"
        @click="handleHeartClick"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </button>

      <BookSelectCheckbox
        v-if="selectionMode"
        :selected="booksStore.isSelected(book.id)"
        @toggle="booksStore.toggleSelect(book.id)"
      />
    </div>

    <div class="book-card__meta">
      <div class="book-card__info" @click="handleInfoClick">
        <h3 class="book-card__title">{{ book.title }}</h3>
        <p class="book-card__author">{{ book.author }}</p>
        <p class="book-card__progress">{{ book.progress.toFixed(2) }}%</p>
      </div>

      <el-dropdown
        v-if="!selectionMode"
        trigger="click"
        @command="handleCommand"
        @visible-change="menuVisible = $event"
      >
        <el-button class="book-card__menu" :icon="MoreFilled" text circle />
        <template #dropdown>
          <el-dropdown-menu class="book-card__dropdown">
            <el-dropdown-item command="favorite">
              <el-icon class="book-card__menu-heart"><HeartIcon :size="16" /></el-icon>
              {{ isFavorited ? '从喜欢移除' : '添加到喜欢' }}
            </el-dropdown-item>
            <el-dropdown-item command="bookshelf" :icon="Reading">添加到书架</el-dropdown-item>
            <el-dropdown-item command="multi" :icon="Select">多选</el-dropdown-item>
            <el-dropdown-item command="delete" :icon="Delete">删除</el-dropdown-item>
            <el-dropdown-item command="info" :icon="InfoFilled">详细信息</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <BookDeleteDialog v-model:visible="showDeleteDialog" @confirm="confirmDelete" />
    <BookDetailDialog v-model:visible="showDetailDialog" :book="book" />
    <AddToBookshelfDialog
      v-model:visible="showAddToShelfDialog"
      :book-ids="[book.id]"
      @success="onAddToShelfSuccess"
    />
  </article>
</template>

<style scoped>
.book-card {
  width: var(--book-card-width, 160px);
}

.book-card__cover {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: transform 0.15s;
}

.book-card__cover:not(.book-card__cover--selectable):hover {
  transform: translateY(-2px);
}

.book-card__heart {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  transition:
    color 0.15s,
    transform 0.15s;
}

.book-card__heart:hover {
  transform: scale(1.1);
}

.book-card__heart--active {
  color: #e74c3c;
}

.book-card__heart--active:hover {
  color: #c0392b;
}

.book-card__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 10px;
  gap: 4px;
}

.book-card__info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.book-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-card__author {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.book-card__progress {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.book-card__menu {
  flex-shrink: 0;
  color: var(--sanko-text-secondary);
  transform: rotate(90deg);
}

.book-card__menu-heart {
  margin-right: 6px;
  color: var(--sanko-text-secondary);
}
</style>

<style>
.book-card__dropdown.el-dropdown-menu {
  background: #f5f0e8;
  border: 1px solid #d9d0c0;
  padding: 6px 0;
}

.book-card__dropdown .el-dropdown-menu__item {
  font-size: 14px;
  padding: 8px 20px;
}
</style>
