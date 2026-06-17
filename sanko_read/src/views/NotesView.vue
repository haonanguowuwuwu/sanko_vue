<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/components/EmptyState.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'

const annotationsStore = useReaderAnnotationsStore()
const { notes } = storeToRefs(annotationsStore)
</script>

<template>
  <EmptyState v-if="notes.length === 0" title="笔记为空" />

  <div v-else class="annotation-list">
    <AnnotationCard v-for="item in notes" :key="item.id" :item="item" mode="note" />
  </div>
</template>

<style scoped>
.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
