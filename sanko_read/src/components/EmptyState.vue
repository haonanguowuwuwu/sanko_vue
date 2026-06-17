<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <h2 class="empty-state__title">{{ title }}</h2>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 8px 0;
}

.empty-state__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--sanko-text);
}

.empty-state__desc {
  margin: 0;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}
</style>
