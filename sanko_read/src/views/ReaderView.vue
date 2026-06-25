<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Menu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBooksStore } from '@/stores/books'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import KookitReaderHost from '@/components/reader/KookitReaderHost.vue'
import ReaderAiPanel from '@/components/reader/ReaderAiPanel.vue'
import ReaderBookmarkIcon from '@/components/reader/ReaderBookmarkIcon.vue'
import ReaderSettingsPanel from '@/components/reader/ReaderSettingsPanel.vue'
import ReaderNavPanel from '@/components/reader/ReaderNavPanel.vue'
import ReaderSelectionToolbar from '@/components/reader/ReaderSelectionToolbar.vue'
import ReaderNoteDialog from '@/components/reader/ReaderNoteDialog.vue'
import type { ReaderChapterItem } from '@/reader/useKookitRendition'
import type { TextSelectionPayload } from '@/reader/highlightUtils'
import { getPdfPageIndexFromHighlight } from '@/reader/highlightUtils'
import type { HighlightColor } from '@/types/reader'
import { configService } from '@/reader/configService'
import { isPdfFormat, supportsAnnotationHighlight } from '@/reader/readerSettings'
import { exitReader } from '@/utils/readerNavigation'
import { seedDemoAnnotationsIfNeeded } from '@/api/mock/demoAnnotations'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const annotationsStore = useReaderAnnotationsStore()

const bookId = computed(() => route.params.id as string)
const book = computed(() => booksStore.getBookById(bookId.value))

const readerHostRef = ref<InstanceType<typeof KookitReaderHost> | null>(null)
const contentLoading = ref(true)
const loadError = ref<string | null>(null)
const showAiPanel = ref(false)
const showMenuPanel = ref(false)
const chapterTitle = ref('')
const progressPercent = ref(0)
const navChapters = ref<ReaderChapterItem[]>([])
const activeChapterIndex = ref(0)
const activeSpreadIndex = ref(0)
const pendingSelection = ref<TextSelectionPayload | null>(null)
const selectionToolbar = ref({ visible: false, x: 0, y: 0 })
const showNoteDialog = ref(false)
const noteQuote = ref('')
const noteInitial = ref('')
const noteColor = ref<HighlightColor>('green')
const editingNoteId = ref<string | undefined>(undefined)

const readerSurfaceColor = ref(configService.getReaderConfig('backgroundColor') || '#f7f3eb')

const progress = computed(() => {
  if (!book.value) return '0.00%'
  const live = progressPercent.value
  if (live > 0) return `${live.toFixed(2)}%`
  return `${book.value.progress.toFixed(2)}%`
})

const currentSpreadIndex = computed(() => activeSpreadIndex.value)

const isBookmarked = computed(() =>
  annotationsStore.isBookmarked(bookId.value, currentSpreadIndex.value),
)

const isPdfBook = computed(() => (book.value ? isPdfFormat(book.value.format) : false))

const supportsTextHighlight = computed(() =>
  book.value ? supportsAnnotationHighlight(book.value.format) : false,
)

const bookBookmarks = computed(() => annotationsStore.getBookmarksForBook(bookId.value))

const bookNotes = computed(() =>
  annotationsStore.notes.filter((item) => item.bookId === bookId.value),
)

const bookHighlights = computed(() =>
  annotationsStore.highlightOnly.filter((item) => item.bookId === bookId.value),
)

const selectionHasAnnotation = computed(() => {
  const selection = pendingSelection.value
  if (!selection) return false
  return Boolean(
    annotationsStore.findKookitAnnotation(
      bookId.value,
      selection.range,
      selection.quote,
    ),
  )
})

const readerStyle = computed(() => ({
  backgroundColor: readerSurfaceColor.value,
}))

async function syncProgressToServer(percent: number) {
  if (!book.value || percent <= 0) return
  const nextProgress = Math.min(100, Math.max(book.value.progress, percent))
  if (Math.abs(nextProgress - book.value.progress) >= 0.01) {
    await booksStore.updateProgress(bookId.value, Number(nextProgress.toFixed(2)))
  }
}

