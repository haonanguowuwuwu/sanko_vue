<script setup lang="ts">
import { Close, Setting, Box, Brush } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useSettingsStore, type ExportFormat } from '@/stores/settings'
import { useBooksStore } from '@/stores/books'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import { exportJson, exportRecords } from '@/utils/exportData'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const settingsStore = useSettingsStore()
const booksStore = useBooksStore()
const annotationsStore = useReaderAnnotationsStore()

const {
  disableRecycleBin,
  hideBookshelfBooks,
  directDeleteFromShelf,
  noPdfCoverAsBookCover,
  noCropBookCovers,
  showBookshelfBookCount,
  enableSoftwareProtection,
  notesExportFormat,
  highlightsExportFormat,
} = storeToRefs(settingsStore)

const exportFormatOptions: { value: ExportFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'csv', label: 'CSV' },
  { value: 'txt', label: '纯文本' },
]

const handleClose = () => {
  emit('update:visible', false)
}

const buildAnnotationRecords = (items: typeof annotationsStore.notes) =>
  items.map((h) => ({
    bookTitle: booksStore.getBookById(h.bookId)?.title ?? h.bookId,
    quote: h.quote,
    note: h.note,
    createdAt: h.createdAt,
  }))

const handleExportBooks = () => {
  if (booksStore.books.length === 0) {
    ElMessage.warning('暂无图书可导出')
    return
  }
  exportJson('sanko-books.json', booksStore.books)
  ElMessage.success('图书导出成功')
}

const handleNotesFormatChange = (format: ExportFormat | '') => {
  if (!format) return
  const records = buildAnnotationRecords(annotationsStore.notes)
  if (records.length === 0) {
    ElMessage.warning('暂无笔记可导出')
    notesExportFormat.value = ''
    return
  }
  exportRecords('sanko-notes', format, '所有笔记', records)
  ElMessage.success('笔记导出成功')
  notesExportFormat.value = ''
}

const handleHighlightsFormatChange = (format: ExportFormat | '') => {
  if (!format) return
  const records = buildAnnotationRecords(annotationsStore.highlightOnly)
  if (records.length === 0) {
    ElMessage.warning('暂无高亮可导出')
    highlightsExportFormat.value = ''
    return
  }
  exportRecords('sanko-highlights', format, '所有高亮', records)
  ElMessage.success('高亮导出成功')
  highlightsExportFormat.value = ''
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="560px"
    :show-close="false"
    append-to-body
    align-center
    class="app-settings-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="settings-page">
      <div class="settings-page__header">
        <h2 class="settings-page__title">设置</h2>
        <el-button :icon="Close" text class="settings-page__close" @click="handleClose" />
      </div>

      <div class="settings-page__body">
        <section class="settings-group">
          <h3 class="settings-group__heading">
            <el-icon :size="18"><Setting /></el-icon>
            通用
          </h3>
          <div class="settings-list">
            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">禁用回收站功能</div>
                <div class="settings-row__desc">删除的图书会被永久删除，而不是移动到回收站</div>
              </div>
              <el-switch v-model="disableRecycleBin" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">隐藏添加到书架的图书</div>
                <div class="settings-row__desc">当把图书添加到书架后，该图书就不会展示在主页书架中</div>
              </div>
              <el-switch v-model="hideBookshelfBooks" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">直接删除从书架中移除的图书</div>
                <div class="settings-row__desc">
                  在书架中执行删除操作时，不仅会从书架删除，还会直接将其删除到回收站
                </div>
              </div>
              <el-switch v-model="directDeleteFromShelf" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">启用软件保护</div>
                <div class="settings-row__desc">启用后，应用程序每次启动都需要身份验证</div>
              </div>
              <el-switch v-model="enableSoftwareProtection" />
            </div>
          </div>
        </section>

        <section class="settings-group">
          <h3 class="settings-group__heading">
            <el-icon :size="18"><Box /></el-icon>
            数据
          </h3>
          <div class="settings-list">
            <div class="settings-row settings-row--action">
              <div class="settings-row__text">
                <div class="settings-row__title">导出所有图书</div>
              </div>
              <el-button type="primary" class="export-btn" @click="handleExportBooks">导出</el-button>
            </div>

            <div class="settings-row settings-row--action">
              <div class="settings-row__text">
                <div class="settings-row__title">导出所有笔记</div>
              </div>
              <el-select
                v-model="notesExportFormat"
                placeholder="选择格式"
                class="format-select"
                clearable
                @change="handleNotesFormatChange"
              >
                <el-option
                  v-for="opt in exportFormatOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>

            <div class="settings-row settings-row--action">
              <div class="settings-row__text">
                <div class="settings-row__title">导出所有高亮</div>
              </div>
              <el-select
                v-model="highlightsExportFormat"
                placeholder="选择格式"
                class="format-select"
                clearable
                @change="handleHighlightsFormatChange"
              >
                <el-option
                  v-for="opt in exportFormatOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
          </div>
        </section>

        <section class="settings-group">
          <h3 class="settings-group__heading">
            <el-icon :size="18"><Brush /></el-icon>
            外观
          </h3>
          <div class="settings-list">
            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">不使用 PDF 首页作为封面</div>
              </div>
              <el-switch v-model="noPdfCoverAsBookCover" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">不裁切图书封面</div>
              </div>
              <el-switch v-model="noCropBookCovers" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">显示每个书架的图书数量</div>
              </div>
              <el-switch v-model="showBookshelfBookCount" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.settings-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}

.settings-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-text);
}

.settings-page__close {
  font-size: 18px;
  color: var(--sanko-text);
}

.settings-page__body {
  padding: 20px 28px 28px;
  max-height: 70vh;
  overflow-y: auto;
}

.settings-group + .settings-group {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--sanko-border);
}

.settings-group__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--sanko-text);
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.settings-row__text {
  flex: 1;
  min-width: 0;
}

.settings-row__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-text);
}

.settings-row__desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--sanko-text-secondary);
  margin-top: 6px;
}

.settings-row :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--sanko-green);
  border-color: var(--sanko-green);
}

.export-btn {
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
  --el-button-hover-bg-color: var(--sanko-green-hover);
  --el-button-hover-border-color: var(--sanko-green-hover);
  min-width: 72px;
  flex-shrink: 0;
}

.format-select {
  width: 160px;
  flex-shrink: 0;
}
</style>

<style>
.app-settings-dialog .el-dialog {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}

.app-settings-dialog .el-dialog__header {
  display: none;
}

.app-settings-dialog .el-dialog__body {
  padding: 0;
}
</style>
