<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { USE_MOCK } from '@/api/config'
import {
  Search,
  Setting,
  HomeFilled,
  Grid,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import HamburgerMenuIcon from '@/components/HamburgerMenuIcon.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import ManageBookshelfDialog from '@/components/ManageBookshelfDialog.vue'
import IconTooltip from '@/components/IconTooltip.vue'
import BookSortDropdown from '@/components/BookSortDropdown.vue'
import AppSettingsDialog from '@/components/AppSettingsDialog.vue'
import AddBookDialog from '@/components/AddBookDialog.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import SankoLogo from '@/components/SankoLogo.vue'
import { clearUserPersonalData, loadUserPersonalData } from '@/bootstrap'
import { useUserStore } from '@/stores/user'
import { useProfileStore } from '@/stores/profile'
import { useBooksStore } from '@/stores/books'
import { useBookshelvesStore } from '@/stores/bookshelves'
import { useSettingsStore } from '@/stores/settings'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const profileStore = useProfileStore()
const booksStore = useBooksStore()
const bookshelvesStore = useBookshelvesStore()
const settingsStore = useSettingsStore()
const { shelves } = storeToRefs(bookshelvesStore)
const { showBookshelfBookCount, enableSoftwareProtection } = storeToRefs(settingsStore)

const searchKeyword = ref('')
const isCollapsed = ref(false)
const bookshelfExpanded = ref(true)
const showLoginDialog = ref(false)
const showManageBookshelfDialog = ref(false)
const showSettingsDialog = ref(false)
const showAddBookDialog = ref(false)
const showAnnouncementDialog = ref(false)
const pendingAddBook = ref(false)
const pendingRedirect = ref<string | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const menuItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/categories', label: '分类', icon: Grid },
  { path: '/favorites', label: '喜欢', icon: HeartIcon },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isShelfActive = (shelfId: string) => route.name === 'shelf' && route.params.shelfId === shelfId

const isLocalLibraryActive = computed(() => route.name === 'library')

const isHomeRoute = computed(() => route.name === 'home' || route.name === 'book-intro')
const isCategoriesRoute = computed(() => route.name === 'categories')
const isProfileRoute = computed(
  () => route.name === 'profile-points' || route.name === 'profile-account',
)
const isReadingHistoryRoute = computed(() => route.name === 'reading-history')

const openManageBookshelf = () => {
  showManageBookshelfDialog.value = true
}

const openLoginDialog = () => {
  showLoginDialog.value = true
}

const handleAddBook = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再添加书籍')
    pendingAddBook.value = true
    showLoginDialog.value = true
    return
  }
  showAddBookDialog.value = true
}

const handleLoginSuccess = () => {
  ElMessage.success(`欢迎回来，${userStore.username}`)
  void loadUserPersonalData().then(() => profileStore.loadPoints())
  showAnnouncementDialog.value = true
  if (pendingAddBook.value) {
    pendingAddBook.value = false
    showAddBookDialog.value = true
    return
  }
  if (pendingRedirect.value) {
    const target = pendingRedirect.value
    pendingRedirect.value = null
    void router.push(target)
  }
}

const goProfilePoints = () => {
  void router.push({ name: 'profile-points' })
}

const goProfileAccount = () => {
  void router.push({ name: 'profile-account' })
}

const goReadingHistory = () => {
  void router.push({ name: 'reading-history' })
}

const handleLogout = async () => {
  await userStore.logout()
  clearUserPersonalData()
  profileStore.clear()
  ElMessage.info('已退出登录')
  if (enableSoftwareProtection.value) {
    showLoginDialog.value = true
  }
}

watch(searchKeyword, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (USE_MOCK) {
      booksStore.searchQuery = value
    } else {
      void booksStore.searchRemote(value)
    }
  }, 300)
})

watch(showLoginDialog, (open) => {
  if (!open && !userStore.isLoggedIn) {
    pendingAddBook.value = false
    pendingRedirect.value = null
    if (enableSoftwareProtection.value) {
      showLoginDialog.value = true
    }
  }
})

watch(
  () => route.query,
  (query) => {
    if (query.login === '1' && !userStore.isLoggedIn) {
      if (typeof query.redirect === 'string') {
        pendingRedirect.value = query.redirect
        ElMessage.warning('请先登录后再访问')
      }
      showLoginDialog.value = true
      const { login: _, redirect: __, ...rest } = query
      void router.replace({ query: rest })
    }
  },
  { immediate: true },
)

