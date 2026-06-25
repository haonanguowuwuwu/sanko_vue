<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleClose } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import type { CatalogComment } from '@/data/catalogBooks'
import { useUserStore } from '@/stores/user'
import { useRequireLogin } from '@/composables/useRequireLogin'
import BookCommentComposer from '@/components/book/BookCommentComposer.vue'
import BookCommentReportDialog from '@/components/book/BookCommentReportDialog.vue'

const props = defineProps<{
  initialComments?: CatalogComment[]
  interactive?: boolean
}>()

const userStore = useUserStore()
const { username } = storeToRefs(userStore)
const { requireLogin } = useRequireLogin()

const canInteract = computed(() => props.interactive !== false && userStore.isLoggedIn)

const comments = ref<CatalogComment[]>([])
const newCommentText = ref('')
const replyText = ref('')
const replyingToId = ref<string | null>(null)
const expandedReplies = ref<Record<string, boolean>>({})
const expandedReplyLists = ref<Record<string, boolean>>({})
const showAllComments = ref(false)
const likedIds = ref<Set<string>>(new Set())
const showReportDialog = ref(false)
const reportTarget = ref<{ commentId: string; replyId?: string } | null>(null)

watch(
  () => props.initialComments,
  (value) => {
    comments.value = (value ?? []).map((comment) => ({
      ...comment,
      replies: comment.replies?.map((reply) => ({ ...reply })),
    }))
    expandedReplies.value = {}
    expandedReplyLists.value = {}
    showAllComments.value = false
    replyingToId.value = null
    replyText.value = ''
    newCommentText.value = ''
  },
  { immediate: true },
)

const visibleComments = computed(() =>
  showAllComments.value ? comments.value : comments.value.slice(0, 2),
)

const currentUserName = computed(() => username.value ?? '游客')

const formatDate = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const createId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const hasReplies = (comment: CatalogComment) => (comment.replies?.length ?? 0) > 0

const isRepliesExpanded = (comment: CatalogComment) =>
  expandedReplies.value[comment.id] ?? false

const visibleReplies = (comment: CatalogComment) => {
  const replies = comment.replies ?? []
  if (expandedReplyLists.value[comment.id]) return replies
  return replies.slice(0, 1)
}

const hasMoreReplies = (comment: CatalogComment) =>
  (comment.replies?.length ?? 0) > 1 && !expandedReplyLists.value[comment.id]

const toggleReplies = (commentId: string) => {
  expandedReplies.value[commentId] = !expandedReplies.value[commentId]
}

const loadMoreReplies = (commentId: string) => {
  expandedReplyLists.value[commentId] = true
}

const isLiked = (id: string) => likedIds.value.has(id)

const toggleLike = (target: CatalogComment) => {
  const liked = new Set(likedIds.value)
  if (liked.has(target.id)) {
    liked.delete(target.id)
    target.likes = Math.max(0, target.likes - 1)
  } else {
    liked.add(target.id)
    target.likes += 1
  }
  likedIds.value = liked
}

const startReply = (commentId: string) => {
  requireLogin(() => {
    replyingToId.value = replyingToId.value === commentId ? null : commentId
    replyText.value = ''
    expandedReplies.value[commentId] = true
  }, '请先登录后再回复')
}

const submitComment = () => {
  if (!canInteract.value) return
  const content = newCommentText.value.trim()
  if (!content) return

  comments.value.unshift({
    id: createId(),
    user: currentUserName.value,
    content,
    date: formatDate(),
    likes: 0,
    replyCount: 0,
    replies: [],
  })
  newCommentText.value = ''
  ElMessage.success('评论已发送')
}

const submitReply = (comment: CatalogComment) => {
  if (!canInteract.value) return
  const content = replyText.value.trim()
  if (!content) return

  if (!comment.replies) comment.replies = []
  comment.replies.push({
    id: createId(),
    user: currentUserName.value,
    content,
    date: formatDate(),
    likes: 0,
    replyCount: 0,
  })
  comment.replyCount = comment.replies.length
  expandedReplies.value[comment.id] = true
  replyingToId.value = null
  replyText.value = ''
  ElMessage.success('回复已发送')
}

const openReport = (commentId: string, replyId?: string) => {
  requireLogin(() => {
    reportTarget.value = { commentId, replyId }
    showReportDialog.value = true
  }, '请先登录后再举报')
}

const onReportConfirm = (reason: string) => {
  const target = reportTarget.value
  if (!target) return

  let label = '评论'
  if (target.replyId) {
    const comment = comments.value.find((item) => item.id === target.commentId)
    const reply = comment?.replies?.find((item) => item.id === target.replyId)
    label = reply ? `${reply.user} 的回复` : '回复'
  } else {
    const comment = comments.value.find((item) => item.id === target.commentId)
    label = comment ? `${comment.user} 的评论` : '评论'
  }

  ElMessage.success(`已举报${label}：${reason}`)
  reportTarget.value = null
}
</script>

