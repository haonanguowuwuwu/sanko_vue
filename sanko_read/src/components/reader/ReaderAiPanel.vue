<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { sendChatMessage, type ChatMessageDto } from '@/api/chat'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  visible: boolean
  bookId?: string
  source?: 'reader' | 'book'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const inputText = ref('')
const sending = ref(false)
const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '你好，我可以解答你关于阅读和学习的任何问题',
  },
])
const chatBodyRef = ref<HTMLElement | null>(null)

watch(
  () => props.visible,
  (open) => {
    if (open && messages.value.length === 1) {
      // keep welcome message
    }
  },
)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  sending.value = true
  try {
    const history: ChatMessageDto[] = messages.value
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }))
    const response = await sendChatMessage({
      message: text,
      history,
      source: props.source ?? 'reader',
      bookId: props.bookId,
    })
    messages.value.push({ role: 'assistant', content: response.reply })
    scrollToBottom()
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败'
    messages.value.push({ role: 'assistant', content: message })
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Transition name="ai-panel">
    <div v-if="visible" class="reader-ai-panel">
      <header class="reader-ai-panel__header">
        <span class="reader-ai-panel__title">sanko助手</span>
        <button type="button" class="reader-ai-panel__close" @click="handleClose">
          <el-icon :size="16"><Close /></el-icon>
        </button>
      </header>

      <div ref="chatBodyRef" class="reader-ai-panel__body">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="reader-ai-panel__msg"
          :class="`reader-ai-panel__msg--${msg.role}`"
        >
          {{ msg.content }}
        </div>
      </div>

      <footer class="reader-ai-panel__footer">
        <input
          v-model="inputText"
          type="text"
          class="reader-ai-panel__input"
          placeholder="询问任何关于阅读和学习的任何问题"
          :disabled="sending"
          @keyup.enter="handleSend"
        />
        <button type="button" class="reader-ai-panel__send" :disabled="sending" @click="handleSend">
          {{ sending ? '…' : '发送' }}
        </button>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.reader-ai-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(420px, 90vw);
  max-height: 70vh;
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 300;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}

.reader-ai-panel__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--sanko-green);
}

.reader-ai-panel__close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--sanko-green);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reader-ai-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  min-height: 160px;
  max-height: 320px;
}

.reader-ai-panel__msg {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  max-width: 85%;
}

.reader-ai-panel__msg--assistant {
  background: #e8e4dc;
  color: var(--sanko-text);
  margin-right: auto;
}

.reader-ai-panel__msg--user {
  background: #fff;
  color: var(--sanko-text);
  margin-left: auto;
  border: 1px solid #ebe4d8;
}

.reader-ai-panel__footer {
  display: flex;
  gap: 10px;
  padding: 12px 20px 20px;
}

.reader-ai-panel__input {
  flex: 1;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  outline: none;
}

.reader-ai-panel__input:focus {
  border-color: var(--sanko-green);
}

.reader-ai-panel__send {
  flex-shrink: 0;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.reader-ai-panel__send:hover:not(:disabled) {
  background: var(--sanko-green-hover);
}

.reader-ai-panel__send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-panel-enter-active,
.ai-panel-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}
</style>
