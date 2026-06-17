<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  visible: boolean
  required?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const userStore = useUserStore()
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入账户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

watch(
  () => props.visible,
  (open) => {
    if (open) {
      form.username = ''
      form.password = ''
    }
  },
)

const handleClose = () => {
  if (props.required && !userStore.isLoggedIn) return
  emit('update:visible', false)
}

const handleVisibleChange = (value: boolean) => {
  if (!value) {
    handleClose()
    return
  }
  emit('update:visible', value)
}

const handleConfirm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await userStore.login(form.username, form.password)
    emit('update:visible', false)
    emit('success')
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败'
    ElMessage.error(message)
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="420px"
    :show-close="false"
    :close-on-click-modal="!required"
    :close-on-press-escape="!required"
    align-center
    class="login-dialog"
    @update:model-value="handleVisibleChange"
  >
    <template #header>
      <div class="login-dialog__title">登录</div>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="72px" class="login-form">
      <el-form-item label="账户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入账户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button class="confirm-btn" type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.login-dialog__title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--sanko-green);
}

.login-form :deep(.el-form-item__label) {
  color: var(--sanko-text);
  font-weight: 500;
}

.login-form :deep(.el-input__wrapper) {
  background: #ebe4d8;
  box-shadow: none;
  border: 1px solid #d9d0c0;
}

.confirm-btn {
  width: 100%;
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
  --el-button-hover-bg-color: var(--sanko-green-hover);
  --el-button-hover-border-color: var(--sanko-green-hover);
}
</style>

<style>
.login-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 4px;
}

.login-dialog .el-dialog__header {
  padding: 20px 20px 8px;
  margin-right: 0;
}

.login-dialog .el-dialog__body {
  padding: 8px 24px 0;
}

.login-dialog .el-dialog__footer {
  padding: 16px 24px 24px;
}
</style>
