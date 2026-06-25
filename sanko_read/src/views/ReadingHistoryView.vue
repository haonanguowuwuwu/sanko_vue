<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'

const booksStore = useBooksStore()
const { books, lastReadMap } = storeToRefs(booksStore)

const historyBooks = computed(() => {
  const read = books.value.filter((b) => lastReadMap.value[b.id] || b.lastReadAt)
  return [...read].sort((a, b) => {
    const ta = lastReadMap.value[a.id] ?? a.lastReadAt ?? ''
    const tb = lastReadMap.value[b.id] ?? b.lastReadAt ?? ''
    return tb.localeCompare(ta)
  })
})
</script>

<template>
  <div class="reading-history">
    <h1 class="reading-history__title">阅读历史</h1>
    <BookListGrid
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

.reading-history__list {
  flex: 1;
  min-height: 0;
}
</style>
