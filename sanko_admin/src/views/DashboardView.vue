<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminDataStore } from '@/stores/adminData'

const router = useRouter()
const store = useAdminDataStore()

const stats = computed(() => store.dashboardStats)

const recentAuditLogs = computed(() => store.data.auditLogs.slice(0, 5))

const goBooksPending = () => {
  void router.push({ path: '/books', query: { tab: 'pending' } })
}
</script>

<template>
  <div class="dashboard-page">
    <PageHeader title="概览" description="系统数据总览" />

    <el-row :gutter="16" class="dashboard-page__stats">
      <el-col v-for="stat in stats" :key="stat.label" :xs="24" :sm="12" :lg="6">
        <el-card shadow="never" class="stat-card">
          <p class="stat-card__label">{{ stat.label }}</p>
          <p class="stat-card__value">{{ stat.value }}</p>
          <p class="stat-card__sub">{{ stat.sub }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="panel-card">
          <template #header>快捷入口</template>
          <div class="quick-links">
            <router-link to="/users" class="quick-link">用户管理</router-link>
            <router-link to="/books" class="quick-link">书籍管理</router-link>
            <router-link to="/comments" class="quick-link">评论管理</router-link>
            <router-link to="/points" class="quick-link">积分管理</router-link>
            <router-link to="/history" class="quick-link">历史记录</router-link>
            <router-link to="/chat" class="quick-link">AI 聊天</router-link>
            <router-link to="/settings" class="quick-link">系统设置</router-link>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="panel-card__header">
              <span>最近操作</span>
              <el-button
                v-if="store.pendingBookCount > 0"
                link
                type="primary"
                @click="goBooksPending"
              >
                {{ store.pendingBookCount }} 本待审核 →
              </el-button>
            </div>
          </template>
          <ul class="audit-list">
            <li v-for="log in recentAuditLogs" :key="log.id" class="audit-list__item">
              <span class="audit-list__action">{{ log.action }}</span>
              <span class="audit-list__target">{{ log.target }}</span>
              <span class="audit-list__time">{{ log.time }}</span>
            </li>
          </ul>
          <el-empty v-if="recentAuditLogs.length === 0" description="暂无操作记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-page__stats {
  margin-bottom: 16px;
}

.stat-card {
  border: 1px solid var(--admin-border);
  margin-bottom: 16px;
}

.stat-card__label {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--admin-text-secondary);
}

.stat-card__value {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 700;
  color: var(--admin-primary);
}

.stat-card__sub {
  margin: 0;
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.panel-card {
  border: 1px solid var(--admin-border);
  margin-bottom: 16px;
}

.panel-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-link {
  display: block;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s;
}

.quick-link:hover {
  background: rgba(0, 90, 43, 0.14);
}

.audit-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.audit-list__item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--admin-border);
  font-size: 13px;
}

.audit-list__item:last-child {
  border-bottom: none;
}

.audit-list__action {
  color: var(--admin-primary);
  font-weight: 500;
}

.audit-list__target {
  color: var(--admin-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-list__time {
  color: var(--admin-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}
</style>