watch(enableSoftwareProtection, (enabled) => {
  if (enabled) {
    void userStore.logout().then(() => {
      clearUserPersonalData()
      showLoginDialog.value = true
      ElMessage.info('已启用软件保护，请登录后继续使用')
    })
  }
})

onMounted(() => {
  if (enableSoftwareProtection.value && !userStore.isLoggedIn) {
    showLoginDialog.value = true
  }
  if (userStore.isLoggedIn) {
    void profileStore.loadPoints()
  }
})
</script>

<template>
  <el-container
    class="main-layout"
    :style="{
      '--sidebar-current-width': isCollapsed ? '52px' : 'var(--sanko-sidebar-width)',
    }"
  >
    <el-header class="main-header">
      <div class="header-left">
        <IconTooltip content="菜单">
          <el-button class="menu-toggle" text @click="isCollapsed = !isCollapsed">
            <HamburgerMenuIcon :size="22" />
          </el-button>
        </IconTooltip>
        <div class="logo">
          <SankoLogo :size="30" />
          <span class="logo-text">sanko</span>
        </div>
      </div>

      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索书籍"
          class="search-input"
          :suffix-icon="Search"
          clearable
        />
      </div>

      <div class="header-right">
        <BookSortDropdown />
        <IconTooltip content="设置">
          <el-button
            class="header-icon-btn"
            :icon="Setting"
            text
            @click="showSettingsDialog = true"
          />
        </IconTooltip>
        <el-button v-if="!userStore.isLoggedIn" class="login-btn" text @click="openLoginDialog">
          登录
        </el-button>
        <button
          v-if="userStore.isLoggedIn"
          type="button"
          class="header-points"
          @click="goProfilePoints"
        >
          积分 {{ profileStore.pointsBalance.toLocaleString() }}
        </button>
        <el-dropdown v-if="userStore.isLoggedIn" trigger="click" popper-class="user-dropdown-popper">
          <button type="button" class="user-profile-trigger">
            <span class="user-avatar" aria-hidden="true" />
            <span class="user-name">{{ userStore.username }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goProfileAccount">账号信息</el-dropdown-item>
              <el-dropdown-item @click="goProfilePoints">我的积分</el-dropdown-item>
              <el-dropdown-item @click="goReadingHistory">阅读历史</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button class="import-btn" type="primary" round @click="handleAddBook">
          添加书籍
        </el-button>
      </div>
    </el-header>

    <el-container class="main-body">
      <el-aside
        :width="isCollapsed ? '52px' : 'var(--sanko-sidebar-width)'"
        class="main-aside"
      >
        <nav class="sidebar-nav" :class="{ 'is-collapsed': isCollapsed }">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon :size="18"><component :is="item.icon" :size="18" /></el-icon>
            <span v-show="!isCollapsed" class="nav-label">{{ item.label }}</span>
          </router-link>

          <div v-show="!isCollapsed" class="bookshelf-section">
            <button type="button" class="bookshelf-header" @click="bookshelfExpanded = !bookshelfExpanded">
              <span>我的书架</span>
              <el-icon :size="14">
                <ArrowUp v-if="bookshelfExpanded" />
                <ArrowDown v-else />
              </el-icon>
            </button>

            <template v-if="bookshelfExpanded">
              <router-link
                to="/library"
                class="bookshelf-local"
                :class="{ 'is-active': isLocalLibraryActive }"
              >
                本地书架
              </router-link>
              <button type="button" class="bookshelf-link" @click="openManageBookshelf">
                管理书架
              </button>
              <router-link
                v-for="shelf in shelves"
                :key="shelf.id"
                :to="{ name: 'shelf', params: { shelfId: shelf.id } }"
                class="shelf-item"
                :class="{ 'is-active': isShelfActive(shelf.id) }"
              >
                {{ shelf.name
                }}<span v-if="showBookshelfBookCount" class="shelf-item__count">{{
                  shelf.bookIds.length
                }}</span>
              </router-link>
            </template>
          </div>
        </nav>
      </el-aside>

      <el-main
        class="main-content"
        :class="{
          'main-content--home': isHomeRoute,
          'main-content--categories': isCategoriesRoute,
          'main-content--profile': isProfileRoute,
          'main-content--reading-history': isReadingHistoryRoute,
        }"
      >
        <div
          class="main-content__inner"
          :class="{ 'main-content__inner--fixed-toolbar': isReadingHistoryRoute }"
        >
          <router-view />
        </div>
      </el-main>
    </el-container>

    <LoginDialog
      v-model:visible="showLoginDialog"
      :required="enableSoftwareProtection"
      @success="handleLoginSuccess"
    />
    <ManageBookshelfDialog v-model:visible="showManageBookshelfDialog" />
    <AppSettingsDialog v-model:visible="showSettingsDialog" />
    <AddBookDialog v-model:visible="showAddBookDialog" />
    <AnnouncementDialog v-model:visible="showAnnouncementDialog" />
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  flex-direction: column;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--sanko-header-height);
  padding: 0 24px;
  border-bottom: 1px solid var(--sanko-border);
  background: var(--sanko-bg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.menu-toggle {
  padding: 8px;
  font-size: 20px;
  color: var(--sanko-green);
}

.menu-toggle :deep(svg) {
  display: block;
  color: var(--sanko-green);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--sanko-green);
  letter-spacing: -0.5px;
}

