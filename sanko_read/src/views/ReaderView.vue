<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBooksStore } from '@/stores/books'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import { getChapterByBlockId } from '@/data/readerContent'
import { getBookContent } from '@/api/annotations'
import type { HighlightColor, ReaderSpread } from '@/types/reader'
import ReaderPageContent from '@/components/reader/ReaderPageContent.vue'
import ReaderSelectionToolbar from '@/components/reader/ReaderSelectionToolbar.vue'
import ReaderNoteDialog from '@/components/reader/ReaderNoteDialog.vue'
import ReaderAiPanel from '@/components/reader/ReaderAiPanel.vue'
import ReaderBookmarkIcon from '@/components/reader/ReaderBookmarkIcon.vue'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const annotationsStore = useReaderAnnotationsStore()

const bookId = computed(() => route.params.id as string)
const book = computed(() => booksStore.getBookById(bookId.value))

const spreads = ref<ReaderSpread[]>([])
const contentLoading = ref(true)
const currentSpread = ref(0)
const showAiPanel = ref(false)
const showNoteDialog = ref(false)
const showToolbar = ref(false)
const toolbarPos = ref({ x: 0, y: 0 })

const pendingSelection = ref<{
  blockId: string
  text: string
  start: number
  end: number
} | null>(null)

const totalSpreads = computed(() => spreads.value.length)

const current = computed(() => spreads.value[currentSpread.value])

const progress = computed(() => {
  if (!book.value) return '0.00%'
  const base = book.value.progress
  const maxIndex = Math.max(totalSpreads.value - 1, 1)
  const extra = (currentSpread.value / maxIndex) * 0.5
  return `${Math.min(base + extra, 100).toFixed(2)}%`
})

const isBookmarked = computed(() =>
  annotationsStore.isBookmarked(bookId.value, currentSpread.value),
)

async function loadContent() {
  contentLoading.value = true
  try {
    spreads.value = await getBookContent(bookId.value)
    const savedSpread = annotationsStore.getBookmarkSpread(bookId.value)
    if (savedSpread !== undefined && savedSpread < spreads.value.length) {
      currentSpread.value = savedSpread
    }
  } finally {
    contentLoading.value = false
  }
}

async function syncProgressFromSpread() {
  if (!book.value || totalSpreads.value <= 1) return
  const maxIndex = Math.max(totalSpreads.value - 1, 1)
  const nextProgress = Math.min(
    100,
    Math.max(book.value.progress, (currentSpread.value / maxIndex) * 100),
  )
  if (Math.abs(nextProgress - book.value.progress) >= 0.01) {
    await booksStore.updateProgress(bookId.value, Number(nextProgress.toFixed(2)))
  }
}

const goBack = () => {
  router.push('/')
}

const prevSpread = () => {
  if (currentSpread.value > 0) currentSpread.value--
  clearSelection()
}

const nextSpread = () => {
  if (currentSpread.value < totalSpreads.value - 1) currentSpread.value++
  clearSelection()
}

const toggleBookmark = async () => {
  const wasBookmarked = isBookmarked.value
  await annotationsStore.toggleBookmark(bookId.value, currentSpread.value)
  ElMessage.success(wasBookmarked ? '已移除书签' : '已添加书签')
}

const toggleAi = () => {
  showAiPanel.value = !showAiPanel.value
  clearSelection()
}

const clearSelection = () => {
  showToolbar.value = false
  pendingSelection.value = null
  window.getSelection()?.removeAllRanges()
}

const onTextSelect = (payload: {
  blockId: string
  text: string
  start: number
  end: number
  rect: DOMRect
}) => {
  pendingSelection.value = payload
  toolbarPos.value = {
    x: payload.rect.left + payload.rect.width / 2,
    y: payload.rect.top,
  }
  showToolbar.value = true
}

const applyHighlight = async (color: HighlightColor) => {
  if (!pendingSelection.value) return
  const { blockId, start, end, text } = pendingSelection.value
  const result = await annotationsStore.togglePlainHighlight(
    bookId.value,
    blockId,
    currentSpread.value,
    start,
    end,
    color,
    text,
    getChapterByBlockId(blockId, spreads.value),
  )
  const messages = {
    added: '已添加高亮',
    removed: '已取消高亮',
    updated: '已更换高亮颜色',
  }
  ElMessage.success(messages[result])
  clearSelection()
}

