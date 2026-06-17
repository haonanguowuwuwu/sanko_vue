<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { EditPen, ArrowRight } from '@element-plus/icons-vue'
import type { ReaderHighlight } from '@/types/reader'
import { useBooksStore } from '@/stores/books'

const props = defineProps<{
  item: ReaderHighlight
  mode: 'note' | 'highlight'
}>()

const router = useRouter()
const booksStore = useBooksStore()

const bookTitle = computed(() => {
  const book = booksStore.getBookById(props.item.bookId)
  return book?.title.replace(/[《》]/g, '') ?? '未知书籍'
})

const sourceLabel = computed(() => `来自 ${bookTitle.value} ${props.item.chapter}`)

const goToReader = () => {
  router.push({ name: 'reader', params: { id: props.item.bookId } })
}
</script>

<template>
  <article class="annotation-card">
    <time class="annotation-card__time">{{ item.createdAt }}</time>

    <p v-if="mode === 'note' && item.note" class="annotation-card__note">{{ item.note }}</p>

    <p class="annotation-card__quote" :class="{ 'annotation-card__quote--solo': mode === 'highlight' }">
      {{ item.quote }}
    </p>

    <footer class="annotation-card__footer">
      <span class="annotation-card__source">{{ sourceLabel }}</span>
      <div class="annotation-card__actions">
        <el-button
          v-if="mode === 'note'"
          :icon="EditPen"
          text
          circle
          class="annotation-card__action"
          @click="goToReader"
        />
        <el-button :icon="ArrowRight" text circle class="annotation-card__action" @click="goToReader" />
      </div>
    </footer>
  </article>
</template>

<style scoped>
.annotation-card {
  background: #f5f0e8;
  border: 1px solid #ebe4d8;
  border-radius: 8px;
  padding: 16px 20px;
  max-width: 720px;
}

.annotation-card__time {
  display: block;
  font-size: 12px;
  color: var(--sanko-text-secondary);
  margin-bottom: 10px;
}

.annotation-card__note {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sanko-text);
}

.annotation-card__quote {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--sanko-text-secondary);
}

.annotation-card__quote--solo {
  margin-top: 4px;
  font-size: 15px;
  color: var(--sanko-text);
}

.annotation-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.annotation-card__source {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.annotation-card__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.annotation-card__action {
  color: var(--sanko-text-secondary);
  font-size: 16px;
}
</style>
