<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, type BookViewMode } from '@/stores/settings'
import { BOOK_READ_STATUS_OPTIONS } from '@/utils/bookReadStatus'

defineProps<{
  total: number
}>()

const settingsStore = useSettingsStore()
const { bookViewMode, bookReadStatusFilter, cardCoverSize } = storeToRefs(settingsStore)

const setViewMode = (mode: BookViewMode) => {
  bookViewMode.value = mode
}
</script>

<template>
  <div class="book-list-toolbar">
    <div class="book-list-toolbar__left">
      <span class="book-list-toolbar__count">一共 {{ total }} 本书</span>
      <el-dropdown trigger="click" @command="bookReadStatusFilter = $event">
        <button type="button" class="book-list-toolbar__filter">
          {{ bookReadStatusFilter }}
          <el-icon :size="12"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="status in BOOK_READ_STATUS_OPTIONS"
              :key="status"
              :command="status"
            >
              {{ status }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="book-list-toolbar__right">
      <div v-if="bookViewMode === 'grid'" class="card-size-slider">
        <span class="card-size-slider__label">大</span>
        <input
          v-model.number="cardCoverSize"
          class="card-size-slider__input"
          type="range"
          min="0"
          max="100"
          step="1"
          aria-label="调整卡片大小"
        />
        <span class="card-size-slider__label">小</span>
      </div>

      <div class="book-list-toolbar__views">
        <button
          type="button"
          class="view-mode-btn"
          :class="{ 'view-mode-btn--active': bookViewMode === 'grid' }"
          title="卡片模式"
          @click="setViewMode('grid')"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor" />
            <rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          class="view-mode-btn"
          :class="{ 'view-mode-btn--active': bookViewMode === 'list' }"
          title="列表模式"
          @click="setViewMode('list')"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <rect x="2" y="4" width="16" height="2.5" rx="1" fill="currentColor" />
            <rect x="2" y="9" width="16" height="2.5" rx="1" fill="currentColor" />
            <rect x="2" y="14" width="16" height="2.5" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 14px 4px 0;
  border-top: 1px solid var(--sanko-border);
  background: var(--sanko-bg);
}

.book-list-toolbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-list-toolbar__count {
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.book-list-toolbar__filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--sanko-text);
  cursor: pointer;
}

.book-list-toolbar__filter:hover {
  color: var(--sanko-green);
}

.book-list-toolbar__right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.card-size-slider {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-size-slider__label {
  font-size: 14px;
  color: var(--sanko-text-secondary);
  user-select: none;
}

.card-size-slider__input {
  width: 120px;
  height: 20px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.card-size-slider__input::-webkit-slider-runnable-track {
  height: 2px;
  background: #b0b0b0;
  border-radius: 1px;
}

.card-size-slider__input::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -6px;
  border: 2px solid #888;
  border-radius: 50%;
  background: #fff;
  box-shadow: none;
}

.card-size-slider__input::-moz-range-track {
  height: 2px;
  background: #b0b0b0;
  border-radius: 1px;
}

.card-size-slider__input::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: 2px solid #888;
  border-radius: 50%;
  background: #fff;
}

.book-list-toolbar__views {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.view-mode-btn svg {
  width: 18px;
  height: 18px;
}

.view-mode-btn:hover {
  color: var(--sanko-green);
  background: rgba(0, 90, 43, 0.06);
}

.view-mode-btn--active {
  color: var(--sanko-green);
  background: rgba(0, 90, 43, 0.1);
}
</style>
