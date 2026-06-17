<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'

const booksStore = useBooksStore()
const { favoriteIds, searchableSortedBooks } = storeToRefs(booksStore)

const favoriteBooks = computed(() =>
  searchableSortedBooks.value.filter((b) => favoriteIds.value.has(b.id)),
)
</script>

<template>
  <BookListGrid
    :books="favoriteBooks"
    empty-title="喜爱的图书为空"
    empty-description="添加书库的书为喜欢"
  />
</template>
