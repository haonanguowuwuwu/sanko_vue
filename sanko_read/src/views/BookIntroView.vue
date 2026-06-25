<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, CircleClose, ChatDotRound, Pointer } from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import { getCatalogBook, type CatalogComment } from '@/data/catalogBooks'

const route = useRoute()
const router = useRouter()

const book = computed(() => getCatalogBook(route.params.id as string))
const liked = ref(false)
const blocked = ref(false)
const expandedReplies = ref<Record<string, boolean>>({})
const showAllComments = ref(false)

const visibleComments = computed(() => {
  const comments = book.value?.comments ?? []
  return showAllComments.value ? comments : comments.slice(0, 2)
})

const goBack = () => {
  router.push('/')
}

const toggleLike = () => {
  liked.value = !liked.value
  ElMessage.success(liked.value ? '已添加到喜欢' : '已从喜欢移除')
}

const toggleBlock = () => {
  blocked.value = !blocked.value
  ElMessage.info(blocked.value ? '已加入屏蔽' : '已取消屏蔽')
}

const startReading = () => {
  ElMessage.info('该书籍尚未加入书架，请先导入或购买')
}

const toggleReplies = (commentId: string) => {
  expandedReplies.value[commentId] = !expandedReplies.value[commentId]
}

const isRepliesExpanded = (comment: CatalogComment) =>
  expandedReplies.value[comment.id] ?? false

const visibleReplies = (comment: CatalogComment) => {
  const replies = comment.replies ?? []
  if (isRepliesExpanded(comment)) return replies
  return replies.slice(0, 1)
}

const hasMoreReplies = (comment: CatalogComment) =>
  (comment.replies?.length ?? 0) > 1 && !isRepliesExpanded(comment)
</script>

<template>
  <div v-if="book" class="book-intro">
    <header class="book-intro__toolbar">
      <button type="button" class="book-intro__back" aria-label="返回首页" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </button>
      <button
        type="button"
        class="book-intro__shield"
        :class="{ 'book-intro__shield--active': blocked }"
        @click="toggleBlock"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.54-3.07 8.83-7 9.93-3.93-1.1-7-5.39-7-9.93V6.3l7-3.12z"
          />
        </svg>
        加入屏蔽
      </button>
    </header>

    <section class="book-intro__hero">
      <div class="book-intro__cover" :style="{ background: book.coverColor }">
        <span class="book-intro__cover-title">{{ book.coverTitle }}</span>
      </div>

      <dl class="book-intro__meta">
        <div class="book-intro__meta-row">
          <dt>标题：</dt>
          <dd>{{ book.title }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>作者：</dt>
          <dd>{{ book.author }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>属性：</dt>
          <dd>{{ book.category ?? '—' }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>更新状态：</dt>
          <dd>{{ book.updateStatus ?? '—' }}</dd>
        </div>
        <div class="book-intro__meta-row">
          <dt>最新章节：</dt>
          <dd>{{ book.latestChapter ?? '—' }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="book.tags?.length" class="book-intro__tags">
      <span class="book-intro__tags-label">标签：</span>
      <span v-for="tag in book.tags" :key="tag" class="book-intro__tag">{{ tag }}</span>
    </section>

    <p class="book-intro__synopsis">
      {{ book.synopsis ?? book.description ?? '暂无简介' }}
    </p>

    <div class="book-intro__actions">
      <button
        type="button"
        class="book-intro__like"
        :class="{ 'book-intro__like--active': liked }"
        @click="toggleLike"
      >
        <HeartIcon :size="18" :filled="liked" />
        喜欢
      </button>
      <button type="button" class="book-intro__read" @click="startReading">开始阅读</button>
    </div>

    <section v-if="book.comments?.length" class="book-intro__comments">
      <h2 class="book-intro__comments-heading">评论</h2>

      <article v-for="comment in visibleComments" :key="comment.id" class="book-comment">
        <div class="book-comment__main">
          <div class="book-comment__avatar" aria-hidden="true" />
          <div class="book-comment__body">
            <div class="book-comment__header">
              <span class="book-comment__user">{{ comment.user }}</span>
              <button type="button" class="book-comment__report">
                <el-icon :size="14"><CircleClose /></el-icon>
                举报
              </button>
            </div>
            <p class="book-comment__content">{{ comment.content }}</p>
            <div class="book-comment__footer">
              <span class="book-comment__date">{{ comment.date }}</span>
              <button type="button" class="book-comment__reply">回复</button>
            </div>
          </div>
          <div class="book-comment__stats">
            <span class="book-comment__stat">
              <el-icon :size="16"><ChatDotRound /></el-icon>
              {{ comment.replyCount }}
            </span>
            <span class="book-comment__stat">
              <el-icon :size="16"><Pointer /></el-icon>
              {{ comment.likes }}
            </span>
          </div>
        </div>

        <div v-if="comment.replies?.length" class="book-comment__replies">
          <article
            v-for="reply in visibleReplies(comment)"
            :key="reply.id"
            class="book-comment book-comment--reply"
          >
            <div class="book-comment__main">
              <div class="book-comment__avatar" aria-hidden="true" />
              <div class="book-comment__body">
                <div class="book-comment__header">
                  <span class="book-comment__user">{{ reply.user }}</span>
                  <button type="button" class="book-comment__report">
                    <el-icon :size="14"><CircleClose /></el-icon>
                    举报
                  </button>
                </div>
                <p class="book-comment__content">{{ reply.content }}</p>
                <div class="book-comment__footer">
                  <span class="book-comment__date">{{ reply.date }}</span>
                  <button type="button" class="book-comment__reply">回复</button>
                </div>
              </div>
              <div class="book-comment__stats">
                <span class="book-comment__stat">
                  <el-icon :size="16"><Pointer /></el-icon>
                  {{ reply.likes }}
                </span>
              </div>
            </div>
          </article>
          <button
            v-if="hasMoreReplies(comment)"
            type="button"
            class="book-comment__load-more"
            @click="toggleReplies(comment.id)"
          >
            加载更多回复
          </button>
        </div>
      </article>

      <button
        v-if="!showAllComments && (book.comments?.length ?? 0) > 2"
        type="button"
        class="book-intro__load-more"
        @click="showAllComments = true"
      >
        加载更多评论
      </button>
    </section>
  </div>

  <div v-else class="book-intro book-intro--empty">
    <p>未找到该书籍</p>
    <button type="button" class="book-intro__read" @click="goBack">返回首页</button>
  </div>
</template>

<style scoped>
.book-intro {
  --book-intro-inset: 120px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-inline: var(--book-intro-inset);
  padding-bottom: 32px;
}

.book-intro--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--sanko-text-secondary);
}

.book-intro__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.book-intro__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--sanko-text);
  cursor: pointer;
  transition: background 0.15s;
}

