<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Expand, Fold } from '@element-plus/icons-vue'
import { adminMenuItems } from '@/config/menu'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

const collapsed = ref(false)

const activeMenu = computed(() => route.path)

const breadcrumbTitle = computed(() => {
  const matched = adminMenuItems.find((item) => item.path === route.path)
  if (matched) return matched.label
  if (route.name === 'profile') return '个人资料'
  return '管理后台'
})

const avatarInitial = computed(() => {
  const name = auth.profile?.username ?? 'A'
  return name.charAt(0).toUpperCase()
})

const goProfile = () => {
  void router.push({ name: 'profile' })
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出登录？', '退出', { type: 'warning' })
    auth.logout()
    ElMessage.success('已退出登录')
    void router.push({ name: 'login' })
  } catch {
    // cancelled
  }
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="admin-aside">
      <div class="admin-brand">
        <span class="admin-brand__logo">S</span>
        <span v-show="!collapsed" class="admin-brand__text">Sanko Admin</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="var(--admin-sidebar-bg)"
        text-color="var(--admin-sidebar-text)"
        active-text-color="#ffffff"
        router
        class="admin-menu"
      >
        <el-menu-item v-for="item in adminMenuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="admin-main-wrap">
      <el-header class="admin-header">
        <div class="admin-header__left">
          <el-button text @click="collapsed = !collapsed">
            <el-icon :size="18">
              <Fold v-if="!collapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ breadcrumbTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <el-dropdown trigger="click">
          <button type="button" class="admin-user-trigger">
            <span class="admin-user-avatar">{{ avatarInitial }}</span>
            <span class="admin-user-name">{{ auth.profile?.username ?? '管理员' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goProfile">个人资料</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-aside {
  background: var(--admin-sidebar-bg);
  transition: width 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-brand__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--admin-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.admin-brand__text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.admin-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.admin-menu:not(.el-menu--collapse) {
  width: 220px;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: var(--admin-sidebar-active) !important;
}

.admin-main-wrap {
  min-width: 0;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--admin-header-bg);
  border-bottom: 1px solid var(--admin-border);
}

.admin-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.admin-user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}

.admin-user-trigger:hover {
  background: var(--admin-primary-soft);
}

.admin-user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  font-size: 14px;
  font-weight: 700;
}

.admin-user-name {
  font-size: 14px;
  color: var(--admin-text);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-main {
  padding: 20px 24px;
  background: var(--admin-bg);
  overflow-y: auto;
}
</style>
