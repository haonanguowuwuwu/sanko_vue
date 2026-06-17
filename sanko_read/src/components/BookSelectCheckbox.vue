<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'

defineProps<{
  selected: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    type="button"
    class="book-select-check"
    :class="{ 'is-selected': selected }"
    aria-label="选择书籍"
    @click.stop="$emit('toggle')"
  >
    <el-icon class="book-select-check__icon" :size="14"><Check /></el-icon>
  </button>
</template>

<style scoped>
.book-select-check {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.book-select-check__icon {
  color: #d0d0d0;
  transition: color 0.15s;
}

.book-select-check.is-selected {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
}

.book-select-check.is-selected .book-select-check__icon {
  color: #fff;
}
</style>
