<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import type { Book } from '@/types/book'
import { loadBookBuffer } from '@/reader/bookLoader'
import { useKookitRendition, type ReaderChapterItem } from '@/reader/useKookitRendition'
import { configService } from '@/reader/configService'
import { isPdfFormat } from '@/reader/readerSettings'
import type { TextSelectionPayload } from '@/reader/highlightUtils'

const props = defineProps<{
  bookId: string
  book: Book
}>()

const emit = defineEmits<{
  progress: [percent: number]
  chapter: [title: string]
  'spread-index': [index: number]
  'text-selection': [payload: TextSelectionPayload | null]
  ready: []
  error: [message: string]
}>()

const pageAreaRef = ref<HTMLElement | null>(null)

const renditionOptions = computed(() => ({
  bookId: props.bookId,
  format: props.book.format,
}))

const isPdfBook = computed(() => isPdfFormat(props.book.format))

const readerBackground = ref(configService.getReaderConfig('backgroundColor') || '#faf8f4')

const {
  loading,
  error,
  chapterTitle,
  progressPercent,
  currentSpreadIndex,
  textSelection,
  open,
  prev,
  next,
  goToSavedLocation,
  goToChapterDocIndex,
  goToSpreadIndex,
  getChapterList,
  getCurrentChapterIndex,
  getCurrentSpreadIndex,
  applyReaderStyles,
  applyStoredHighlights,
  clearTextSelection,
  refreshPendingSelectionRange,
} = useKookitRendition(pageAreaRef, renditionOptions)

const chapterList = ref<ReaderChapterItem[]>([])

const displayError = computed(() => error.value)

const hostStyle = computed(() => ({
  backgroundColor: readerBackground.value,
}))

let loadSeq = 0

async function loadBook() {
  const seq = ++loadSeq
  try {
    const buffer = await loadBookBuffer(props.bookId)
    if (seq !== loadSeq) return
    await open(buffer)
    if (seq !== loadSeq) return
    if (isPdfBook.value) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
    }
    if (seq !== loadSeq) return
    chapterList.value = getChapterList()
    emit('ready')
    emit('chapter', chapterTitle.value)
    emit('progress', progressPercent.value)
    emit('spread-index', getCurrentSpreadIndex())
  } catch (e) {
    if (seq !== loadSeq) return
    const message = e instanceof Error ? e.message : '加载失败'
    emit('error', message)
  }
}

function refreshReaderStyles() {
  readerBackground.value = configService.getReaderConfig('backgroundColor') || '#faf8f4'
  applyReaderStyles(props.bookId)
}

async function reloadBook() {
  await loadBook()
}

watch(progressPercent, (value) => {
  emit('progress', value)
})

watch(currentSpreadIndex, (value) => {
  emit('spread-index', value)
})

watch(textSelection, (value) => {
  emit('text-selection', value)
})

watch(chapterTitle, (value) => {
  emit('chapter', value)
  chapterList.value = getChapterList()
})

function fetchChapterList(): ReaderChapterItem[] {
  const list = getChapterList()
  chapterList.value = list
  return list
}

defineExpose({
  prev,
  next,
  goToSavedLocation,
  goToChapterDocIndex,
  goToSpreadIndex,
  getBookmarkSpreadIndex,
  getChapterList: fetchChapterList,
  getCurrentChapterIndex,
  getCurrentSpreadIndex,
  applyReaderStyles: refreshReaderStyles,
  applyStoredHighlights,
  clearTextSelection,
  refreshPendingSelectionRange,
  reloadBook,
  loading,
})

watch(
  () => props.bookId,
  () => {
    void loadBook()
  },
)

onMounted(() => {
  void nextTick().then(() => loadBook())
})

function getBookmarkSpreadIndex(): number {
  return getCurrentSpreadIndex()
}
</script>

<template>
  <div class="kookit-reader-host" :style="hostStyle">
    <div v-if="loading" class="kookit-reader-host__loading">正在解析书籍…</div>
    <div v-else-if="displayError" class="kookit-reader-host__error">{{ displayError }}</div>
    <div
      id="page-area"
      ref="pageAreaRef"
      class="kookit-reader-host__page html-viewer-page"
      :class="{ 'kookit-reader-host__page--pdf-scroll': isPdfBook }"
    />
  </div>
</template>

<style scoped>
.kookit-reader-host {
  flex: 1;
  position: relative;
  min-height: 520px;
  border-radius: 4px;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.kookit-reader-host__page {
  position: absolute;
  inset: 24px 32px 56px;
  z-index: 1;
  user-select: text;
}

.kookit-reader-host__page--pdf-scroll {
  inset: 16px 24px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.kookit-reader-host__loading,
.kookit-reader-host__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--sanko-text-secondary);
  z-index: 2;
}

.kookit-reader-host__error {
  color: #c45656;
  padding: 24px;
  text-align: center;
}
</style>

<style>
/* kookit iframe 内排版需全局样式补充 */
#page-area iframe {
  border: none;
  width: 100%;
}

/* PDF 滚动：高度由 kookit 行内 style 撑开，不能用 100% 锁死一屏 */
#page-area.kookit-reader-host__page--pdf-scroll > iframe {
  height: auto;
  min-height: 100%;
  display: block;
}

#page-area:not(.kookit-reader-host__page--pdf-scroll) iframe {
  height: 100%;
}
</style>
