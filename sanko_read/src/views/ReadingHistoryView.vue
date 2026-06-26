<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BookListGrid from '@/components/BookListGrid.vue'
import { fetchReadingHistory } from '@/api/books'
import type { Book } from '@/types/book'
import { ElMessage } from 'element-plus'

const historyBooks = ref<Book[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    historyBooks.value = await fetchReadingHistory()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载阅读历史失败'
    ElMessage.error(message)
    historyBooks.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="reading-history">
    <h1 class="reading-history__title">阅读历史</h1>
    <p v-if="loading" class="reading-history__loading">加载中…</p>
    <BookListGrid
      v-else
      class="reading-history__list"
      :books="historyBooks"
      default-view-mode="list"
      empty-title="暂无阅读历史"
      empty-description="开始阅读书籍后，历史记录将显示在这里"
    />
  </div>
</template>

<style scoped>
.reading-history {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.reading-history__title {
  flex-shrink: 0;
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: var(--sanko-green);
}

.reading-history__loading {
  margin: 0;
  color: var(--sanko-text-secondary);
}

.reading-history__list {
  flex: 1;
  min-height: 0;
}
</style>
