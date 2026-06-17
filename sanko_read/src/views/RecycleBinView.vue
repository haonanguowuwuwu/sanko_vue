<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/components/EmptyState.vue'
import RecycleBinBookCard from '@/components/RecycleBinBookCard.vue'
import { useBooksStore } from '@/stores/books'

const booksStore = useBooksStore()
const { sortedTrashedBooks } = storeToRefs(booksStore)
</script>

<template>
  <EmptyState
    v-if="sortedTrashedBooks.length === 0"
    title="回收站为空"
    description="删除的图书会出现在这里，可在设置中开启或关闭回收站功能"
  />

  <div v-else class="recycle-bin-list">
    <RecycleBinBookCard v-for="book in sortedTrashedBooks" :key="book.id" :book="book" />
  </div>
</template>

<style scoped>
.recycle-bin-list {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}
</style>