.header-center {
  flex: 1;
  max-width: 480px;
  margin: 0 32px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  background: var(--sanko-search-bg);
  box-shadow: none;
  border: 1px solid transparent;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
  border-color: var(--sanko-border);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.header-icon-btn {
  font-size: 18px;
  color: var(--sanko-green);
}

.login-btn {
  color: var(--sanko-text);
  font-size: 14px;
  margin-left: 4px;
}

.header-points {
  margin-left: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: rgba(232, 163, 23, 0.12);
  color: #c8870a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.header-points:hover {
  background: rgba(232, 163, 23, 0.2);
}

.user-btn {
  color: var(--sanko-green);
  font-weight: 500;
}

.user-profile-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  padding: 2px 8px;
  border: none;
  background: none;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #c8c8c8;
}

.user-name {
  font-size: 12px;
  color: #1a8a8f;
  font-weight: 500;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-btn {
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
  --el-button-hover-bg-color: var(--sanko-green-hover);
  --el-button-hover-border-color: var(--sanko-green-hover);
  --el-button-active-bg-color: var(--sanko-green-hover);
  --el-button-active-border-color: var(--sanko-green-hover);
  margin-left: 8px;
  padding: 0 20px;
}

.main-body {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.main-body :deep(.el-main.main-content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.main-aside {
  border-right: 1px solid var(--sanko-border);
  background: var(--sanko-bg);
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  gap: 1px;
}

.sidebar-nav.is-collapsed .nav-item {
  justify-content: center;
  gap: 0;
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-radius: 999px;
  color: var(--sanko-green);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  transition:
    background 0.15s,
    color 0.15s;
}

.nav-item:hover {
  background: rgba(0, 90, 43, 0.06);
}

.nav-item.is-active {
  background: var(--sanko-green);
  color: #fff;
}

.nav-label {
  white-space: nowrap;
}

.bookshelf-section {
  margin-top: 14px;
  padding: 0 4px;
}

.bookshelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 8px;
  margin-bottom: 2px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.bookshelf-local {
  display: block;
  width: 100%;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: #1a8a8f;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.bookshelf-local:hover {
  background: rgba(26, 138, 143, 0.08);
}

.bookshelf-local.is-active {
  background: #1a8a8f;
  color: #fff;
}

.bookshelf-link {
  display: block;
  width: 100%;
  padding: 5px 12px;
  margin-top: 1px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  line-height: 1.3;
  color: var(--sanko-green);
  cursor: pointer;
}

.bookshelf-link:hover {
  color: var(--sanko-green);
}

.shelf-item {
  display: block;
  padding: 6px 12px;
  margin-top: 1px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--sanko-green);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.shelf-item:hover {
  background: rgba(0, 90, 43, 0.06);
}

.shelf-item.is-active {
  background: var(--sanko-green);
  color: #fff;
}

.shelf-item__count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.75;
}

.main-content {
  padding: 32px 40px;
  overflow: hidden;
  background: var(--sanko-bg);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-content--home {
  padding: 20px 32px;
}

.main-content--categories {
  padding: 20px 32px;
}

.main-content--profile {
  padding: 24px 40px;
  background: #f5f5f5;
}

.main-content--reading-history {
  padding: 32px 40px;
  background: var(--sanko-bg);
}

.main-content__inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

.main-content__inner--fixed-toolbar {
  overflow: hidden;
}
</style>

<style>
.user-dropdown-popper .el-dropdown-menu {
  background: #f5f0e8;
  border: 1px solid #d9d0c0;
  padding: 6px 0;
}

.user-dropdown-popper .el-dropdown-menu__item {
  color: var(--sanko-green);
  font-size: 14px;
  font-weight: 500;
}

.user-dropdown-popper .el-dropdown-menu__item:hover {
  background: rgba(0, 90, 43, 0.08);
  color: var(--sanko-green);
}
</style>
