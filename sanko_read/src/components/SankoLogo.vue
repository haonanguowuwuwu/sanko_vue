<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg
    class="sanko-logo"
    :width="size ?? 28"
    :height="size ? size * 1.25 : 35"
    viewBox="0 0 80 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- 三条手绘笔划 -->
    <path
      d="M6 14C10 10 22 8 38 14C52 19 68 28 72 34C74 38 70 40 66 38C48 28 28 22 12 26C6 28 4 18 6 14Z"
      fill="currentColor"
    />
    <path
      d="M10 42C16 38 28 40 42 46C48 48 46 54 42 54C30 52 18 50 12 48C8 46 8 44 10 42Z"
      fill="currentColor"
    />
    <path
      d="M12 66C20 62 34 64 50 72C56 75 54 82 48 82C34 78 20 76 14 72C10 70 10 68 12 66Z"
      fill="currentColor"
    />
  </svg>
</template>

<style scoped>
.sanko-logo {
  color: var(--sanko-green);
  flex-shrink: 0;
}
</style>
