<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAdminDataStore } from '@/stores/adminData'
import type { AdminBook, BookStatus } from '@/types/modules'

const route = useRoute()
const router = useRouter()
const store = useAdminDataStore()

const book = ref<AdminBook | null>(null)
const loading = ref(true)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const bookId = computed(() => String(route.params.id ?? ''))

const isPending = computed(() => book.value?.status === 'pending')

const readingText = computed(() => {
  if (!book.value) return ''
  return book.value.fullContent || book.value.previewExcerpt || '（暂无正文）'
})

const contentParagraphs = computed(() =>
  readingText.value.split(/\n\n+/).filter((p) => p.trim()),
)

const statusLabel: Record<BookStatus, string> = {
  pending: '待审核',
  approved: '已上架',
  rejected: '已驳回',
  offline: '已下架',
}

const statusTagType: Record<BookStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  offline: 'info',
}

onMounted(async () => {
  loading.value = true
  try {
    if (!store.loaded) {
      await store.loadBootstrap()
    }
    book.value = await store.fetchBook(bookId.value)
    if (!book.value) {
      ElMessage.error('书籍不存在')
      void router.replace({ name: 'books' })
    }
  } finally {
    loading.value = false
  }
})

const goBack = () => {
  const tab = book.value?.status === 'pending' ? 'pending' : undefined
  void router.push(tab ? { name: 'books', query: { tab } } : { name: 'books' })
}

const handleApprove = async () => {
  if (!book.value) return
  try {
    await ElMessageBox.confirm(
      `确认通过《${book.value.title}》？通过后将在书城展示。`,
      '审核通过',
      { type: 'info' },
    )
    await store.approveBook(book.value.id)
    ElMessage.success('已通过审核')
    goBack()
  } catch {
    // cancelled
  }
}

const openRejectDialog = () => {
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const submitReject = async () => {
  if (!book.value) return
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  await store.rejectBook(book.value.id, rejectReason.value.trim())
  ElMessage.success('已驳回')
  rejectDialogVisible.value = false
  goBack()
}
</script>

<template>
  <div v-loading="loading" class="review-page">
    <template v-if="book">
      <header class="review-page__header">
        <div class="review-page__header-left">
          <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <div class="review-page__title-wrap">
            <h1 class="review-page__title">{{ book.title }}</h1>
            <span class="review-page__author">{{ book.author }}</span>
            <el-tag :type="statusTagType[book.status]" size="small">
              {{ statusLabel[book.status] }}
            </el-tag>
          </div>
        </div>
        <div v-if="isPending" class="review-page__actions">
          <el-button type="danger" @click="openRejectDialog">驳回</el-button>
          <el-button type="primary" @click="handleApprove">通过审核</el-button>
        </div>
      </header>

      <div class="review-page__body">
        <aside class="review-page__sidebar">
          <div class="review-page__cover" :style="{ background: book.coverColor }">
            <span>{{ book.coverTitle }}</span>
          </div>

          <el-descriptions :column="1" border size="small" class="review-page__meta">
            <el-descriptions-item label="ID">{{ book.id }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ book.category }}</el-descriptions-item>
            <el-descriptions-item label="属性">{{ book.purchaseType }}</el-descriptions-item>
            <el-descriptions-item label="格式">{{ book.format }}</el-descriptions-item>
            <el-descriptions-item label="大小">{{ book.fileSize }}</el-descriptions-item>
            <el-descriptions-item v-if="book.uploader" label="上传者">
              {{ book.uploader }}
            </el-descriptions-item>
            <el-descriptions-item v-if="book.uploadedAt" label="上传时间">
              {{ book.uploadedAt }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ book.updatedAt }}</el-descriptions-item>
          </el-descriptions>

          <section v-if="book.rejectReason" class="review-page__reject">
            <h3>驳回原因</h3>
            <p>{{ book.rejectReason }}</p>
          </section>

          <section class="review-page__section">
            <h3>简介</h3>
            <p>{{ book.synopsis }}</p>
          </section>

          <section class="review-page__section">
            <h3>目录</h3>
            <ol class="review-page__toc">
              <li v-for="(chapter, i) in book.tableOfContents" :key="i">{{ chapter }}</li>
            </ol>
          </section>
        </aside>

        <main class="review-page__reader">
          <div class="review-page__reader-head">
            <h2>正文审阅</h2>
            <span class="review-page__reader-hint">请完整阅读以下内容后再做审核决定</span>
          </div>
          <article class="review-page__content">
            <p v-for="(para, i) in contentParagraphs" :key="i">{{ para }}</p>
          </article>
        </main>
      </div>
    </template>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="480px" append-to-body>
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="5"
        placeholder="请填写驳回原因，用户将看到此说明"
      />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.review-page {
  /* 56px 顶栏 + 40px main 上下 padding */
  height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--admin-border);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.review-page__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.review-page__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.review-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.review-page__author {
  font-size: 14px;
  color: var(--admin-text-secondary);
}

.review-page__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.review-page__body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.review-page__sidebar {
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
}

.review-page__sidebar::-webkit-scrollbar {
  width: 8px;
}

.review-page__sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.review-page__sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.review-page__cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  max-width: 160px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.review-page__meta {
  margin-bottom: 16px;
}

.review-page__section h3,
.review-page__reject h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.review-page__section p,
.review-page__reject p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--admin-text-secondary);
}

.review-page__reject {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.review-page__reject p {
  color: #cf1322;
}

.review-page__toc {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--admin-text-secondary);
}

.review-page__reader {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.review-page__reader-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--admin-border);
  background: #fafafa;
  flex-shrink: 0;
}

.review-page__reader-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.review-page__reader-hint {
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.review-page__content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 28px 40px 40px;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: #bfbfbf #f0f0f0;
}

.review-page__content::-webkit-scrollbar {
  width: 10px;
}

.review-page__content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 5px;
}

.review-page__content::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 5px;
  border: 2px solid #f0f0f0;
}

.review-page__content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.review-page__content p {
  margin: 0 auto 1.2em;
  max-width: 720px;
  font-size: 16px;
  line-height: 1.9;
  color: #2c2c2c;
  text-align: justify;
}

@media (max-width: 960px) {
  .review-page {
    height: auto;
    min-height: calc(100vh - 96px);
    overflow: visible;
  }

  .review-page__body {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .review-page__sidebar {
    max-height: 320px;
  }

  .review-page__reader {
    min-height: 60vh;
    height: auto;
  }
}
</style>
