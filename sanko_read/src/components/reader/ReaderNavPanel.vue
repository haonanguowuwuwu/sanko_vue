<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import type { Book } from '@/types/book'
import type { ReaderChapterItem } from '@/reader/useKookitRendition'
import type { ReaderBookmark, ReaderHighlight } from '@/types/reader'
import BookCoverFace from '@/components/BookCoverFace.vue'
import { SPREAD_PAGE_STRIDE } from '@/reader/spreadIndex'

type NavTab = 'toc' | 'bookmarks' | 'notes' | 'highlights'

const props = defineProps<{
  visible: boolean
  book: Book
  chapters: ReaderChapterItem[]
  activeChapterIndex: number
  bookmarks: ReaderBookmark[]
  notes: ReaderHighlight[]
  highlights: ReaderHighlight[]
  progressPercent: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'navigate-chapter': [index: number]
}>()

const activeTab = ref<NavTab>('toc')
const chaptersExpanded = ref(true)

const tabs: { key: NavTab; label: string }[] = [
  { key: 'toc', label: '目录' },
  { key: 'bookmarks', label: '书签' },
  { key: 'notes', label: '笔记' },
  { key: 'highlights', label: '高亮' },
]

const readLabel = computed(() => {
  if (props.progressPercent > 0) {
    return `已读 ${props.progressPercent.toFixed(0)}%`
  }
  if (props.book.progress > 0) {
    return `已读 ${props.book.progress.toFixed(0)}%`
  }
  return '尚未开始'
})

function resolveBookmarkLabel(bookmark: ReaderBookmark): string {
  if (bookmark.chapter?.trim()) return bookmark.chapter.trim()

  const chapterDocIndex =
    bookmark.spreadIndex >= SPREAD_PAGE_STRIDE
      ? Math.floor(bookmark.spreadIndex / SPREAD_PAGE_STRIDE) - 1
      : bookmark.spreadIndex

  const chapter = props.chapters.find((ch) => ch.index === chapterDocIndex)
  if (chapter?.label) return chapter.label

  return `位置 ${bookmark.spreadIndex + 1}`
}

const bookmarkItems = computed(() =>
  props.bookmarks.map((bookmark) => ({
    ...bookmark,
    label: resolveBookmarkLabel(bookmark),
  })),
)

watch(
  () => props.visible,
  (open) => {
    if (open) {
      activeTab.value = 'toc'
      chaptersExpanded.value = true
    }
  },
)

function toggleChaptersExpanded() {
  chaptersExpanded.value = !chaptersExpanded.value
}

function navigateChapter(index: number) {
  emit('navigate-chapter', index)
}

function navigateFromAnnotation(item: ReaderHighlight) {
  emit('navigate-chapter', item.spreadIndex)
}

const highlightColorClass = (color: string) => `reader-nav__hl--${color}`
</script>

