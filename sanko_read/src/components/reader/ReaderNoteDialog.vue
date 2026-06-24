<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { HighlightColor } from '@/types/reader'
import { HIGHLIGHT_COLOR_IDS, getHighlightColorDef } from '@/reader/highlightColors'

const props = withDefaults(
  defineProps<{
    visible: boolean
    quote: string
    initialNote?: string
    initialColor?: HighlightColor
    editingId?: string
  }>(),
  {
    initialNote: '',
    initialColor: 'green',
    editingId: undefined,
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [payload: { note: string; color: HighlightColor; editingId?: string }]
  delete: [editingId: string]
}>()

const isEditing = computed(() => Boolean(props.editingId))

const noteText = ref('')
const selectedColor = ref<HighlightColor>('green')

watch(
  () => props.visible,
  (open) => {
    if (open) {
      noteText.value = props.initialNote
      selectedColor.value = props.initialColor
    }
  },
)

const colors = HIGHLIGHT_COLOR_IDS

const accentStyle = computed(() => {
  const def = getHighlightColorDef(selectedColor.value)
  return {
    bar: def.accent,
    inputBg: def.inputBg,
    primary: def.accent,
  }
})

function swatchStyle(color: HighlightColor) {
  return { background: getHighlightColorDef(color).swatch }
}

const handleClose = () => {
  emit('update:visible', false)
}

const copyQuote = async () => {
  try {
    await navigator.clipboard.writeText(props.quote)
    ElMessage.success('已复制原文')
  } catch {
    ElMessage.info('复制失败，请手动复制')
  }
}

const handleConfirm = () => {
  if (!noteText.value.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }
  emit('confirm', {
    note: noteText.value,
    color: selectedColor.value,
    editingId: props.editingId,
  })
  emit('update:visible', false)
}

const handleDelete = () => {
  if (!props.editingId) return
  emit('delete', props.editingId)
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="480px"
    :show-close="false"
    append-to-body
    align-center
    class="reader-note-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="reader-note-dialog__header">
      <div class="reader-note-dialog__quote">
        <span class="reader-note-dialog__bar" :style="{ background: accentStyle.bar }" />
        <p>{{ quote }}</p>
      </div>
      <button
        v-if="isEditing"
        type="button"
        class="reader-note-dialog__delete"
        @click="handleDelete"
      >
        删除
      </button>
    </div>

    <el-input
      v-model="noteText"
      type="textarea"
      :rows="4"
      placeholder="写下你的笔记..."
      class="reader-note-dialog__input"
      :style="{ '--note-input-bg': accentStyle.inputBg }"
    />

    <div class="reader-note-dialog__footer">
      <div class="reader-note-dialog__colors">
        <button
          v-for="color in colors"
          :key="color"
          type="button"
          class="reader-note-dialog__color"
          :class="{ 'is-active': selectedColor === color }"
          :style="swatchStyle(color)"
          :title="getHighlightColorDef(color).label"
          @click="selectedColor = color"
        />
      </div>
      <div class="reader-note-dialog__actions">
        <button type="button" class="reader-note-dialog__action" @click="copyQuote">复制原文</button>
        <button type="button" class="reader-note-dialog__action" @click="handleClose">取消</button>
        <button
          type="button"
          class="reader-note-dialog__action reader-note-dialog__action--primary"
          :style="{ color: accentStyle.primary }"
          @click="handleConfirm"
        >
          确认
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.reader-note-dialog__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.reader-note-dialog__quote {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.reader-note-dialog__delete {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0;
  font-size: 14px;
  color: #c45656;
  cursor: pointer;
  line-height: 1.7;
}

.reader-note-dialog__delete:hover {
  color: #a03030;
}

.reader-note-dialog__bar {
  flex-shrink: 0;
  width: 4px;
  border-radius: 2px;
  transition: background 0.15s;
}

.reader-note-dialog__quote p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--sanko-text);
}

.reader-note-dialog__input :deep(.el-textarea__inner) {
  background: var(--note-input-bg, rgba(120, 200, 140, 0.18));
  border: none;
  box-shadow: none;
  border-radius: 8px;
  transition: background 0.15s;
}

.reader-note-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 12px;
}

.reader-note-dialog__colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 160px;
}

.reader-note-dialog__color {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s;
}

.reader-note-dialog__color.is-active {
  border-color: var(--sanko-text);
}

.reader-note-dialog__actions {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.reader-note-dialog__action {
  border: none;
  background: none;
  padding: 0;
  font-size: 14px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.reader-note-dialog__action--primary {
  font-weight: 600;
  transition: color 0.15s;
}

.reader-note-dialog__action:hover {
  color: var(--sanko-text);
}
</style>

<style>
.reader-note-dialog .el-dialog {
  background: #f5f0e8;
  border-radius: 12px;
}

.reader-note-dialog .el-dialog__header {
  display: none;
}

.reader-note-dialog .el-dialog__body {
  padding: 24px;
}
</style>
