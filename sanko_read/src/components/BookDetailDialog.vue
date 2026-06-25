<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Book } from '@/types/book'
import { useBooksStore } from '@/stores/books'
import BookCoverFace from '@/components/BookCoverFace.vue'

const props = defineProps<{
  visible: boolean
  book: Book | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const booksStore = useBooksStore()
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const hasFile = computed(() => props.book && props.book.format !== '—')

const handleClose = () => {
  emit('update:visible', false)
}

const handlePickFile = () => {
  fileInputRef.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !props.book) return

  uploading.value = true
  try {
    await booksStore.uploadBookFile(props.book.id, file)
    ElMessage.success('书籍文件已上传')
  } catch (error) {
    const message = error instanceof Error ? error.message : '上传失败'
    ElMessage.error(message)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible && !!book"
    width="480px"
    :show-close="false"
    align-center
    class="detail-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="book">
      <div class="detail-dialog__cover-wrap">
        <div class="detail-dialog__cover">
          <BookCoverFace :book="book" size="large" />
        </div>
      </div>

      <h2 class="detail-dialog__title">{{ book.title }}</h2>
      <p class="detail-dialog__author">{{ book.author }}</p>

      <div class="detail-dialog__meta">
        <div class="detail-dialog__meta-item">
          <span class="detail-dialog__meta-label">文件大小</span>
          <span class="detail-dialog__meta-value">{{ book.fileSize }}</span>
        </div>
        <div class="detail-dialog__meta-item">
          <span class="detail-dialog__meta-label">添加于</span>
          <span class="detail-dialog__meta-value">{{ book.addedAt }}</span>
        </div>
        <div class="detail-dialog__meta-item">
          <span class="detail-dialog__meta-label">格式</span>
          <span class="detail-dialog__meta-value">{{ book.format }}</span>
        </div>
      </div>

      <div v-if="!hasFile" class="detail-dialog__upload">
        <p class="detail-dialog__upload-hint">尚未上传书籍文件</p>
        <el-button type="primary" :loading="uploading" @click="handlePickFile">上传书籍文件</el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.epub,.txt,.docx,.mobi,.md"
          hidden
          @change="onFileSelected"
        />
      </div>

      <button type="button" class="detail-dialog__close" @click="handleClose">关闭</button>
    </template>
  </el-dialog>
</template>

<style scoped>
.detail-dialog__cover-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.detail-dialog__cover {
  width: 140px;
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.detail-dialog__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: var(--sanko-text);
}

.detail-dialog__author {
  margin: 8px 0 24px;
  font-size: 15px;
  text-align: center;
  color: var(--sanko-text-secondary);
}

.detail-dialog__meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
  text-align: center;
}

.detail-dialog__meta-label {
  display: block;
  font-size: 13px;
  color: var(--sanko-text-secondary);
  margin-bottom: 6px;
}

.detail-dialog__meta-value {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-text);
}

.detail-dialog__upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-dialog__upload-hint {
  margin: 0;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.detail-dialog__close {
  display: block;
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #2a2a2a;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.detail-dialog__close:hover {
  background: #1a1a1a;
}
</style>

<style>
.detail-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 12px;
}

.detail-dialog .el-dialog__header {
  display: none;
}

.detail-dialog .el-dialog__body {
  padding: 32px 36px 28px;
}
</style>
