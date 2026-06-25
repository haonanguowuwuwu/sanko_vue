<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Picture, Microphone, Top } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sendChatMessage, type ChatMessageDto } from '@/api/chat'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const message = ref('')
const sending = ref(false)
const messages = ref<ChatMessage[]>([])
const chatBodyRef = ref<HTMLDivElement | null>(null)

const hasContent = computed(() => message.value.trim().length > 0)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  const text = message.value.trim()
  if (!text || sending.value) return

  messages.value.push({ role: 'user', content: text })
  message.value = ''
  scrollToBottom()

  sending.value = true
  try {
    const history: ChatMessageDto[] = messages.value
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }))
    const response = await sendChatMessage({ message: text, history, source: 'home' })
    messages.value.push({ role: 'assistant', content: response.reply })
    scrollToBottom()
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '发送失败'
    ElMessage.error(errMsg)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="chat-panel">
    <div v-if="messages.length === 0" class="chat-panel__welcome">
      <h2 class="chat-panel__welcome-title">你好，我是你的助手 sanko</h2>
      <p class="chat-panel__welcome-desc">可以帮你找书，总结内容，讨论观点</p>
    </div>

    <div v-else ref="chatBodyRef" class="chat-panel__messages">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="chat-panel__message"
        :class="`chat-panel__message--${msg.role}`"
      >
        {{ msg.content }}
      </div>
    </div>

    <div class="chat-panel__input-area">
      <el-input
        v-model="message"
        type="textarea"
        :rows="3"
        placeholder="你想知道什么？"
        resize="none"
        class="chat-panel__textarea"
        :disabled="sending"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="chat-panel__input-toolbar">
        <div class="chat-panel__input-actions">
          <el-button :icon="Picture" text circle disabled />
          <el-button text circle disabled>&lt;/&gt;</el-button>
          <el-button :icon="Microphone" text circle disabled />
        </div>
        <el-button
          class="chat-panel__send-btn"
          :class="{ 'chat-panel__send-btn--active': hasContent && !sending }"
          :icon="Top"
          circle
          :disabled="!hasContent || sending"
          @click="handleSend"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chat-panel__welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.chat-panel__welcome-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 500;
  color: var(--sanko-text-secondary);
}

.chat-panel__welcome-desc {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-panel__message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
}

.chat-panel__message--assistant {
  align-self: flex-start;
  background: #ebe4d8;
  color: var(--sanko-text);
}

.chat-panel__message--user {
  align-self: flex-end;
  background: #fff;
  border: 1px solid var(--sanko-border);
  color: var(--sanko-text);
}

.chat-panel__input-area {
  flex-shrink: 0;
  border: 1px solid var(--sanko-border);
  border-radius: 16px;
  padding: 16px;
  background: var(--sanko-bg);
}

.chat-panel__textarea :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 15px;
}

.chat-panel__input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.chat-panel__input-actions {
  display: flex;
  gap: 4px;
}

.chat-panel__input-actions .el-button {
  color: #999;
}

.chat-panel__send-btn {
  --el-button-bg-color: #ccc;
  --el-button-border-color: #ccc;
  color: #fff;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.chat-panel__send-btn--active {
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
  --el-button-hover-bg-color: var(--sanko-green-hover);
  --el-button-hover-border-color: var(--sanko-green-hover);
}
</style>