<template>
  <section class="book-comments">
    <h2 class="book-comments__heading">评论</h2>

    <BookCommentComposer
      v-if="canInteract"
      v-model="newCommentText"
      @submit="submitComment"
    />
    <p v-else class="book-comments__guest-hint">登录后即可发表评论、回复与举报</p>

    <article v-for="comment in visibleComments" :key="comment.id" class="book-comment">
      <div class="book-comment__main">
        <div class="book-comment__avatar" aria-hidden="true" />
        <div class="book-comment__body">
          <div class="book-comment__header">
            <span class="book-comment__user">{{ comment.user }}</span>
            <div class="book-comment__toolbar">
              <button
                v-if="hasReplies(comment)"
                type="button"
                class="book-comment__stat book-comment__stat--btn"
                :class="{ 'is-active': isRepliesExpanded(comment) }"
                :aria-expanded="isRepliesExpanded(comment)"
                aria-label="查看回复"
                @click="toggleReplies(comment.id)"
              >
                <svg class="book-comment__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    v-if="isRepliesExpanded(comment)"
                    fill="currentColor"
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                  />
                  <path
                    v-else
                    fill="currentColor"
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                  />
                </svg>
                {{ comment.replyCount }}
              </button>
              <button
                type="button"
                class="book-comment__stat book-comment__stat--btn"
                :class="{ 'is-active': isLiked(comment.id) }"
                aria-label="点赞"
                @click="toggleLike(comment)"
              >
                <svg class="book-comment__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
                  />
                </svg>
                {{ comment.likes }}
              </button>
              <button
                v-if="canInteract"
                type="button"
                class="book-comment__report"
                @click="openReport(comment.id)"
              >
                <el-icon :size="16"><CircleClose /></el-icon>
                举报
              </button>
            </div>
          </div>
          <p class="book-comment__content">{{ comment.content }}</p>
          <div class="book-comment__footer">
            <span class="book-comment__date">{{ comment.date }}</span>
            <button
              v-if="canInteract"
              type="button"
              class="book-comment__reply"
              @click="startReply(comment.id)"
            >
              回复
            </button>
          </div>
        </div>
      </div>

      <BookCommentComposer
        v-if="replyingToId === comment.id"
        v-model="replyText"
        compact
        :placeholder="`回复 ${comment.user}`"
        @submit="submitReply(comment)"
      />

      <div
        v-if="hasReplies(comment) && isRepliesExpanded(comment)"
        class="book-comment__replies"
      >
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
                <div class="book-comment__toolbar">
                  <button
                    type="button"
                    class="book-comment__stat book-comment__stat--btn"
                    :class="{ 'is-active': isLiked(reply.id) }"
                    aria-label="点赞"
                    @click="toggleLike(reply)"
                  >
                    <svg class="book-comment__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
                      />
                    </svg>
                    {{ reply.likes }}
                  </button>
                  <button
                    v-if="canInteract"
                    type="button"
                    class="book-comment__report"
                    @click="openReport(comment.id, reply.id)"
                  >
                    <el-icon :size="16"><CircleClose /></el-icon>
                    举报
                  </button>
                </div>
              </div>
              <p class="book-comment__content">{{ reply.content }}</p>
              <div class="book-comment__footer">
                <span class="book-comment__date">{{ reply.date }}</span>
                <button
                  v-if="canInteract"
                  type="button"
                  class="book-comment__reply"
                  @click="startReply(comment.id)"
                >
                  回复
                </button>
              </div>
            </div>
          </div>
        </article>
        <button
          v-if="hasMoreReplies(comment)"
          type="button"
          class="book-comment__load-more"
          @click="loadMoreReplies(comment.id)"
        >
          加载更多回复
        </button>
      </div>
    </article>

    <button
      v-if="!showAllComments && comments.length > 2"
      type="button"
      class="book-comments__load-more"
      @click="showAllComments = true"
    >
      加载更多评论
    </button>

    <BookCommentReportDialog v-model:visible="showReportDialog" @confirm="onReportConfirm" />
  </section>
</template>

<style scoped>
.book-comments__heading {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-green);
}

.book-comments__guest-hint {
  margin: 0 0 20px;
  padding: 12px 16px;
  border-radius: 4px;
  background: #f5f0e8;
  font-size: 13px;
  color: var(--sanko-text-secondary);
  text-align: center;
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
  gap: 16px;
  margin-bottom: 6px;
}

.book-comment__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.book-comment__icon {
  display: block;
  flex-shrink: 0;
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

.book-comment__reply:hover {
  color: var(--sanko-green);
}

.book-comment__stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.book-comment__stat--btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.15s;
}

.book-comment__stat--btn.is-active {
  color: var(--sanko-green);
}

.book-comment__stat--btn:hover {
  color: var(--sanko-green);
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
.book-comments__load-more {
  display: block;
  padding: 0;
  border: none;
  background: none;
  color: #1a8a8f;
  font-size: 13px;
  cursor: pointer;
}

.book-comment__load-more {
  margin: 8px 0 0 48px;
}

.book-comments__load-more {
  margin: 12px 0 0;
  text-align: center;
  width: 100%;
}

@media (max-width: 640px) {
  .book-comment__replies {
    margin-left: 24px;
  }

  .book-comment__load-more {
    margin-left: 24px;
  }
}
</style>
