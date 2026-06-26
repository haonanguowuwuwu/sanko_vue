<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rating?: number
    max?: number
  }>(),
  {
    rating: 0,
    max: 5,
  },
)

const displayRating = computed(() => props.rating.toFixed(1))
const displayMax = computed(() => props.max.toFixed(1))
</script>

<template>
  <div class="book-rating-badge" aria-label="书籍评分">
    <svg class="book-rating-badge__star" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
    <span class="book-rating-badge__score">
      <span class="book-rating-badge__current">{{ displayRating }}</span>
      <span class="book-rating-badge__sep">/</span>
      <span class="book-rating-badge__max">{{ displayMax }}</span>
    </span>
  </div>
</template>

<style scoped>
.book-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.book-rating-badge__star {
  flex-shrink: 0;
  color: #9a9a9a;
}

.book-rating-badge__score {
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
}

.book-rating-badge__current {
  color: #e8a317;
}

.book-rating-badge__sep {
  color: #666;
  margin: 0 1px;
}

.book-rating-badge__max {
  color: #7cb342;
}
</style>
