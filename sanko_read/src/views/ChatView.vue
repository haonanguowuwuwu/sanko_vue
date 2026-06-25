<script setup lang="ts">
import ChatPanel from '@/components/ChatPanel.vue'
</script>

<template>
  <div class="chat-view">
    <ChatPanel />
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - var(--sanko-header-height) - 64px);
}
</style>
