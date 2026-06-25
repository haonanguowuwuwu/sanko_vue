<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import EmptyState from '@/components/EmptyState.vue'
import AnnotationCard from '@/components/AnnotationCard.vue'
import ReaderNoteDialog from '@/components/reader/ReaderNoteDialog.vue'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import type { HighlightColor, ReaderHighlight } from '@/types/reader'

const annotationsStore = useReaderAnnotationsStore()
const { notes } = storeToRefs(annotationsStore)

const showNoteDialog = ref(false)
const editingItem = ref<ReaderHighlight | null>(null)

function handleEdit(item: ReaderHighlight) {
  editingItem.value = item
  showNoteDialog.value = true
}

async function onNoteConfirm(payload: {
  note: string
  color: HighlightColor
  editingId?: string
}) {
  if (!payload.editingId) return
  await annotationsStore.updateNote(payload.editingId, payload.note, payload.color)
  editingItem.value = null
  ElMessage.success('笔记已更新')
}

async function onNoteDelete(id: string) {
  await annotationsStore.removeHighlight(id)
  editingItem.value = null
  ElMessage.success('笔记已删除')
}

function onDialogClose(visible: boolean) {
  showNoteDialog.value = visible
  if (!visible) {
    editingItem.value = null
  }
}
</script>

<template>
  <div class="annotation-page">
    <EmptyState
      v-if="notes.length === 0"
      title="笔记为空"
      description="在阅读器中选中文本后点击「笔记」即可添加。演示样本书首次阅读会自动加入示例笔记。"
    />

    <div v-else class="annotation-list">
      <AnnotationCard
        v-for="item in notes"
        :key="item.id"
        :item="item"
        mode="note"
        @edit="handleEdit"
      />
    </div>

    <ReaderNoteDialog
      :visible="showNoteDialog"
      :quote="editingItem?.quote ?? ''"
      :initial-note="editingItem?.note ?? ''"
      :initial-color="editingItem?.color ?? 'green'"
      :editing-id="editingItem?.id"
      @update:visible="onDialogClose"
      @confirm="onNoteConfirm"
      @delete="onNoteDelete"
    />
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