const openNoteDialog = () => {
  if (!pendingSelection.value) return
  showNoteDialog.value = true
  showToolbar.value = false
}

const confirmNote = async (payload: { note: string; color: HighlightColor }) => {
  if (!pendingSelection.value) return
  const { blockId, start, end, text } = pendingSelection.value
  await annotationsStore.addHighlight(
    bookId.value,
    blockId,
    currentSpread.value,
    start,
    end,
    payload.color,
    text,
    getChapterByBlockId(blockId, spreads.value),
    payload.note,
  )
  ElMessage.success('笔记已保存')
  pendingSelection.value = null
  window.getSelection()?.removeAllRanges()
}

const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (
    target.closest('.selection-toolbar') ||
    target.closest('.reader-note-dialog') ||
    target.closest('.reader-ai-panel')
  ) {
    return
  }
  if (!target.closest('.reader-block')) {
    clearSelection()
  }
}

watch(currentSpread, () => {
  void syncProgressFromSpread()
})

watch(bookId, () => {
  currentSpread.value = 0
  void loadContent()
})

onMounted(() => {
  if (bookId.value) {
    void booksStore.touchLastRead(bookId.value)
    void loadContent()
  }
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div v-if="book && !contentLoading && current" class="reader">
    <header class="reader-header">
      <div class="reader-header__zone reader-header__zone--left">
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
        <span class="reader-chapter">{{ current.chapter }}</span>
      </div>
      <div class="reader-header__zone reader-header__zone--right">
        <span class="reader-title">{{ book.title }}{{ book.author }}</span>
        <el-button
          :icon="ArrowRight"
          text
          class="reader-exit-btn"
          aria-label="退出阅读"
          @click="goBack"
        />
      </div>
    </header>

    <main class="reader-pages">
      <section class="reader-page reader-page--left">
        <ReaderPageContent
          :book-id="bookId"
          :blocks="current.left.blocks"
          @select="onTextSelect"
        />
        <span class="reader-page-num">第 {{ current.left.page }} 页</span>
      </section>

      <div class="reader-spine" />

      <section class="reader-page reader-page--right">
        <ReaderPageContent
          :book-id="bookId"
          :blocks="current.right.blocks"
          @select="onTextSelect"
        />
        <span class="reader-page-num">第 {{ current.right.page }} 页</span>
      </section>
    </main>

    <footer class="reader-footer">
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

    <ReaderSelectionToolbar
      :visible="showToolbar"
      :x="toolbarPos.x"
      :y="toolbarPos.y"
      @highlight="applyHighlight"
      @note="openNoteDialog"
      @close="clearSelection"
    />

    <ReaderNoteDialog
      v-model:visible="showNoteDialog"
      :quote="pendingSelection?.text ?? ''"
      @confirm="confirmNote"
    />

    <ReaderAiPanel v-model:visible="showAiPanel" :book-id="bookId" />
  </div>

  <div v-else-if="contentLoading" class="reader-not-found">
    <p>正在加载阅读内容…</p>
  </div>

  <div v-else class="reader-not-found">
    <p>未找到该书籍</p>
    <el-button type="primary" @click="goBack">返回首页</el-button>
  </div>
</template>

<style scoped>
.reader {
  min-height: 100vh;
  background: #f7f3eb;
  display: flex;
  flex-direction: column;
  position: relative;
}

.reader-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0d8cc;
  background: #f7f3eb;
}

.reader-header__zone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 32px;
}

.reader-header__zone--right {
  justify-content: flex-end;
}

.reader-progress {
  font-size: 13px;
  color: var(--sanko-text-secondary);
  min-width: 48px;
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
}

.reader-bookmark-btn:hover {
  transform: scale(1.08);
}

.reader-bookmark-btn.is-active {
  transform: none;
}

.reader-chapter {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.reader-title {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: var(--sanko-text);
}

.reader-exit-btn {
  color: var(--sanko-green);
  font-size: 20px;
  font-weight: 600;
}

.reader-pages {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 100px;
}

.reader-spine {
  background: #e0d8cc;
}

.reader-page {
  padding: 24px 32px 56px;
  min-height: 520px;
  position: relative;
  background: #faf8f4;
  display: flex;
  flex-direction: column;
}

.reader-page--left {
  border-radius: 4px 0 0 4px;
}

.reader-page--right {
  border-radius: 0 4px 4px 0;
}

.reader-page-num {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: var(--sanko-text-secondary);
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

.reader-not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style>
