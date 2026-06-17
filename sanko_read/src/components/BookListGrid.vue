<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Book } from '@/types/book'
import EmptyState from '@/components/EmptyState.vue'
import BookCard from '@/components/BookCard.vue'
import BookListRow from '@/components/BookListRow.vue'
import BookListToolbar from '@/components/BookListToolbar.vue'
import BookMultiSelectBar from '@/components/BookMultiSelectBar.vue'
import { useBooksStore } from '@/stores/books'
import { useSettingsStore } from '@/stores/settings'
import { filterBooksByReadStatus } from '@/utils/bookReadStatus'

const CARD_MIN_WIDTH = 120
const CARD_MAX_WIDTH = 240

const props = defineProps<{
  books: Book[]
  emptyTitle?: string
  emptyDescription?: string
}>()

const booksStore = useBooksStore()
const { selectionMode } = storeToRefs(booksStore)
const { bookViewMode, bookReadStatusFilter, cardCoverSize } = storeToRefs(useSettingsStore())

const cardWidth = computed(() =>
  Math.round(
    CARD_MIN_WIDTH + (1 - cardCoverSize.value / 100) * (CARD_MAX_WIDTH - CARD_MIN_WIDTH),
  ),
)

const filteredBooks = computed(() =>
  filterBooksByReadStatus(props.books, bookReadStatusFilter.value),
)

const bookIds = computed(() => filteredBooks.value.map((b) => b.id))

const showLibraryEmpty = computed(
  () => props.books.length === 0 && Boolean(props.emptyTitle),
)

const showFilterEmpty = computed(
  () => props.books.length > 0 && filteredBooks.value.length === 0,
)
</script>

<template>
  <div class="book-list-page" :class="{ 'book-list-page--selecting': selectionMode }">
    <div class="book-list-page__body">
      <EmptyState
        v-if="showLibraryEmpty"
        :title="emptyTitle!"
        :description="emptyDescription"
      />

      <EmptyState
        v-else-if="showFilterEmpty"
        title="暂无符合条件的图书"
        description="请尝试切换其他阅读状态筛选"
      />

      <template v-else-if="filteredBooks.length > 0">
        <div
          v-if="bookViewMode === 'grid'"
          class="book-grid"
          :style="{ '--book-card-width': `${cardWidth}px` }"
        >
          <BookCard v-for="book in filteredBooks" :key="book.id" :book="book" />
        </div>

        <div v-else class="book-rows">
          <BookListRow v-for="book in filteredBooks" :key="book.id" :book="book" />
        </div>
      </template>
    </div>

    <BookListToolbar :total="props.books.length" />

    <BookMultiSelectBar v-if="selectionMode" :book-ids="bookIds" />
  </div>
</template>

<style scoped>
.book-list-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.book-list-page__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.book-list-page--selecting {
  padding-bottom: 72px;
}

.book-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.book-rows {
  display: flex;
  flex-direction: column;
}
</style>
