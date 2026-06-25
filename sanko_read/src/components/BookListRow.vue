<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { MoreFilled, Reading, Select, InfoFilled } from '@element-plus/icons-vue'
import type { Book } from '@/types/book'
import { useBooksStore } from '@/stores/books'
import HeartIcon from '@/components/HeartIcon.vue'
import BookSelectCheckbox from '@/components/BookSelectCheckbox.vue'
import BookCoverFace from '@/components/BookCoverFace.vue'
import BookDetailDialog from '@/components/BookDetailDialog.vue'
import AddToBookshelfDialog from '@/components/AddToBookshelfDialog.vue'

const props = defineProps<{
  book: Book
}>()

const router = useRouter()
const booksStore = useBooksStore()
const { selectionMode } = storeToRefs(booksStore)
const menuVisible = ref(false)
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

const toggleFavorite = async (event: MouseEvent) => {
  event.stopPropagation()
  await booksStore.toggleFavorite(props.book.id)
  ElMessage.success(
    booksStore.isFavorite(props.book.id) ? '已添加到喜欢' : '已从喜欢移除',
  )
}

const handleCommand = (command: string) => {
  menuVisible.value = false
  switch (command) {
    case 'favorite':
      void toggleFavorite(new MouseEvent('click'))
      break
    case 'bookshelf':
      showAddToShelfDialog.value = true
      break
    case 'multi':
      booksStore.enterSelectionMode(props.book.id)
      break
    case 'info':
      showDetailDialog.value = true
      break
  }
}

const onAddToShelfSuccess = ({ shelfCount }: { shelfCount: number }) => {
  ElMessage.success(shelfCount > 0 ? '已添加到书架' : '已从书架移除')
}
</script>

<template>
  <article class="book-list-row" @click="openBook">
    <div class="book-list-row__cover">
      <BookCoverFace :book="book" />
    </div>

    <button
      type="button"
      class="book-list-row__heart"
      :class="{ 'book-list-row__heart--active': isFavorited }"
      @click="toggleFavorite"
    >
      <HeartIcon :size="20" :filled="isFavorited" />
    </button>

    <h3 class="book-list-row__title">{{ book.title }}</h3>

    <div class="book-list-row__meta">
      <span class="book-list-row__author">{{ book.author }}</span>
      <span class="book-list-row__progress">{{ book.progress.toFixed(2) }}%</span>
    </div>

    <div v-if="selectionMode" class="book-list-row__checkbox-wrap">
      <BookSelectCheckbox
        :selected="booksStore.isSelected(book.id)"
        @toggle="booksStore.toggleSelect(book.id)"
      />
    </div>

    <el-dropdown
      v-else
      trigger="click"
      @command="handleCommand"
      @visible-change="menuVisible = $event"
      @click.stop
    >
      <el-button class="book-list-row__menu" :icon="MoreFilled" text circle @click.stop />
      <template #dropdown>
        <el-dropdown-menu class="book-list-row__dropdown">
          <el-dropdown-item command="favorite">
            <el-icon class="book-list-row__menu-heart"><HeartIcon :size="16" /></el-icon>
            {{ isFavorited ? '从喜欢移除' : '添加到喜欢' }}
          </el-dropdown-item>
          <el-dropdown-item command="bookshelf" :icon="Reading">添加到书架</el-dropdown-item>
          <el-dropdown-item command="multi" :icon="Select">多选</el-dropdown-item>
          <el-dropdown-item command="info" :icon="InfoFilled">详细信息</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <BookDetailDialog v-model:visible="showDetailDialog" :book="book" />
    <AddToBookshelfDialog
      v-model:visible="showAddToShelfDialog"
      :book-ids="[book.id]"
      @success="onAddToShelfSuccess"
    />
  </article>
</template>

<style scoped>
.book-list-row {
  position: relative;
  display: grid;
  grid-template-columns: 48px 32px 1fr auto 32px;
  align-items: center;
  gap: 16px;
  padding: 14px 8px;
  border-bottom: 1px solid var(--sanko-border);
  cursor: pointer;
  transition: background 0.15s;
}

.book-list-row:hover {
  background: rgba(0, 90, 43, 0.04);
}

.book-list-row__cover {
  width: 48px;
  aspect-ratio: 3 / 4;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.book-list-row__cover :deep(.book-cover-face__title) {
  font-size: 10px;
  letter-spacing: 2px;
}

.book-list-row__cover :deep(.book-cover-face__en) {
  display: none;
}

.book-list-row__heart {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.book-list-row__heart--active {
  color: #e74c3c;
}

.book-list-row__title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.book-list-row__meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  text-align: right;
}

.book-list-row__author {
  font-size: 14px;
  color: var(--sanko-text-secondary);
  min-width: 80px;
}

.book-list-row__progress {
  font-size: 14px;
  color: var(--sanko-text-secondary);
  min-width: 64px;
}

.book-list-row__menu {
  color: var(--sanko-text-secondary);
  transform: rotate(90deg);
}

.book-list-row__checkbox-wrap :deep(.book-select-check) {
  position: static;
  border-color: var(--sanko-border);
  box-shadow: none;
}

.book-list-row__menu-heart {
  margin-right: 6px;
  color: var(--sanko-text-secondary);
}
</style>

<style>
.book-list-row__dropdown.el-dropdown-menu {
  background: #f5f0e8;
  border: 1px solid #d9d0c0;
  padding: 6px 0;
}

.book-list-row__dropdown .el-dropdown-menu__item {
  font-size: 14px;
  padding: 8px 20px;
}
</style>