const goBack = () => {
  exitReader(router, route)
}

function hideSelectionToolbar() {
  selectionToolbar.value.visible = false
  pendingSelection.value = null
  readerHostRef.value?.clearTextSelection()
}

function onTextSelection(payload: TextSelectionPayload | null) {
  if (!supportsTextHighlight.value || !payload) {
    hideSelectionToolbar()
    return
  }
  pendingSelection.value = payload
  selectionToolbar.value = {
    visible: true,
    x: payload.x,
    y: payload.y,
  }
}

async function resolveSelectionRange(): Promise<string> {
  const selection = pendingSelection.value
  if (!selection) return ''
  if (selection.range?.trim()) return selection.range

  const range = await readerHostRef.value?.refreshPendingSelectionRange?.()
  if (range?.trim()) {
    pendingSelection.value = { ...selection, range }
    return range
  }
  return ''
}

async function refreshHighlightsAfterChange(options?: {
  pageIndex?: number | null
  removedHighlightId?: string
}) {
  const pageIndex = options?.pageIndex ?? null
  if (isPdfBook.value && options?.removedHighlightId && pageIndex != null) {
    await readerHostRef.value?.removePdfHighlight(options.removedHighlightId, pageIndex)
    return
  }
  await readerHostRef.value?.applyStoredHighlights(pageIndex != null ? [pageIndex] : [])
}

async function onHighlightColor(color: HighlightColor) {
  const selection = pendingSelection.value
  if (!selection) return

  const range = await resolveSelectionRange()
  if (!range.trim()) {
    ElMessage.warning('未能获取选区位置，请重新划词后再试')
    return
  }

  const pageIndex = getPdfPageIndexFromHighlight({
    range,
    chapterDocIndex: selection.chapterDocIndex,
  })

  const result = await annotationsStore.toggleKookitHighlight(bookId.value, {
    range,
    spreadIndex: selection.spreadIndex,
    chapterDocIndex: selection.chapterDocIndex,
    quote: selection.quote,
    chapter: selection.chapter,
    color,
  })

  await refreshHighlightsAfterChange({ pageIndex })
  hideSelectionToolbar()

  if (result === 'added') {
    ElMessage.success('已添加高亮')
  } else if (result === 'removed') {
    ElMessage.success('已取消高亮')
  } else {
    ElMessage.success('已更新高亮')
  }
}

function openNoteDialog() {
  if (!pendingSelection.value) return
  const selection = pendingSelection.value
  const existing = annotationsStore.findKookitAnnotation(
    bookId.value,
    selection.range,
    selection.quote,
  )

  noteQuote.value = selection.quote
  noteInitial.value = existing?.note?.trim() ?? ''
  noteColor.value = existing?.color ?? 'green'
  editingNoteId.value = existing?.note?.trim() ? existing.id : undefined
  showNoteDialog.value = true
  selectionToolbar.value.visible = false
}

async function onNoteConfirm(payload: {
  note: string
  color: HighlightColor
  editingId?: string
}) {
  const selection = pendingSelection.value
  if (!selection) return

  const range = await resolveSelectionRange()
  if (!range.trim()) {
    ElMessage.warning('未能获取选区位置，请重新划词后再试')
    return
  }

  if (payload.editingId) {
    await annotationsStore.updateNote(payload.editingId, payload.note, payload.color)
  } else {
    await annotationsStore.addKookitNote(bookId.value, {
      range,
      spreadIndex: selection.spreadIndex,
      chapterDocIndex: selection.chapterDocIndex,
      quote: selection.quote,
      chapter: selection.chapter,
      color: payload.color,
      note: payload.note,
    })
  }

  await refreshHighlightsAfterChange({
    pageIndex: getPdfPageIndexFromHighlight({
      range,
      chapterDocIndex: selection.chapterDocIndex,
    }) ?? selection.chapterDocIndex,
  })
  hideSelectionToolbar()
  showNoteDialog.value = false
  ElMessage.success('笔记已保存')
}

