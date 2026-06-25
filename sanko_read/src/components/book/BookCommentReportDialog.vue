<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const REPORT_REASONS = [
  '辱骂、侮辱',
  '引战、挑起争端',
  '广告、推销',
  '与书籍无关',
  '其他',
] as const

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [reason: string]
}>()

const selectedReason = ref<string>(REPORT_REASONS[0])
const otherText = ref('')

const showOtherInput = computed(() => selectedReason.value === '其他')

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    selectedReason.value = REPORT_REASONS[0]
    otherText.value = ''
  },
)

const close = () => emit('update:visible', false)

const confirm = () => {
  const reason =
    selectedReason.value === '其他'
      ? otherText.value.trim() || '其他'
      : selectedReason.value
  emit('confirm', reason)
  close()
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="420px"
    :show-close="false"
    align-center
    class="comment-report-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <h3 class="comment-report-dialog__title">举报原因：</h3>

    <el-radio-group v-model="selectedReason" class="comment-report-dialog__options">
      <el-radio v-for="reason in REPORT_REASONS" :key="reason" :value="reason">
        {{ reason }}
      </el-radio>
    </el-radio-group>

    <textarea
      v-if="showOtherInput"
      v-model="otherText"
      class="comment-report-dialog__other"
      placeholder="请填写举报原因"
      rows="3"
    />

    <div class="comment-report-dialog__actions">
      <button type="button" class="comment-report-dialog__btn comment-report-dialog__btn--cancel" @click="close">
        取消
      </button>
      <button type="button" class="comment-report-dialog__btn comment-report-dialog__btn--confirm" @click="confirm">
        确定
      </button>
    </div>
  </el-dialog>
</template>

<style scoped>
.comment-report-dialog__title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1a8a8f;
}

.comment-report-dialog__options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.comment-report-dialog__options :deep(.el-radio) {
  margin-right: 0;
  height: auto;
}

.comment-report-dialog__options :deep(.el-radio__label) {
  font-size: 14px;
  color: var(--sanko-text);
}

.comment-report-dialog__other {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #d9d0c0;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.comment-report-dialog__other:focus {
  border-color: var(--sanko-green);
}

.comment-report-dialog__actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.comment-report-dialog__btn {
  flex: 1;
  height: 40px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d9d0c0;
  transition: opacity 0.15s;
}

.comment-report-dialog__btn:hover {
  opacity: 0.85;
}

.comment-report-dialog__btn--cancel {
  background: #fff;
  color: var(--sanko-text);
}

.comment-report-dialog__btn--confirm {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
  color: #fff;
}
</style>

<style>
.comment-report-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 8px;
}

.comment-report-dialog .el-dialog__header {
  display: none;
}

.comment-report-dialog .el-dialog__body {
  padding: 28px 28px 24px;
}
</style>
