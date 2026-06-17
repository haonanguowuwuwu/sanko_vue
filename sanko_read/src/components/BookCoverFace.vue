<script setup lang="ts">
import type { Book } from '@/types/book'

defineProps<{
  book: Book
  size?: 'normal' | 'large'
}>()
</script>

<template>
  <div
    class="book-cover-face"
    :class="{ 'book-cover-face--large': size === 'large' }"
    :style="{ background: book.coverColor }"
  >
    <p v-if="book.coverSubtitle" class="book-cover-face__en">{{ book.coverSubtitle }}</p>
    <p class="book-cover-face__title">{{ book.coverTitle }}</p>
  </div>
</template>

<style scoped>
.book-cover-face {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  text-align: center;
  color: #fff;
}

.book-cover-face--large {
  padding: 24px 16px;
}

.book-cover-face__en {
  margin: 0 0 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

.book-cover-face--large .book-cover-face__en {
  font-size: 12px;
  margin-bottom: 16px;
}

.book-cover-face__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 4px;
}

.book-cover-face--large .book-cover-face__title {
  font-size: 24px;
  letter-spacing: 6px;
}
</style>