async function onSelectionDelete() {
  const selection = pendingSelection.value
  if (!selection) return

  const existing = annotationsStore.findKookitAnnotation(
    bookId.value,
    selection.range,
    selection.quote,
  )
  if (!existing) return

  const hadNote = Boolean(existing.note?.trim())
  const pageIndex = getPdfPageIndexFromHighlight(existing) ?? getPdfPageIndexFromHighlight(selection)
  await annotationsStore.removeHighlight(existing.id)
  await refreshHighlightsAfterChange({
    pageIndex,
    removedHighlightId: existing.id,
  })
  hideSelectionToolbar()
  ElMessage.success(hadNote ? '笔记已删除' : '已删除高亮')
}

async function onNoteDelete(id: string) {
  const existing = annotationsStore.highlights.find((h) => h.id === id)
  const pageIndex = existing ? getPdfPageIndexFromHighlight(existing) : null
  await annotationsStore.removeHighlight(id)
  await refreshHighlightsAfterChange({
    pageIndex,
    removedHighlightId: id,
  })
  hideSelectionToolbar()
  showNoteDialog.value = false
  editingNoteId.value = undefined
  ElMessage.success('笔记已删除')
}

const prevSpread = () => {
  hideSelectionToolbar()
  void readerHostRef.value?.prev().then(() => {
    syncActiveSpreadIndex()
    syncActiveChapterIndex()
  })
}

const nextSpread = () => {
  hideSelectionToolbar()
  void readerHostRef.value?.next().then(() => {
    syncActiveSpreadIndex()
    syncActiveChapterIndex()
  })
}

const toggleBookmark = async () => {
  syncActiveSpreadIndex()
  const spreadIndex = currentSpreadIndex.value
  const wasBookmarked = isBookmarked.value
  await annotationsStore.toggleBookmark(bookId.value, spreadIndex, chapterTitle.value)
  ElMessage.success(wasBookmarked ? '已移除书签' : '已添加书签')
}

function syncActiveSpreadIndex() {
  activeSpreadIndex.value = readerHostRef.value?.getCurrentSpreadIndex() ?? activeSpreadIndex.value
}

function syncActiveChapterIndex() {
  activeChapterIndex.value = readerHostRef.value?.getCurrentChapterIndex() ?? activeChapterIndex.value
}

const toggleAi = () => {
  showAiPanel.value = !showAiPanel.value
}

const toggleMenu = () => {
  const next = !showMenuPanel.value
  showMenuPanel.value = next
  if (next) {
    refreshNavData()
  }
}

function refreshNavData() {
  navChapters.value = readerHostRef.value?.getChapterList() ?? []
  activeChapterIndex.value = readerHostRef.value?.getCurrentChapterIndex() ?? 0
}

async function onNavigateChapter(index: number) {
  hideSelectionToolbar()
  await readerHostRef.value?.goToSpreadIndex(index)
  syncActiveSpreadIndex()
  syncActiveChapterIndex()
  await readerHostRef.value?.applyStoredHighlights()
  showMenuPanel.value = false
}

const onReaderReady = async () => {
  contentLoading.value = false
  loadError.value = null
  refreshNavData()
  syncActiveSpreadIndex()
  syncActiveChapterIndex()

  const at = route.query.at
  if (typeof at === 'string' && at.trim()) {
    const spreadIndex = Number(at)
    if (Number.isFinite(spreadIndex)) {
      await readerHostRef.value?.goToSpreadIndex(spreadIndex)
      syncActiveSpreadIndex()
      syncActiveChapterIndex()
      await readerHostRef.value?.applyStoredHighlights()
    }
  }
}

const onReaderError = (message: string) => {
  contentLoading.value = false
  loadError.value = message
  ElMessage({
    type: 'error',
    message,
    duration: 4000,
    showClose: true,
  })
  window.setTimeout(() => {
    exitReader(router, route)
  }, 3200)
}

