<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AdminBook } from '@/types/modules'
import { useAdminDataStore } from '@/stores/adminData'

const props = defineProps<{
  bookId: string | null
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const store = useAdminDataStore()
const previewExpanded = ref(false)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const visible = computed({
  get: () => Boolean(props.bookId),
  set: (v) => {
    if (!v) emit('close')
  },
})

const book = computed(() => (props.bookId ? store.getBookById(props.bookId) : null))

const isPending = computed(() => book.value?.status === 'pending')

watch(
  () => props.bookId,
  () => {
    previewExpanded.value = false
  },
)

const statusLabel: Record<AdminBook['status'], string> = {
  pending: '待审核',
  approved: '已上架',
  rejected: '已驳回',
  offline: '已下架',
}

const handleApprove = async () => {
  if (!book.value) return
  try {
    await ElMessageBox.confirm(
      `确认通过《${book.value.title}》？通过后将在书城展示。`,
      '审核通过',
      { type: 'info' },
    )
    store.approveBook(book.value.id)
    ElMessage.success('已通过审核')
    emit('updated')
    emit('close')
  } catch {
    // cancelled
  }
}

const openRejectDialog = () => {
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const submitReject = () => {
  if (!book.value) return
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  store.rejectBook(book.value.id, rejectReason.value.trim())
  ElMessage.success('已驳回')
  rejectDialogVisible.value = false
  emit('updated')
  emit('close')
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="isPending ? '书籍审核' : '书籍详情'"
    size="520px"
    destroy-on-close
    @closed="emit('close')"
  >
    <div v-if="book" class="review">
      <div class="review__cover-wrap">
        <div class="review__cover" :style="{ background: book.coverColor }">
          <span class="review__cover-title">{{ book.coverTitle }}</span>
        </div>
        <div class="review__cover-meta">
          <h2 class="review__title">{{ book.title }}</h2>
          <p class="review__author">{{ book.author }}</p>
          <el-tag size="small">{{ statusLabel[book.status] }}</el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border size="small" class="review__desc">
        <el-descriptions-item label="分类">{{ book.category }}</el-descriptions-item>
        <el-descriptions-item label="属性">{{ book.purchaseType }}</el-descriptions-item>
        <el-descriptions-item label="格式">{{ book.format }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ book.fileSize }}</el-descriptions-item>
        <el-descriptions-item v-if="book.uploader" label="上传者">
          {{ book.uploader }}
        </el-descriptions-item>
        <el-descriptions-item v-if="book.uploadedAt" label="上传时间">
          {{ book.uploadedAt }}
        </el-descriptions-item>
      </el-descriptions>

      <section v-if="book.rejectReason" class="review__section review__reject">
        <h3 class="review__section-title">驳回原因</h3>
        <p>{{ book.rejectReason }}</p>
      </section>

      <section class="review__section">
        <h3 class="review__section-title">简介</h3>
        <p class="review__text">{{ book.synopsis }}</p>
      </section>

      <section class="review__section">
        <h3 class="review__section-title">目录</h3>
        <ol class="review__toc">
          <li v-for="(chapter, i) in book.tableOfContents" :key="i">{{ chapter }}</li>
        </ol>
      </section>

      <section class="review__section">
        <div class="review__section-head">
          <h3 class="review__section-title">正文预览</h3>
          <el-button link type="primary" @click="previewExpanded = !previewExpanded">
            {{ previewExpanded ? '收起' : '展开全文' }}
          </el-button>
        </div>
        <div class="review__preview" :class="{ 'review__preview--expanded': previewExpanded }">
          <p class="review__text">{{ book.previewExcerpt }}</p>
        </div>
      </section>
    </div>

    <template v-if="book && isPending" #footer>
      <div class="review__footer">
        <el-button @click="emit('close')">关闭</el-button>
        <el-button type="danger" @click="openRejectDialog">驳回</el-button>
        <el-button type="primary" @click="handleApprove">通过审核</el-button>
      </div>
    </template>
  </el-drawer>

  <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="440px" append-to-body>
    <el-input
      v-model="rejectReason"
      type="textarea"
      :rows="4"
      placeholder="请填写驳回原因，用户将看到此说明"
    />
    <template #footer>
      <el-button @click="rejectDialogVisible = false">取消</el-button>
      <el-button type="danger" @click="submitReject">确认驳回</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.review__cover-wrap {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.review__cover {
  flex-shrink: 0;
  width: 88px;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #fff;
}

.review__cover-title {
  font-size: 14px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.review__cover-meta {
  min-width: 0;
}

.review__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.review__author {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--admin-text-secondary);
}

.review__desc {
  margin-bottom: 20px;
}

.review__section {
  margin-bottom: 20px;
}

.review__section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
}

.review__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.review__section-head .review__section-title {
  margin: 0;
}

.review__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--admin-text);
}

.review__toc {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--admin-text-secondary);
}

.review__preview {
  max-height: 120px;
  overflow: hidden;
  padding: 14px 16px;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid var(--admin-border);
  transition: max-height 0.25s ease;
}

.review__preview--expanded {
  max-height: 480px;
  overflow-y: auto;
}

.review__reject {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.review__reject p {
  margin: 0;
  font-size: 14px;
  color: #cf1322;
}

.review__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
