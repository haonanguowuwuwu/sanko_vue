<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useBooksStore } from '@/stores/books'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [bookId: string]
}>()

const booksStore = useBooksStore()

const title = ref('')
const author = ref('')
const category = ref('')
const selectedFile = ref<File | null>(null)
const submitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const categoryOptions = ['出版', '其他']

const resetForm = () => {
  title.value = ''
  author.value = ''
  category.value = ''
  selectedFile.value = null
}

const handleClose = () => {
  emit('update:visible', false)
  resetForm()
}

const handlePickFile = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) selectedFile.value = file
}

const handleSubmit = async () => {
  const trimmedTitle = title.value.trim()
  const trimmedAuthor = author.value.trim()
  if (!trimmedTitle) {
    ElMessage.warning('请填写书名')
    return
  }
  if (!trimmedAuthor) {
    ElMessage.warning('请填写作者')
    return
  }
  if (!category.value) {
    ElMessage.warning('请选择分类')
    return
  }

  submitting.value = true
  try {
    const book = await booksStore.createBookEntry({
      title: trimmedTitle,
      author: trimmedAuthor,
      category: category.value,
    })
    if (selectedFile.value) {
      await booksStore.uploadBookFile(book.id, selectedFile.value)
    }
    ElMessage.success(selectedFile.value ? '书籍已创建并上传文件' : '书籍条目已创建，可稍后上传文件')
    emit('success', book.id)
    handleClose()
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建失败'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="添加书籍"
    width="480px"
    align-center
    :close-on-click-modal="!submitting"
    @update:model-value="!$event && handleClose()"
  >
    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item label="书名" required>
        <el-input v-model="title" placeholder="请输入书名" :disabled="submitting" />
      </el-form-item>
      <el-form-item label="作者" required>
        <el-input v-model="author" placeholder="请输入作者" :disabled="submitting" />
      </el-form-item>
      <el-form-item label="分类" required>
        <el-select v-model="category" placeholder="请选择分类" style="width: 100%" :disabled="submitting">
          <el-option v-for="opt in categoryOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>
      </el-form-item>
      <el-form-item label="书籍文件（可选，可稍后上传）">
        <div class="add-book-file">
          <el-button :disabled="submitting" @click="handlePickFile">
            {{ selectedFile ? '重新选择' : '选择文件' }}
          </el-button>
          <span v-if="selectedFile" class="add-book-file__name">{{ selectedFile.name }}</span>
          <span v-else class="add-book-file__hint">支持 PDF、EPUB、TXT 等格式</span>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.epub,.txt,.docx,.mobi,.md"
          hidden
          @change="onFileSelected"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.add-book-file {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-book-file__name {
  font-size: 13px;
  color: var(--sanko-text);
}

.add-book-file__hint {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}
</style>