<template>
  <Transition name="reader-nav">
    <aside v-if="visible" class="reader-nav" role="dialog" aria-label="书籍导航">
      <header class="reader-nav__book">
        <div class="reader-nav__cover-wrap">
          <BookCoverFace :book="book" class="reader-nav__cover" />
          <span class="reader-nav__format">{{ book.format }}</span>
        </div>
        <div class="reader-nav__meta">
          <h2 class="reader-nav__title" :title="book.title">{{ book.title }}</h2>
          <p class="reader-nav__author">作者：{{ book.author || '佚名' }}</p>
          <p class="reader-nav__read">{{ readLabel }}</p>
        </div>
      </header>

      <nav class="reader-nav__tabs" aria-label="导航分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="reader-nav__tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="reader-nav__body">
        <!-- 目录 -->
        <section v-if="activeTab === 'toc'" class="reader-nav__section">
          <div class="reader-nav__section-head">
            <span>总章节数：{{ chapters.length }}</span>
            <button type="button" class="reader-nav__toggle" @click="toggleChaptersExpanded">
              {{ chaptersExpanded ? '收起章节' : '展开章节' }}
              <el-icon :size="12">
                <ArrowUp v-if="chaptersExpanded" />
                <ArrowDown v-else />
              </el-icon>
            </button>
          </div>
          <ul v-if="chaptersExpanded" class="reader-nav__chapter-list">
            <li v-if="chapters.length === 0" class="reader-nav__empty">暂无目录</li>
            <li
              v-for="chapter in chapters"
              :key="chapter.index"
              class="reader-nav__chapter-item"
              :class="{ 'is-active': chapter.index === activeChapterIndex }"
            >
              <button type="button" @click="navigateChapter(chapter.index)">
                {{ chapter.label }}
              </button>
            </li>
          </ul>
        </section>

        <!-- 书签 -->
        <section v-else-if="activeTab === 'bookmarks'" class="reader-nav__section">
          <ul class="reader-nav__annotation-list">
            <li v-if="bookmarkItems.length === 0" class="reader-nav__empty">暂无书签</li>
            <li
              v-for="item in bookmarkItems"
              :key="item.id"
              class="reader-nav__annotation-item"
            >
              <button type="button" @click="navigateChapter(item.spreadIndex)">
                <span class="reader-nav__annotation-title">{{ item.label }}</span>
                <span class="reader-nav__annotation-sub">书签位置</span>
              </button>
            </li>
          </ul>
        </section>

        <!-- 笔记 -->
        <section v-else-if="activeTab === 'notes'" class="reader-nav__section">
          <ul class="reader-nav__annotation-list">
            <li v-if="notes.length === 0" class="reader-nav__empty">暂无笔记</li>
            <li v-for="item in notes" :key="item.id" class="reader-nav__annotation-item">
              <button type="button" @click="navigateFromAnnotation(item)">
                <span v-if="item.note" class="reader-nav__annotation-title">{{ item.note }}</span>
                <span class="reader-nav__annotation-quote">{{ item.quote }}</span>
                <span class="reader-nav__annotation-sub">{{ item.chapter }} · {{ item.createdAt }}</span>
              </button>
            </li>
          </ul>
        </section>

        <!-- 高亮 -->
        <section v-else class="reader-nav__section">
          <ul class="reader-nav__annotation-list">
            <li v-if="highlights.length === 0" class="reader-nav__empty">暂无高亮</li>
            <li v-for="item in highlights" :key="item.id" class="reader-nav__annotation-item">
              <button type="button" @click="navigateFromAnnotation(item)">
                <span
                  class="reader-nav__annotation-quote"
                  :class="highlightColorClass(item.color)"
                >
                  {{ item.quote }}
                </span>
                <span class="reader-nav__annotation-sub">{{ item.chapter }} · {{ item.createdAt }}</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.reader-nav {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  width: min(320px, 88vw);
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e0d8cc;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.reader-nav__book {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #eee6da;
}

.reader-nav__cover-wrap {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 96px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.reader-nav__cover-wrap :deep(.book-cover-face) {
  height: 100%;
  padding: 8px 6px;
}

.reader-nav__cover-wrap :deep(.book-cover-face__title) {
  font-size: 12px;
  letter-spacing: 2px;
}

.reader-nav__cover-wrap :deep(.book-cover-face__en) {
  display: none;
}

.reader-nav__format {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #333;
  background: #f5d547;
}

.reader-nav__meta {
  min-width: 0;
  flex: 1;
}

.reader-nav__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-nav__author,
.reader-nav__read {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.reader-nav__tabs {
  display: flex;
  border-bottom: 1px solid #eee6da;
}

.reader-nav__tab {
  flex: 1;
  border: none;
  background: none;
  padding: 12px 4px;
  font-size: 13px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.reader-nav__tab.is-active {
  color: var(--sanko-text);
  font-weight: 600;
  border-bottom-color: var(--sanko-green);
}

.reader-nav__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.reader-nav__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 10px;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.reader-nav__toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.reader-nav__chapter-list,
.reader-nav__annotation-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.reader-nav__chapter-item button,
.reader-nav__annotation-item button {
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--sanko-text);
  transition: background 0.12s;
}

.reader-nav__chapter-item button:hover,
.reader-nav__annotation-item button:hover {
  background: #f7f3eb;
}

.reader-nav__chapter-item.is-active button {
  color: #c45656;
  font-weight: 600;
}

.reader-nav__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.reader-nav__annotation-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
  margin-bottom: 4px;
}

.reader-nav__annotation-quote {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  color: var(--sanko-text-secondary);
  margin-bottom: 4px;
}

.reader-nav__annotation-sub {
  display: block;
  font-size: 11px;
  color: #aaa;
}

.reader-nav__hl--blue {
  border-left: 3px solid #5b8def;
  padding-left: 8px;
}

.reader-nav__hl--green {
  border-left: 3px solid #5a7a6a;
  padding-left: 8px;
}

.reader-nav__hl--cyan {
  border-left: 3px solid #3db8b8;
  padding-left: 8px;
}

.reader-nav__hl--yellow {
  border-left: 3px solid #c9a030;
  padding-left: 8px;
}

.reader-nav__hl--purple {
  border-left: 3px solid #9b6fd4;
  padding-left: 8px;
}

.reader-nav__hl--gray {
  border-left: 3px solid #999;
  padding-left: 8px;
}

.reader-nav-enter-active,
.reader-nav-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.reader-nav-enter-from,
.reader-nav-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
