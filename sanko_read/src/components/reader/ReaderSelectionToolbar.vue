<script setup lang="ts">
import { EditPen, Notebook } from '@element-plus/icons-vue'
import type { HighlightColor } from '@/types/reader'

defineProps<{
  visible: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  highlight: [color: HighlightColor]
  note: []
  close: []
}>()

const colors: HighlightColor[] = ['blue', 'green']
</script>

<template>
  <div
    v-if="visible"
    class="selection-toolbar"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.prevent
  >
    <button type="button" class="selection-toolbar__btn" title="高亮" @click.stop="emit('highlight', 'green')">
      <el-icon><EditPen /></el-icon>
    </button>
    <button type="button" class="selection-toolbar__btn" title="笔记" @click.stop="emit('note')">
      <el-icon><Notebook /></el-icon>
    </button>
    <div class="selection-toolbar__colors">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="selection-toolbar__color"
        :class="`selection-toolbar__color--${color}`"
        @click.stop="emit('highlight', color)"
      />
    </div>
  </div>
</template>

<style scoped>
.selection-toolbar {
  position: fixed;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translate(-50%, -100%) translateY(-8px);
}

.selection-toolbar__btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--sanko-green);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-toolbar__btn:hover {
  background: rgba(0, 90, 43, 0.08);
}

.selection-toolbar__colors {
  display: flex;
  gap: 8px;
}

.selection-toolbar__color {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #ddd;
  cursor: pointer;
  padding: 0;
}

.selection-toolbar__color--blue {
  background: rgba(100, 180, 255, 0.8);
}

.selection-toolbar__color--green {
  background: rgba(120, 200, 140, 0.9);
}
</style>
