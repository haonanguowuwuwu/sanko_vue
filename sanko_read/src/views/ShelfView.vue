<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'
import { useBookshelvesStore } from '@/stores/bookshelves'

const route = useRoute()
const booksStore = useBooksStore()
const bookshelvesStore = useBookshelvesStore()
const { books } = storeToRefs(booksStore)

const shelfId = computed(() => route.params.shelfId as string)
const shelf = computed(() => bookshelvesStore.getShelfById(shelfId.value))

const shelfBooks = computed(() => {
  if (!shelf.value) return []
  const idSet = new Set(shelf.value.bookIds)
  return booksStore.sortBookList(books.value.filter((b) => idSet.has(b.id)))
})

const emptyTitle = computed(() => {
  if (!shelf.value) return '书架不存在'
  if (shelfBooks.value.length === 0) return '该书架为空'
  return undefined
})

const emptyDescription = computed(() => {
  if (!shelf.value) return '请从侧边栏选择其他书架'
  if (shelfBooks.value.length === 0) return '请点击书籍菜单中的按钮加入书架'
  return undefined
})
</script>

<template>
  <BookListGrid
    :books="shelfBooks"
    :empty-title="emptyTitle"
    :empty-description="emptyDescription"
  />
</template>
