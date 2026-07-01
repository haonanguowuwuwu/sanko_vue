<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--admin-text);
}

.page-header__desc {
  margin: 0;
  font-size: 14px;
  color: var(--admin-text-secondary);
}

.page-header__extra {
  flex-shrink: 0;
}
</style>
