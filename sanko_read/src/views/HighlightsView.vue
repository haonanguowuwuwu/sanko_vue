<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/components/EmptyState.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'

const annotationsStore = useReaderAnnotationsStore()
const { highlightOnly } = storeToRefs(annotationsStore)
</script>

<template>
  <EmptyState v-if="highlightOnly.length === 0" title="高亮为空" />

  <div v-else class="annotation-list">
    <AnnotationCard v-for="item in highlightOnly" :key="item.id" :item="item" mode="highlight" />
  </div>
</template>

<style scoped>
.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
