<script setup lang="ts">
defineProps<{
  active: boolean
}>()
</script>

<template>
  <svg
    class="reader-bookmark-icon"
    :class="{ 'reader-bookmark-icon--active': active }"
    width="18"
    height="24"
    viewBox="0 0 18 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      class="reader-bookmark-icon__shape"
      d="M2 1.5h14v20.5l-7-4.8L2 22V1.5z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.reader-bookmark-icon {
  color: var(--sanko-green);
  display: block;
}

.reader-bookmark-icon__shape {
  transition:
    fill 0.15s,
    stroke 0.15s;
}

.reader-bookmark-icon--active .reader-bookmark-icon__shape {
  fill: currentColor;
  stroke: currentColor;
}
</style>
