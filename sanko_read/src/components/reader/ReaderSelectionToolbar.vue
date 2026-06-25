<script setup lang="ts">
import { EditPen, Notebook, Delete } from '@element-plus/icons-vue'
import type { HighlightColor } from '@/types/reader'
import { HIGHLIGHT_COLOR_IDS, getHighlightColorDef } from '@/reader/highlightColors'

const props = withDefaults(
  defineProps<{
    visible: boolean
    x: number
    y: number
    showDelete?: boolean
    placement?: 'above' | 'left'
  }>(),
  { placement: 'above' },
)

const emit = defineEmits<{
  highlight: [color: HighlightColor]
  note: []
  delete: []
  close: []
}>()

const colors = HIGHLIGHT_COLOR_IDS

function swatchStyle(color: HighlightColor) {
  return { background: getHighlightColorDef(color).swatch }
}
</script>

<template>
  <div
    v-if="visible"
    class="selection-toolbar"
    :class="{ 'selection-toolbar--left': props.placement === 'left' }"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.prevent
  >
    <div class="selection-toolbar__actions">
      <button type="button" class="selection-toolbar__btn" title="高亮" @click.stop="emit('highlight', 'green')">
        <el-icon><EditPen /></el-icon>
      </button>
      <button type="button" class="selection-toolbar__btn" title="笔记" @click.stop="emit('note')">
        <el-icon><Notebook /></el-icon>
      </button>
      <button
        v-if="showDelete"
        type="button"
        class="selection-toolbar__btn selection-toolbar__btn--delete"
        title="删除"
        @click.stop="emit('delete')"
      >
        <el-icon><Delete /></el-icon>
      </button>
    </div>
    <div class="selection-toolbar__colors">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="selection-toolbar__color"
        :style="swatchStyle(color)"
        :title="getHighlightColorDef(color).label"
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

.selection-toolbar--left {
  transform: translate(0, -50%);
}

.selection-toolbar__actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
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

.selection-toolbar__btn--delete {
  color: #c45656;
}

.selection-toolbar__btn--delete:hover {
  background: rgba(196, 86, 86, 0.1);
}

.selection-toolbar__colors {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  max-width: 72px;
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
</style>
