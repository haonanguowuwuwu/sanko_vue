<script setup lang="ts">
import { ref } from 'vue'
import { Close, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import IconTooltip from '@/components/IconTooltip.vue'
import { createBackup, restoreBackup } from '@/api/backup'
import { reloadAfterRestore } from '@/bootstrap'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const backupTarget = ref('本地')
const restoreSource = ref('本地')
const loading = ref(false)
const restoreFileInput = ref<HTMLInputElement | null>(null)

const targetOptions = ['本地']

const handleClose = () => {
  emit('update:visible', false)
}

const handleBackup = async () => {
  loading.value = true
  try {
    const result = await createBackup()
    ElMessage.success(result.message || `已开始备份到${backupTarget.value}`)
    handleClose()
  } catch (error) {
    const message = error instanceof Error ? error.message : '备份失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

const handleRestoreClick = () => {
  restoreFileInput.value?.click()
}

const onRestoreFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  loading.value = true
  try {
    const result = await restoreBackup(file)
    await reloadAfterRestore()
    ElMessage.success(result.message || `已从${restoreSource.value}恢复`)
    handleClose()
  } catch (error) {
    const message = error instanceof Error ? error.message : '恢复失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="560px"
    :show-close="false"
    append-to-body
    align-center
    class="app-backup-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="backup-dialog__header">
      <IconTooltip content="关闭">
        <el-button :icon="Close" text class="backup-dialog__close" @click="handleClose" />
      </IconTooltip>
    </div>

    <div class="backup-dialog__body">
      <button type="button" class="backup-card" :disabled="loading" @click="handleBackup">
        <div class="backup-card__icon">
          <svg viewBox="0 0 72 56" aria-hidden="true">
            <path
              d="M54 42H18c-7.7 0-14-6.3-14-14 0-6.4 4.3-11.8 10.2-13.5C16.8 7.2 22.8 2 30 2c4.2 0 8 2 10.4 5.1C43.1 3.4 47.4 1 52 1c8.3 0 15 6.7 15 15 0 1-.1 2-.3 3 5.2 2.2 8.8 7.4 8.8 13.4 0 8-6.5 14.5-14.5 14.5H54z"
              fill="currentColor"
            />
            <path
              d="M36 16v16M36 16l-6 6M36 16l6 6"
              fill="none"
              stroke="#fff"
              stroke-width="2.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="backup-card__label">
          备份到
          <el-dropdown trigger="click" @click.stop>
            <span class="backup-card__target">
              {{ backupTarget }}
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in targetOptions"
                  :key="option"
                  @click="backupTarget = option"
                >
                  {{ option }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </button>

      <button type="button" class="backup-card" :disabled="loading" @click="handleRestoreClick">
        <div class="backup-card__icon">
          <svg viewBox="0 0 72 56" aria-hidden="true">
            <path
              d="M54 42H18c-7.7 0-14-6.3-14-14 0-6.4 4.3-11.8 10.2-13.5C16.8 7.2 22.8 2 30 2c4.2 0 8 2 10.4 5.1C43.1 3.4 47.4 1 52 1c8.3 0 15 6.7 15 15 0 1-.1 2-.3 3 5.2 2.2 8.8 7.4 8.8 13.4 0 8-6.5 14.5-14.5 14.5H54z"
              fill="currentColor"
            />
            <path
              d="M36 32V16M36 32l-6-6M36 32l6-6"
              fill="none"
              stroke="#fff"
              stroke-width="2.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="backup-card__label">
          恢复自
          <el-dropdown trigger="click" @click.stop>
            <span class="backup-card__target">
              {{ restoreSource }}
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in targetOptions"
                  :key="option"
                  @click="restoreSource = option"
                >
                  {{ option }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </button>
    </div>

    <input
      ref="restoreFileInput"
      type="file"
      accept="application/json,.json"
      hidden
      @change="onRestoreFileSelected"
    />
  </el-dialog>
</template>

<style scoped>
.backup-dialog__header {
  display: flex;
  justify-content: flex-end;
  padding: 16px 16px 0;
}

.backup-dialog__close {
  font-size: 18px;
  color: var(--sanko-text);
}

.backup-dialog__body {
  display: flex;
  justify-content: center;
  gap: 64px;
  padding: 16px 32px 48px;
}

.backup-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 0.15s;
}

.backup-card:hover:not(:disabled) {
  transform: translateY(-2px);
}

.backup-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.backup-card__icon {
  width: 80px;
  height: 62px;
  color: #4a4a4a;
}

.backup-card__icon svg {
  width: 100%;
  height: 100%;
}

.backup-card__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  color: var(--sanko-text);
}

.backup-card__target {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
  color: var(--sanko-text);
  cursor: pointer;
}
</style>

<style>
.app-backup-dialog .el-dialog {
  background: #fff;
  border-radius: 16px;
}

.app-backup-dialog .el-dialog__header {
  display: none;
}

.app-backup-dialog .el-dialog__body {
  padding: 0;
}
</style>