const onProgress = (percent: number) => {
  progressPercent.value = percent
  syncActiveChapterIndex()
  void syncProgressToServer(percent)
}

const onSpreadIndex = (index: number) => {
  activeSpreadIndex.value = index
}

const onChapter = (title: string) => {
  chapterTitle.value = title
  syncActiveChapterIndex()
}

async function onSettingsApply(reload: boolean) {
  readerSurfaceColor.value = configService.getReaderConfig('backgroundColor') || '#f7f3eb'
  if (reload) {
    contentLoading.value = true
    await readerHostRef.value?.reloadBook()
    refreshNavData()
    return
  }
  readerHostRef.value?.applyReaderStyles()
}

function closeMenuPanel() {
  showMenuPanel.value = false
}

watch(bookId, () => {
  contentLoading.value = true
  loadError.value = null
  progressPercent.value = 0
  chapterTitle.value = ''
  navChapters.value = []
  activeChapterIndex.value = 0
  activeSpreadIndex.value = 0
  hideSelectionToolbar()
  showNoteDialog.value = false
  showMenuPanel.value = false
})

onMounted(() => {
  if (!bookId.value) return
  if (book.value) {
    const seeded = seedDemoAnnotationsIfNeeded(bookId.value, book.value.format)
    if (seeded) {
      void annotationsStore.fetchAll()
    }
  }
  void booksStore.touchLastRead(bookId.value)
})
</script>

<template>
  <div v-if="book && !loadError" class="reader" :style="readerStyle">
    <header class="reader-header">
      <div class="reader-header__primary">
        <span class="reader-progress">{{ progress }}</span>
        <button
          type="button"
          class="reader-bookmark-btn"
          :class="{ 'is-active': isBookmarked }"
          :aria-label="isBookmarked ? '移除书签' : '添加书签'"
          @click="toggleBookmark"
        >
          <ReaderBookmarkIcon :active="isBookmarked" />
        </button>
        <h1 class="reader-title" :title="book.title">{{ book.title }}</h1>
      </div>

      <div class="reader-header__meta">
        <span class="reader-format">{{ book.format }}</span>
        <span class="reader-chapter" :title="chapterTitle">{{ chapterTitle || '—' }}</span>
      </div>

      <div class="reader-header__actions">
        <button
          type="button"
          class="reader-menu-btn"
          :class="{ 'is-active': showMenuPanel }"
          aria-label="阅读菜单"
          @click="toggleMenu"
        >
          <el-icon :size="20"><Menu /></el-icon>
        </button>
        <el-button
          :icon="ArrowRight"
          text
          class="reader-exit-btn"
          aria-label="退出阅读"
          @click="goBack"
        />
      </div>
    </header>

    <main class="reader-body" :class="{ 'reader-body--pdf': isPdfBook }">
      <KookitReaderHost
        ref="readerHostRef"
        :book-id="bookId"
        :book="book"
        @ready="onReaderReady"
        @error="onReaderError"
        @progress="onProgress"
        @spread-index="onSpreadIndex"
        @text-selection="onTextSelection"
        @chapter="onChapter"
      />
    </main>

    <ReaderSelectionToolbar
      v-if="supportsTextHighlight"
      :visible="selectionToolbar.visible"
      :x="selectionToolbar.x"
      :y="selectionToolbar.y"
      :placement="isPdfBook ? 'left' : 'above'"
      :show-delete="selectionHasAnnotation"
      @highlight="onHighlightColor"
      @note="openNoteDialog"
      @delete="onSelectionDelete"
    />

    <ReaderNoteDialog
      v-if="supportsTextHighlight"
      v-model:visible="showNoteDialog"
      :quote="noteQuote"
      :initial-note="noteInitial"
      :initial-color="noteColor"
      :editing-id="editingNoteId"
      @confirm="onNoteConfirm"
      @delete="onNoteDelete"
    />

    <footer v-if="!isPdfBook" class="reader-footer">
      <el-button class="reader-nav-btn" :icon="ArrowLeft" circle @click="prevSpread" />
      <el-button class="reader-nav-btn reader-nav-btn--next" :icon="ArrowRight" circle @click="nextSpread" />
    </footer>

    <button
      class="reader-ai-btn"
      :class="{ 'reader-ai-btn--active': showAiPanel }"
      type="button"
      @click="toggleAi"
    >
      AI
    </button>

    <ReaderAiPanel v-model:visible="showAiPanel" :book-id="bookId" />

    <ReaderNavPanel
      v-model:visible="showMenuPanel"
      :book="book"
      :chapters="navChapters"
      :active-chapter-index="activeChapterIndex"
      :bookmarks="bookBookmarks"
      :notes="bookNotes"
      :highlights="bookHighlights"
      :progress-percent="progressPercent"
      @navigate-chapter="onNavigateChapter"
    />

    <ReaderSettingsPanel
      v-model:visible="showMenuPanel"
      :format="book.format"
      @apply="onSettingsApply"
    />

    <div
      v-if="showMenuPanel"
      class="reader-settings-backdrop"
      aria-hidden="true"
      @click="closeMenuPanel"
    />

    <div v-if="contentLoading" class="reader-overlay">
      <p>正在加载阅读内容…</p>
    </div>
  </div>

  <div v-else-if="contentLoading && book" class="reader-not-found">
    <p>正在加载阅读内容…</p>
  </div>

  <div v-else-if="loadError && book" class="reader-not-found">
    <p>{{ loadError }}</p>
    <el-button type="primary" @click="goBack">返回</el-button>
  </div>

  <div v-else class="reader-not-found">
    <p>未找到该书籍</p>
    <el-button type="primary" @click="goBack">返回</el-button>
  </div>
