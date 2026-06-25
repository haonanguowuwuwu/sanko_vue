<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/components/EmptyState.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'

const annotationsStore = useReaderAnnotationsStore()
const { highlightOnly } = storeToRefs(annotationsStore)
</script>

<template>
  <div class="annotation-page">
    <EmptyState v-if="highlightOnly.length === 0" title="高亮为空" />

    <div v-else class="annotation-list">
      <AnnotationCard v-for="item in highlightOnly" :key="item.id" :item="item" mode="highlight" />
    </div>
  </div>
</template>

<style scoped>
.annotation-page {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.annotation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 24px;
}
</style>
