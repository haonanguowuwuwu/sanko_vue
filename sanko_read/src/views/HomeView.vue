<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import BookListGrid from '@/components/BookListGrid.vue'
import { useBooksStore } from '@/stores/books'
import { useSettingsStore } from '@/stores/settings'
import { useBookshelvesStore } from '@/stores/bookshelves'

const booksStore = useBooksStore()
const settingsStore = useSettingsStore()
const bookshelvesStore = useBookshelvesStore()
const { sortedBooks, searchableSortedBooks } = storeToRefs(booksStore)
const { hideBookshelfBooks } = storeToRefs(settingsStore)
const { shelves } = storeToRefs(bookshelvesStore)

const bookshelfBookIds = computed(() => {
  const ids = new Set<string>()
  shelves.value.forEach((shelf) => shelf.bookIds.forEach((id) => ids.add(id)))
  return ids
})

const displayBooks = computed(() => {
  let list = searchableSortedBooks.value
  if (hideBookshelfBooks.value) {
    list = list.filter((b) => !bookshelfBookIds.value.has(b.id))
  }
  return list
})

const emptyTitle = computed(() => {
  if (sortedBooks.value.length === 0) return '图书库为空'
  if (displayBooks.value.length === 0) return '暂无展示图书'
  return undefined
})

const emptyDescription = computed(() => {
  if (sortedBooks.value.length === 0) return '请点击右上角的按钮从本地导入图书'
  if (displayBooks.value.length === 0) {
    return '已开启「隐藏添加到书架的图书」，主页暂无可见图书'
  }
  return undefined
})
</script>

<template>
  <BookListGrid
    :books="displayBooks"
    :empty-title="emptyTitle"
    :empty-description="emptyDescription"
  />
</template>
