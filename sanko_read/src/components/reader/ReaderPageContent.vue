<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { ReaderBlock } from '@/types/reader'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import ReaderHighlightedText from '@/components/reader/ReaderHighlightedText.vue'

const props = defineProps<{
  bookId: string
  blocks: ReaderBlock[]
}>()

const emit = defineEmits<{
  select: [payload: { blockId: string; text: string; start: number; end: number; rect: DOMRect }]
}>()

const annotationsStore = useReaderAnnotationsStore()
const { highlights } = storeToRefs(annotationsStore)

const getBlockHighlights = (blockId: string) =>
  highlights.value.filter((h) => h.bookId === props.bookId && h.blockId === blockId)

const onMouseUp = (block: ReaderBlock, event: MouseEvent) => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) return

  const range = selection.getRangeAt(0)
  const target = event.currentTarget as HTMLElement
  if (!target.contains(range.commonAncestorContainer)) return

  const selectedText = selection.toString().trim()
  if (!selectedText) return

  const preRange = range.cloneRange()
  preRange.selectNodeContents(target)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length
  const end = start + selectedText.length

  const rect = range.getBoundingClientRect()
  emit('select', { blockId: block.id, text: selectedText, start, end, rect })
}

const blockClass = (block: ReaderBlock) => ({
  'reader-block--gray': block.defaultBg === 'gray',
  'reader-block--title': block.type === 'title',
  'reader-block--subtitle': block.type === 'subtitle',
})
</script>

<template>
  <div class="reader-page-content">
    <div
      v-for="block in blocks"
      :key="block.id"
      class="reader-block"
      :class="blockClass(block)"
      @mouseup="onMouseUp(block, $event)"
    >
      <ReaderHighlightedText :text="block.text" :highlights="getBlockHighlights(block.id)" />
    </div>
  </div>
</template>

<style scoped>
.reader-page-content {
  flex: 1;
}

.reader-block {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.9;
  color: #333;
  text-align: justify;
  user-select: text;
}

.reader-block--title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.reader-block--subtitle {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.reader-block--gray {
  background: rgba(0, 0, 0, 0.04);
  padding: 8px 10px;
  border-radius: 2px;
}
</style>
