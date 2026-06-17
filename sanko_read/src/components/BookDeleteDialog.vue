<script setup lang="ts">
defineProps<{
  visible: boolean
  appendToBody?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
}>()

const handleClose = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="400px"
    :show-close="false"
    :append-to-body="appendToBody ?? true"
    align-center
    class="delete-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <p class="delete-dialog__question">确定要删除吗？</p>
    <p class="delete-dialog__warning">注意删除后无法恢复！</p>

    <div class="delete-dialog__actions">
      <button type="button" class="delete-dialog__btn delete-dialog__btn--cancel" @click="handleClose">
        取消
      </button>
      <button type="button" class="delete-dialog__btn delete-dialog__btn--confirm" @click="handleConfirm">
        确定
      </button>
    </div>
  </el-dialog>
</template>

<style scoped>
.delete-dialog__question {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--sanko-text);
  text-align: center;
}

.delete-dialog__warning {
  margin: 16px 0 28px;
  font-size: 14px;
  color: #c0392b;
  text-align: center;
}

.delete-dialog__actions {
  display: flex;
  gap: 16px;
}

.delete-dialog__btn {
  flex: 1;
  height: 40px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d9d0c0;
  transition: opacity 0.15s;
}

.delete-dialog__btn:hover {
  opacity: 0.85;
}

.delete-dialog__btn--cancel {
  background: #fff;
  color: var(--sanko-text);
}

.delete-dialog__btn--confirm {
  background: #e8e0d4;
  color: var(--sanko-text);
}
</style>

<style>
.delete-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 8px 0 0;
  z-index: 3000 !important;
}

.delete-dialog .el-dialog__header {
  display: none;
}

.delete-dialog .el-dialog__body {
  padding: 32px 28px 24px;
}
</style>