</template>

<style scoped>
.reader {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.2s ease;
}

.reader-header {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid #e0d8cc;
  background: inherit;
}

.reader-header__primary,
.reader-header__meta,
.reader-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.reader-header__meta {
  justify-content: center;
}

.reader-header__actions {
  justify-content: flex-end;
}

.reader-progress {
  font-size: 13px;
  color: var(--sanko-text-secondary);
  min-width: 52px;
  flex-shrink: 0;
}

.reader-bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 2px;
  cursor: pointer;
  transition: transform 0.15s;
  flex-shrink: 0;
}

.reader-bookmark-btn:hover {
  transform: scale(1.08);
}

.reader-bookmark-btn.is-active {
  transform: none;
  color: var(--sanko-green);
}

.reader-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-format {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sanko-green);
  background: rgba(90, 122, 106, 0.1);
}

.reader-chapter {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 13px;
  color: var(--sanko-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: none;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.reader-menu-btn:hover,
.reader-menu-btn.is-active {
  color: var(--sanko-green);
  border-color: #d8e0d8;
  background: rgba(255, 255, 255, 0.72);
}

.reader-exit-btn {
  color: var(--sanko-green);
  font-size: 20px;
  font-weight: 600;
}

.reader-body {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 100px;
  display: flex;
  flex-direction: column;
}

.reader-body--pdf {
  padding-bottom: 32px;
}

.reader-footer {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 48px;
  pointer-events: none;
  max-width: 1100px;
  margin: 0 auto;
}

.reader-nav-btn {
  pointer-events: auto;
  background: #fff;
  border: 1px solid #ddd;
  color: var(--sanko-text);
}

.reader-nav-btn--next {
  margin-left: auto;
}

.reader-ai-btn {
  position: fixed;
  right: max(48px, calc(50% - 520px));
  bottom: 88px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #ccc;
  background: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  z-index: 50;
  transition:
    background 0.15s,
    color 0.15s;
}

.reader-ai-btn:hover,
.reader-ai-btn--active {
  background: #fff;
  color: var(--sanko-green);
  border-color: var(--sanko-green);
}

.reader-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(0, 0, 0, 0.18);
}

.reader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(247, 243, 235, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  pointer-events: none;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.reader-not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

@media (max-width: 900px) {
  .reader-header {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  .reader-header__meta {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
