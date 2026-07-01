<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'
import type { ChatSession } from '@/types/modules'

const store = useAdminDataStore()

const keyword = ref('')
const searchKeyword = ref('')
const activeTab = ref('sessions')
const sessionVisible = ref(false)
const currentSession = ref<ChatSession | null>(null)

const config = reactive({ ...store.data.chatConfig })

const filteredList = computed(() => store.filterChatSessions(searchKeyword.value))
const { page, total, pagedList, resetPage } = useClientPagination(filteredList)

watch(keyword, () => {
  if (!keyword.value) {
    searchKeyword.value = ''
    resetPage()
  }
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  resetPage()
}

const openSession = (row: ChatSession) => {
  currentSession.value = row
  sessionVisible.value = true
}

const saveConfig = () => {
  store.saveChatConfig({ ...config })
  ElMessage.success('AI 配置已保存')
}
</script>

<template>
  <div class="list-page">
    <PageHeader title="AI 聊天管理" description="查看 AI 会话与功能配置" />

    <el-card shadow="never" class="list-page__card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="会话列表" name="sessions" />
        <el-tab-pane label="功能配置" name="config" />
      </el-tabs>

      <template v-if="activeTab === 'sessions'">
        <div class="list-page__toolbar">
          <el-input
            v-model="keyword"
            placeholder="搜索用户 / 消息"
            clearable
            style="width: 280px"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="pagedList" stripe style="width: 100%">
          <el-table-column prop="id" label="会话 ID" width="100" />
          <el-table-column prop="user" label="用户" width="120" />
          <el-table-column prop="source" label="来源" width="100" />
          <el-table-column prop="messageCount" label="消息数" width="100" />
          <el-table-column prop="lastMessage" label="最后消息" min-width="180" show-overflow-tooltip />
          <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openSession(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="list-page__footer">
          <el-pagination
            v-model:current-page="page"
            background
            layout="total, prev, pager, next"
            :total="total"
          />
        </div>
      </template>

      <div v-else class="config-form">
        <el-form label-width="120px" label-position="left" style="max-width: 520px">
          <el-form-item label="AI 功能开关">
            <el-switch v-model="config.enabled" />
          </el-form-item>
          <el-form-item label="首页聊天">
            <el-switch v-model="config.homeChat" :disabled="!config.enabled" />
          </el-form-item>
          <el-form-item label="阅读器 AI">
            <el-switch v-model="config.readerAi" :disabled="!config.enabled" />
          </el-form-item>
          <el-form-item label="书籍详情 AI">
            <el-switch v-model="config.bookAi" :disabled="!config.enabled" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-dialog v-model="sessionVisible" title="会话详情" width="560px">
      <template v-if="currentSession">
        <p class="session-meta">
          {{ currentSession.user }} · {{ currentSession.source }} · {{ currentSession.updatedAt }}
        </p>
        <div class="session-messages">
          <div
            v-for="(msg, i) in currentSession.messages"
            :key="i"
            class="session-msg"
            :class="`session-msg--${msg.role}`"
          >
            {{ msg.content }}
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.list-page__card {
  border: 1px solid var(--admin-border);
}

.list-page__toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.list-page__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.config-form {
  padding: 8px 0 16px;
}

.session-meta {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--admin-text-secondary);
}

.session-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.session-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.session-msg--user {
  align-self: flex-end;
  background: var(--admin-primary-soft);
  color: var(--admin-text);
}

.session-msg--assistant {
  align-self: flex-start;
  background: #f5f5f5;
  color: var(--admin-text);
}
</style>
