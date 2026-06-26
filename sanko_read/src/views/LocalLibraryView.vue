<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'
import { useUserStore } from '@/stores/user'

const booksStore = useBooksStore()
const userStore = useUserStore()
const { searchableSortedBooks, sortedBooks } = storeToRefs(booksStore)

const emptyTitle = computed(() => {
  if (!userStore.isLoggedIn) return '请先登录'
  if (sortedBooks.value.length === 0) return '图书库为空'
  return undefined
})

const emptyDescription = computed(() => {
  if (!userStore.isLoggedIn) return '登录后可查看与同步您的个人书架'
  if (sortedBooks.value.length === 0) return '从书城加入书籍，或点击右上角「添加书籍」'
  return undefined
})
</script>

<template>
  <BookListGrid
    :books="searchableSortedBooks"
    :empty-title="emptyTitle"
    :empty-description="emptyDescription"
  />
</template>
