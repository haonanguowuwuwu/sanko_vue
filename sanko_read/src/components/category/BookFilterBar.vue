<script setup lang="ts">
export interface FilterOption {
  label: string
  value: string
}

export interface FilterRow {
  label: string
  key: string
  options: FilterOption[]
  showMore?: boolean
  showTagShield?: boolean
}

const props = defineProps<{
  rows: FilterRow[]
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
  more: [key: string]
  tagShield: []
}>()

const select = (key: string, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="book-filter-bar">
    <div
      v-for="row in rows"
      :key="row.key"
      class="book-filter-bar__row"
      :class="{ 'book-filter-bar__row--tags': row.key === 'tags' }"
    >
      <span class="book-filter-bar__label">{{ row.label }}</span>
      <div class="book-filter-bar__options">
        <button
          v-for="option in row.options"
          :key="option.value"
          type="button"
          class="book-filter-bar__chip"
          :class="{ 'is-active': modelValue[row.key] === option.value }"
          @click="select(row.key, option.value)"
        >
          {{ option.label }}
        </button>
        <button
          v-if="row.showMore"
          type="button"
          class="book-filter-bar__more"
          @click="emit('more', row.key)"
        >
          更多
        </button>
        <button
          v-if="row.showTagShield"
          type="button"
          class="book-filter-bar__shield"
          @click="emit('tagShield')"
        >
          标签屏蔽
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.book-filter-bar__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.6;
}

.book-filter-bar__label {
  flex-shrink: 0;
  width: 40px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-filter-bar__options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  flex: 1;
  min-width: 0;
}

.book-filter-bar__chip {
  padding: 2px 4px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--sanko-text);
  cursor: pointer;
  border-radius: 4px;
  transition:
    background 0.15s,
    color 0.15s;
}

.book-filter-bar__chip:hover {
  color: var(--sanko-green);
}

.book-filter-bar__chip.is-active {
  color: var(--sanko-green);
  font-weight: 600;
}

.book-filter-bar__row--tags .book-filter-bar__chip.is-active {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-weight: 500;
}

.book-filter-bar__more {
  padding: 2px 4px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--sanko-green);
  cursor: pointer;
}

.book-filter-bar__shield {
  margin-left: auto;
  padding: 4px 14px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.book-filter-bar__shield:hover {
  background: var(--sanko-green-hover);
}
</style>
