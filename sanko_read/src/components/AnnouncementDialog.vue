<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchLatestAnnouncement, type Announcement } from '@/api/announcement'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const announcement = ref<Announcement | null>(null)

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    loading.value = true
    void fetchLatestAnnouncement()
      .then((data) => {
        announcement.value = data
      })
      .catch(() => {
        announcement.value = {
          id: 'fallback',
          title: '公告',
          content: '欢迎使用 sanko 云端书城，祝你阅读愉快！',
        }
      })
      .finally(() => {
        loading.value = false
      })
  },
  { immediate: true },
)

const close = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="420px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    align-center
    class="announcement-dialog"
    @update:model-value="(v: boolean) => !v && close()"
  >
    <div class="announcement-dialog__inner">
      <header class="announcement-dialog__header">
        <h2 class="announcement-dialog__title">{{ announcement?.title ?? '公告' }}</h2>
      </header>

      <div class="announcement-dialog__body">
        <p v-if="loading" class="announcement-dialog__loading">加载中…</p>
        <p v-else class="announcement-dialog__content">{{ announcement?.content }}</p>
      </div>

      <footer class="announcement-dialog__footer">
        <button type="button" class="announcement-dialog__confirm" @click="close">
          我知道了
        </button>
      </footer>
    </div>
  </el-dialog>
</template>

<style scoped>
.announcement-dialog__inner {
  background: #faf6ef;
  border-radius: 12px;
  overflow: hidden;
}

.announcement-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e8e0d4;
}

.announcement-dialog__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--sanko-text);
}

.announcement-dialog__body {
  min-height: 120px;
  padding: 20px 24px;
}

.announcement-dialog__content,
.announcement-dialog__loading {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--sanko-text);
  white-space: pre-line;
}

.announcement-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #e8e0d4;
  display: flex;
  justify-content: center;
}

.announcement-dialog__confirm {
  min-width: 140px;
  padding: 10px 32px;
  border: none;
  border-radius: 999px;
  background: #d9cdb8;
  color: var(--sanko-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.announcement-dialog__confirm:hover {
  background: #cfc1a8;
}
</style>

<style>
.announcement-dialog.el-dialog {
  --el-dialog-bg-color: transparent;
  --el-dialog-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}

.announcement-dialog .el-dialog__header {
  display: none;
}

.announcement-dialog .el-dialog__body {
  padding: 0;
}
</style>
