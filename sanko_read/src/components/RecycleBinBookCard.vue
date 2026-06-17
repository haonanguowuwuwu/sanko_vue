<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MoreFilled, RefreshRight, Delete } from '@element-plus/icons-vue'
import type { Book } from '@/types/book'
import { useBooksStore } from '@/stores/books'
import BookCoverFace from '@/components/BookCoverFace.vue'
import BookDeleteDialog from '@/components/BookDeleteDialog.vue'

const props = defineProps<{
  book: Book
}>()

const booksStore = useBooksStore()
const menuVisible = ref(false)
const showDeleteDialog = ref(false)

const handleCommand = (command: string) => {
  menuVisible.value = false
  switch (command) {
    case 'restore':
      void booksStore.restoreFromRecycleBin(props.book.id).then(() => {
        ElMessage.success('已恢复书籍')
      })
      break
    case 'delete':
      showDeleteDialog.value = true
      break
  }
}

const confirmPermanentDelete = async () => {
  await booksStore.permanentlyDeleteFromRecycleBin(props.book.id)
  ElMessage.success('已永久删除')
}
</script>

<template>
  <article class="recycle-book-card">
    <div class="recycle-book-card__cover">
      <BookCoverFace :book="book" />
    </div>

    <div class="recycle-book-card__footer">
      <p class="recycle-book-card__title">{{ book.title }}</p>

      <el-dropdown v-model:visible="menuVisible" trigger="click" @command="handleCommand">
        <button type="button" class="recycle-book-card__menu" @click.stop>
          <el-icon :size="18"><MoreFilled /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="restore">
              <el-icon><RefreshRight /></el-icon>
              恢复
            </el-dropdown-item>
            <el-dropdown-item command="delete">
              <el-icon><Delete /></el-icon>
              永久删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <BookDeleteDialog v-model:visible="showDeleteDialog" @confirm="confirmPermanentDelete" />
  </article>
</template>

<style scoped>
.recycle-book-card {
  width: 160px;
}

.recycle-book-card__cover {
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  opacity: 0.85;
}

.recycle-book-card__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.recycle-book-card__title {
  margin: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recycle-book-card__menu {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.recycle-book-card__menu:hover {
  background: rgba(0, 90, 43, 0.06);
  color: var(--sanko-green);
}
</style>
