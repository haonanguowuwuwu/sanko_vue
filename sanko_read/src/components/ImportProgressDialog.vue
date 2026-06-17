<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  'update:visible': [value: boolean]
}>()
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="360px"
    :show-close="false"
    align-center
    class="import-dialog"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="import-dialog__body">
      <div class="import-dialog__banner" />
      <p class="import-dialog__text">导入书籍中......</p>
      <el-icon class="import-dialog__check" :size="18"><Check /></el-icon>
    </div>
  </el-dialog>
</template>

<style scoped>
.import-dialog__body {
  position: relative;
  min-height: 120px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}

.import-dialog__banner {
  height: 36px;
  background: #d0d0d0;
}

.import-dialog__text {
  margin: 28px 0 0;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sanko-text);
}

.import-dialog__check {
  position: absolute;
  right: 12px;
  bottom: 10px;
  color: var(--sanko-text);
}
</style>

<style>
.import-dialog .el-dialog {
  background: transparent;
  box-shadow: none;
}

.import-dialog .el-dialog__header {
  display: none;
}

.import-dialog .el-dialog__body {
  padding: 0;
}
</style>
