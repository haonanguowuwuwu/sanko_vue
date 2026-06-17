<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { USE_MOCK } from '@/api/config'
import {
  Search,
  Setting,
  Folder,
  HomeFilled,
  EditPen,
  Collection,
  Delete,
  ChatDotRound,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'
import HeartIcon from '@/components/HeartIcon.vue'
import HamburgerMenuIcon from '@/components/HamburgerMenuIcon.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import ImportProgressDialog from '@/components/ImportProgressDialog.vue'
import ManageBookshelfDialog from '@/components/ManageBookshelfDialog.vue'
import IconTooltip from '@/components/IconTooltip.vue'
import BookSortDropdown from '@/components/BookSortDropdown.vue'
import AppSettingsDialog from '@/components/AppSettingsDialog.vue'
import AppBackupDialog from '@/components/AppBackupDialog.vue'
import SankoLogo from '@/components/SankoLogo.vue'
import { useUserStore } from '@/stores/user'
import { useBooksStore } from '@/stores/books'
import { useBookshelvesStore } from '@/stores/bookshelves'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const userStore = useUserStore()
const booksStore = useBooksStore()
const bookshelvesStore = useBookshelvesStore()
const settingsStore = useSettingsStore()
const { shelves } = storeToRefs(bookshelvesStore)
const { showBookshelfBookCount, enableSoftwareProtection } = storeToRefs(settingsStore)

const searchKeyword = ref('')
const isCollapsed = ref(false)
const bookshelfExpanded = ref(true)
const showLoginDialog = ref(false)
const showImportDialog = ref(false)
const showManageBookshelfDialog = ref(false)
const showSettingsDialog = ref(false)
const showBackupDialog = ref(false)
const pendingImport = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const menuItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/favorites', label: '喜欢', icon: HeartIcon },
  { path: '/notes', label: '笔记', icon: EditPen },
  { path: '/highlights', label: '高亮', icon: Collection },
  { path: '/recycle-bin', label: '回收站', icon: Delete },
  { path: '/chat', label: '聊天', icon: ChatDotRound },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const isShelfActive = (shelfId: string) => route.name === 'shelf' && route.params.shelfId === shelfId

const openManageBookshelf = () => {
  showManageBookshelfDialog.value = true
}

const openLoginDialog = () => {
  showLoginDialog.value = true
}

const startImport = async (file?: File) => {
  showImportDialog.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, file ? 800 : 2000))
    const book = await booksStore.importBook(file)
    ElMessage.success(`已导入 ${book.title}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入失败'
    ElMessage.error(message)
  } finally {
    showImportDialog.value = false
  }
}

const handleImportBooks = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再导入书籍')
    pendingImport.value = true
    showLoginDialog.value = true
    return
  }
  if (USE_MOCK) {
    void startImport()
    return
  }
  importFileInput.value?.click()
}

const onImportFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  void startImport(file)
}

const handleLoginSuccess = () => {
  ElMessage.success(`欢迎回来，${userStore.username}`)
  if (pendingImport.value) {
    pendingImport.value = false
    handleImportBooks()
  }
}

const handleLogout = async () => {
  await userStore.logout()
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
    pendingImport.value = false
    if (enableSoftwareProtection.value) {
      showLoginDialog.value = true
    }
  }
})

watch(enableSoftwareProtection, (enabled) => {
  if (enabled) {
    userStore.logout()
    showLoginDialog.value = true
    ElMessage.info('已启用软件保护，请登录后继续使用')
  }
})

onMounted(() => {
  if (enableSoftwareProtection.value && !userStore.isLoggedIn) {
    showLoginDialog.value = true
  }
})
</script>

<template>
  <el-container
    class="main-layout"
    :style="{ '--sidebar-current-width': isCollapsed ? '72px' : '220px' }"
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
        <IconTooltip content="备份">
          <el-button
            class="header-icon-btn"
            :icon="Folder"
            text
            @click="showBackupDialog = true"
          />
        </IconTooltip>
        <el-button v-if="!userStore.isLoggedIn" class="login-btn" text @click="openLoginDialog">
          登录
        </el-button>
        <el-dropdown v-else trigger="click">
          <el-button class="login-btn user-btn" text>
            {{ userStore.username }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button class="import-btn" type="primary" round @click="handleImportBooks">
          导入书籍
        </el-button>
      </div>
    </el-header>

    <el-container class="main-body">
      <el-aside :width="isCollapsed ? '72px' : '220px'" class="main-aside">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <el-icon :size="22"><component :is="item.icon" :size="22" /></el-icon>
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
              <button type="button" class="bookshelf-link" @click="openManageBookshelf">管理书架</button>
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

      <el-main class="main-content">
        <div class="main-content__inner">
          <router-view />
        </div>
      </el-main>
    </el-container>

    <LoginDialog
      v-model:visible="showLoginDialog"
      :required="enableSoftwareProtection"
      @success="handleLoginSuccess"
    />
    <ImportProgressDialog v-model:visible="showImportDialog" />
    <input
      ref="importFileInput"
      type="file"
      accept=".pdf,.epub,.txt,.mobi"
      hidden
      @change="onImportFileSelected"
    />
    <ManageBookshelfDialog v-model:visible="showManageBookshelfDialog" />
    <AppSettingsDialog v-model:visible="showSettingsDialog" />
    <AppBackupDialog v-model:visible="showBackupDialog" />
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

.user-btn {
  color: var(--sanko-green);
  font-weight: 500;
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

.main-body :deep(.main-content) {
  flex: 1;
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
  padding: 16px 12px;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-radius: 999px;
  color: var(--sanko-green);
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
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
  margin-top: 28px;
  padding: 0 18px;
}

.bookshelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  margin-bottom: 8px;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--sanko-text-secondary);
  cursor: pointer;
}

.bookshelf-link {
  display: block;
  width: 100%;
  padding: 8px 0;
  border: none;
  background: none;
  text-align: left;
  font-size: 16px;
  color: var(--sanko-text);
  cursor: pointer;
}

.bookshelf-link:hover {
  color: var(--sanko-green);
}

.shelf-item {
  display: block;
  padding: 10px 16px;
  margin-top: 4px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
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
  margin-left: 6px;
  font-size: 13px;
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

.main-content__inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
