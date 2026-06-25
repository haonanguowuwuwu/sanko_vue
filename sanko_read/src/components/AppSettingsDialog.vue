<script setup lang="ts">
import { Close, Setting, Brush } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const settingsStore = useSettingsStore()

const {
  hideBookshelfBooks,
  noPdfCoverAsBookCover,
  noCropBookCovers,
  showBookshelfBookCount,
  enableSoftwareProtection,
} = storeToRefs(settingsStore)

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="560px"
    :show-close="false"
    append-to-body
    align-center
    class="app-settings-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="settings-page">
      <div class="settings-page__header">
        <h2 class="settings-page__title">设置</h2>
        <el-button :icon="Close" text class="settings-page__close" @click="handleClose" />
      </div>

      <div class="settings-page__body">
        <section class="settings-group">
          <h3 class="settings-group__heading">
            <el-icon :size="18"><Setting /></el-icon>
            通用
          </h3>
          <div class="settings-list">
            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">隐藏添加到书架的图书</div>
                <div class="settings-row__desc">当把图书添加到书架后，该图书就不会展示在主页书架中</div>
              </div>
              <el-switch v-model="hideBookshelfBooks" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">启用软件保护</div>
                <div class="settings-row__desc">启用后，应用程序每次启动都需要身份验证</div>
              </div>
              <el-switch v-model="enableSoftwareProtection" />
            </div>
          </div>
        </section>

        <section class="settings-group">
          <h3 class="settings-group__heading">
            <el-icon :size="18"><Brush /></el-icon>
            外观
          </h3>
          <div class="settings-list">
            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">不使用 PDF 首页作为封面</div>
              </div>
              <el-switch v-model="noPdfCoverAsBookCover" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">不裁切图书封面</div>
              </div>
              <el-switch v-model="noCropBookCovers" />
            </div>

            <div class="settings-row">
              <div class="settings-row__text">
                <div class="settings-row__title">显示每个书架的图书数量</div>
              </div>
              <el-switch v-model="showBookshelfBookCount" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.settings-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}

.settings-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-text);
}

.settings-page__close {
  font-size: 18px;
  color: var(--sanko-text);
}

.settings-page__body {
  padding: 20px 28px 28px;
  max-height: 70vh;
  overflow-y: auto;
}

.settings-group + .settings-group {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid var(--sanko-border);
}

.settings-group__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--sanko-text);
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.settings-row__text {
  flex: 1;
  min-width: 0;
}

.settings-row__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-text);
}

.settings-row__desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--sanko-text-secondary);
  margin-top: 6px;
}

.settings-row :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--sanko-green);
  border-color: var(--sanko-green);
}
</style>

<style>
.app-settings-dialog .el-dialog {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}

.app-settings-dialog .el-dialog__header {
  display: none;
}

.app-settings-dialog .el-dialog__body {
  padding: 0;
}
</style>
