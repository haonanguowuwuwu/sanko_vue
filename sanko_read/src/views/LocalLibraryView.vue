<script setup lang="ts">
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'

const booksStore = useBooksStore()
const { searchableSortedBooks, sortedBooks } = storeToRefs(booksStore)
</script>

<template>
  <BookListGrid
    :books="searchableSortedBooks"
    :empty-title="sortedBooks.length === 0 ? '图书库为空' : undefined"
    :empty-description="sortedBooks.length === 0 ? '请点击右上角的按钮从本地导入图书' : undefined"
  />
</template>
