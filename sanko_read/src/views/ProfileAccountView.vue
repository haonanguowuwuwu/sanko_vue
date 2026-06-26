<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAccountProfile } from '@/api/profile'
import type { AccountProfile } from '@/types/profile'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const profile = ref<AccountProfile | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    profile.value = await fetchAccountProfile()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
})

const goPoints = () => {
  void router.push({ name: 'profile-points' })
}

const goHistory = () => {
  void router.push({ name: 'reading-history' })
}
</script>

<template>
  <div class="profile-account">
    <header class="profile-account__header">
      <h1 class="profile-account__title">账号信息</h1>
      <p class="profile-account__subtitle">查看你的账号资料与快捷入口</p>
    </header>

    <p v-if="loading" class="profile-account__loading">加载中…</p>

    <template v-else-if="profile">
      <section class="profile-account__card">
        <div class="profile-account__avatar" aria-hidden="true" />
        <div class="profile-account__info">
          <h2 class="profile-account__name">{{ profile.username }}</h2>
          <p class="profile-account__meta">用户 ID：{{ profile.id }}</p>
          <p class="profile-account__meta">邮箱：{{ profile.email }}</p>
          <p class="profile-account__meta">注册时间：{{ profile.registeredAt }}</p>
        </div>
      </section>

      <section class="profile-account__stats">
        <div class="profile-account__stat">
          <span class="profile-account__stat-label">当前积分</span>
          <span class="profile-account__stat-value">{{ profile.pointsBalance.toLocaleString() }}</span>
        </div>
        <div class="profile-account__stat">
          <span class="profile-account__stat-label">登录状态</span>
          <span class="profile-account__stat-value profile-account__stat-value--ok">已登录</span>
        </div>
      </section>

      <section class="profile-account__actions">
        <button type="button" class="profile-account__btn" @click="goPoints">我的积分</button>
        <button type="button" class="profile-account__btn profile-account__btn--outline" @click="goHistory">
          阅读历史
        </button>
      </section>
    </template>

    <p v-else class="profile-account__loading">暂无账号信息</p>
  </div>
</template>

<style scoped>
.profile-account {
  max-width: 640px;
  margin: 0 auto;
}

.profile-account__header {
  margin-bottom: 24px;
}

.profile-account__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--sanko-text);
}

.profile-account__subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.profile-account__loading {
  color: var(--sanko-text-secondary);
  font-size: 14px;
}

.profile-account__card {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.profile-account__avatar {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #c8c8c8;
}

.profile-account__info {
  min-width: 0;
}

.profile-account__name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-text);
}

.profile-account__meta {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.profile-account__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.profile-account__stat {
  padding: 16px 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.profile-account__stat-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

.profile-account__stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--sanko-green);
}

.profile-account__stat-value--ok {
  font-size: 16px;
}

.profile-account__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-account__btn {
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.profile-account__btn--outline {
  background: #fff;
  border: 1px solid var(--sanko-green);
  color: var(--sanko-green);
}
</style>
