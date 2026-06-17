<script setup lang="ts">
import { computed } from 'vue'
import type { ReaderHighlight } from '@/types/reader'

const props = defineProps<{
  text: string
  highlights: ReaderHighlight[]
}>()

interface Segment {
  text: string
  color?: string
  note?: string
  highlightId?: string
}

const segments = computed(() => {
  const sorted = [...props.highlights].sort((a, b) => a.start - b.start)
  const result: Segment[] = []
  let cursor = 0

  for (const hl of sorted) {
    const start = Math.max(hl.start, cursor)
    const end = Math.min(hl.end, props.text.length)
    if (start > cursor) {
      result.push({ text: props.text.slice(cursor, start) })
    }
    if (end > start) {
      result.push({
        text: props.text.slice(start, end),
        color: hl.color,
        note: hl.note,
        highlightId: hl.id,
      })
      cursor = end
    }
  }

  if (cursor < props.text.length) {
    result.push({ text: props.text.slice(cursor) })
  }

  return result.length ? result : [{ text: props.text }]
})

const colorClass = (color: string) => `highlight-${color}`
</script>

<template>
  <span class="highlighted-text">
    <template v-for="(seg, i) in segments" :key="i">
      <mark
        v-if="seg.color"
        class="highlight-mark"
        :class="colorClass(seg.color)"
        :title="seg.note"
        :data-highlight-id="seg.highlightId"
      >
        {{ seg.text }}
      </mark>
      <span v-else>{{ seg.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.highlighted-text {
  user-select: text;
}

.highlight-mark {
  padding: 2px 0;
  border-radius: 2px;
  cursor: default;
}

.highlight-blue {
  background: rgba(100, 180, 255, 0.35);
}

.highlight-green {
  background: rgba(120, 200, 140, 0.45);
}

.highlight-gray {
  background: rgba(0, 0, 0, 0.06);
}
</style>
