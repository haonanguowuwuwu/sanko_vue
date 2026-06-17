<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import IconTooltip from '@/components/IconTooltip.vue'
import { useBooksStore, type SortField, type SortOrder } from '@/stores/books'

const booksStore = useBooksStore()
const { sortField, sortOrder } = storeToRefs(booksStore)

const fieldOptions: { value: SortField; label: string }[] = [
  { value: 'recent', label: '按最近阅读' },
  { value: 'title', label: '书名' },
  { value: 'addedAt', label: '按添加时间' },
  { value: 'readDuration', label: '按阅读时长' },
  { value: 'author', label: '作者名' },
  { value: 'progress', label: '按阅读进度' },
  { value: 'fileSize', label: '文件大小' },
]

const orderOptions: { value: SortOrder; label: string }[] = [
  { value: 'asc', label: '升序' },
  { value: 'desc', label: '降序' },
]

const selectField = (field: SortField) => {
  booksStore.setSortField(field)
}

const selectOrder = (order: SortOrder) => {
  booksStore.setSortOrder(order)
}
</script>

<template>
  <el-popover trigger="click" placement="bottom-end" :width="220" popper-class="book-sort-popover">
    <template #reference>
      <IconTooltip content="排序">
        <el-button class="header-icon-btn sort-trigger" text>
          <svg class="sort-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 6h14M4 10h10M4 14h6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
            <path
              d="M18 8v10M18 18l-3-3M18 18l3-3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </el-button>
      </IconTooltip>
    </template>

    <div class="sort-menu">
      <button
        v-for="option in fieldOptions"
        :key="option.value"
        type="button"
        class="sort-menu__item"
        :class="{ 'sort-menu__item--active': sortField === option.value }"
        @click="selectField(option.value)"
      >
        <span>{{ option.label }}</span>
        <el-icon v-if="sortField === option.value" class="sort-menu__check"><Check /></el-icon>
      </button>

      <div class="sort-menu__divider" />

      <button
        v-for="option in orderOptions"
        :key="option.value"
        type="button"
        class="sort-menu__item"
        :class="{ 'sort-menu__item--active': sortOrder === option.value }"
        @click="selectOrder(option.value)"
      >
        <span>{{ option.label }}</span>
        <el-icon v-if="sortOrder === option.value" class="sort-menu__check"><Check /></el-icon>
      </button>
    </div>
  </el-popover>
</template>

<style scoped>
.sort-trigger {
  padding: 8px;
  font-size: 18px;
  color: var(--sanko-green);
}

.sort-icon {
  width: 20px;
  height: 20px;
  color: var(--sanko-green);
}

.sort-menu {
  padding: 6px 0;
}

.sort-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
}

.sort-menu__item:hover {
  color: var(--sanko-text);
}

.sort-menu__item--active {
  color: var(--sanko-text);
  font-weight: 500;
}

.sort-menu__check {
  font-size: 14px;
  color: var(--sanko-green);
}

.sort-menu__divider {
  height: 1px;
  margin: 6px 12px;
  background: var(--sanko-border);
}
</style>

<style>
.book-sort-popover.el-popover.el-popper {
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--sanko-border);
}
</style>