.book-intro__back:hover {
  background: rgba(0, 0, 0, 0.05);
}

.book-intro__shield {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--sanko-green);
  border-radius: 999px;
  background: #fff;
  color: var(--sanko-green);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.book-intro__shield:hover,
.book-intro__shield--active {
  background: var(--sanko-green);
  color: #fff;
}

.book-intro__hero {
  display: flex;
  gap: 28px;
  margin-bottom: 16px;
}

.book-intro__cover {
  flex-shrink: 0;
  width: 140px;
  height: 186px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #1a1a1a;
}

.book-intro__cover-title {
  font-size: 28px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 4px;
}

.book-intro__meta {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding-top: 8px;
}

.book-intro__meta-row {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.book-intro__meta-row dt {
  flex-shrink: 0;
  margin: 0;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-intro__meta-row dd {
  margin: 0;
  color: var(--sanko-text);
}

.book-intro__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.book-intro__tags-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-intro__tag {
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.book-intro__synopsis {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--sanko-text-secondary);
}

.book-intro__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 28px;
}

.book-intro__like {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: none;
  background: none;
  color: #e74c3c;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.book-intro__like:not(.book-intro__like--active) {
  color: var(--sanko-text-secondary);
}

.book-intro__like:hover {
  opacity: 0.85;
}

.book-intro__read {
  padding: 10px 28px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.book-intro__read:hover {
  background: var(--sanko-green-hover);
}

.book-intro__comments-heading {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-green);
}

.book-comment {
  padding: 16px 0;
  border-top: 1px solid var(--sanko-border);
}

.book-comment__main {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.book-comment__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #d9d9d9;
}

.book-comment__body {
  flex: 1;
  min-width: 0;
}

.book-comment__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.book-comment__user {
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.book-comment__report {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--sanko-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.book-comment__content {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sanko-text);
}

.book-comment__footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-comment__date {
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.book-comment__reply {
  border: none;
  background: none;
  padding: 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.book-comment__stats {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding-top: 2px;
}

.book-comment__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.book-comment__replies {
  margin-left: 48px;
  margin-top: 4px;
}

.book-comment--reply {
  padding: 12px 0;
  border-top: none;
}

.book-comment__load-more,
.book-intro__load-more {
  display: block;
  margin: 8px 0 0 48px;
  padding: 0;
  border: none;
  background: none;
  color: #1a8a8f;
  font-size: 13px;
  cursor: pointer;
}

.book-intro__load-more {
  margin: 12px 0 0;
  text-align: center;
  width: 100%;
}

@media (max-width: 1100px) {
  .book-intro {
    --book-intro-inset: 48px;
  }
}

@media (max-width: 640px) {
  .book-intro {
    --book-intro-inset: 16px;
  }

  .book-intro__hero {
    flex-direction: column;
    align-items: center;
  }

  .book-intro__meta {
    width: 100%;
  }

  .book-intro__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .book-intro__read {
    width: 100%;
    text-align: center;
  }

  .book-comment__replies {
    margin-left: 24px;
  }
}
</style>
