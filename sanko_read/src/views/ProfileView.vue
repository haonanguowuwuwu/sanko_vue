<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAccountProfile } from '@/api/profile'
import type { AccountProfile } from '@/types/profile'
import { useProfileStore } from '@/stores/profile'
import ProfilePointsSection from '@/components/profile/ProfilePointsSection.vue'

const router = useRouter()
const profileStore = useProfileStore()

const loading = ref(true)
const profile = ref<AccountProfile | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    profile.value = await fetchAccountProfile()
    await profileStore.loadPoints()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
})

const goReadingHistory = () => {
  void router.push({ name: 'reading-history' })
}
</script>

<template>
  <div class="profile-view">
    <header class="profile-view__header">
      <h1 class="profile-view__title">账号信息</h1>
      <p class="profile-view__subtitle">查看你的账号资料与快捷入口</p>
    </header>

    <p v-if="loading" class="profile-view__loading">加载中…</p>

    <template v-else-if="profile">
      <section class="profile-view__summary">
        <div class="profile-view__card profile-view__card--profile">
          <div class="profile-view__avatar" aria-hidden="true" />
          <div class="profile-view__info">
            <h2 class="profile-view__name">{{ profile.username }}</h2>
            <p class="profile-view__meta">用户 ID：{{ profile.id }}</p>
            <p class="profile-view__meta">邮箱：{{ profile.email }}</p>
            <p class="profile-view__meta">注册时间：{{ profile.registeredAt }}</p>
          </div>
        </div>

        <div class="profile-view__card profile-view__card--stat">
          <span class="profile-view__stat-label">当前积分</span>
          <span class="profile-view__stat-value">{{ profileStore.pointsBalance.toLocaleString() }}</span>
        </div>

        <div class="profile-view__card profile-view__card--stat">
          <span class="profile-view__stat-label">登录状态</span>
          <span class="profile-view__stat-value profile-view__stat-value--ok">已登录</span>
        </div>
      </section>

      <section class="profile-view__points">
        <ProfilePointsSection />
      </section>

      <button type="button" class="profile-view__history-btn" @click="goReadingHistory">
        阅读历史
      </button>
    </template>

    <p v-else class="profile-view__loading">暂无账号信息</p>
  </div>
</template>

<style scoped>
.profile-view {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 32px;
}

.profile-view__header {
  margin-bottom: 20px;
}

.profile-view__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--sanko-text);
}

.profile-view__subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.profile-view__loading {
  color: var(--sanko-text-secondary);
  font-size: 14px;
}

.profile-view__summary {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-view__card {
  padding: 20px 24px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--sanko-border);
}

.profile-view__card--profile {
  display: flex;
  gap: 16px;
  align-items: center;
}

.profile-view__avatar {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #c8c8c8;
}

.profile-view__info {
  min-width: 0;
}

.profile-view__name {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--sanko-text);
}

.profile-view__meta {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.profile-view__card--stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.profile-view__stat-label {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.profile-view__stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--sanko-green);
  line-height: 1.2;
}

.profile-view__stat-value--ok {
  font-size: 18px;
  font-weight: 600;
}

.profile-view__points {
  margin-bottom: 24px;
}

.profile-view__history-btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--sanko-green);
  border-radius: 999px;
  background: #fff;
  color: var(--sanko-green);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.profile-view__history-btn:hover {
  background: rgba(0, 90, 43, 0.06);
}

@media (max-width: 768px) {
  .profile-view__summary {
    grid-template-columns: 1fr;
  }
}
</style>
