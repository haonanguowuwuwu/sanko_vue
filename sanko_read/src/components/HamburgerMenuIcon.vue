<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg
    :width="size ?? 22"
    :height="size ?? 22"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="2.8" rx="1.4" fill="currentColor" />
    <rect x="3" y="10.6" width="18" height="2.8" rx="1.4" fill="currentColor" />
    <rect x="3" y="16.2" width="18" height="2.8" rx="1.4" fill="currentColor" />
  </svg>
</template>
