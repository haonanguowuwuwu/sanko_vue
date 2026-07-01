<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'

const auth = useAdminAuthStore()

const form = reactive({
  username: auth.profile?.username ?? '',
  email: auth.profile?.email ?? '',
})

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const saving = ref(false)

const saveProfile = async () => {
  if (!form.username.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }
  saving.value = true
  try {
    await auth.updateProfile({
      username: form.username.trim(),
      email: form.email.trim(),
    })
    ElMessage.success('资料已保存')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!passwordForm.current || !passwordForm.next) {
    ElMessage.warning('请填写完整密码信息')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  try {
    await auth.changePassword(passwordForm.current, passwordForm.next)
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
    ElMessage.success('密码已更新')
  } catch (error) {
    const message = error instanceof Error ? error.message : '密码更新失败'
    ElMessage.error(message)
  }
}
</script>

<template>
  <div class="profile-page">
    <PageHeader title="个人资料" description="编辑管理员账号信息" />

    <div class="profile-page__grid">
      <el-card shadow="never" class="profile-card">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-form label-width="80px" label-position="left">
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" />
          </el-form-item>
          <el-form-item label="角色">
            <el-input :model-value="auth.profile?.role ?? '管理员'" disabled />
          </el-form-item>
          <el-form-item label="上次登录">
            <el-input :model-value="auth.profile?.lastLoginAt ?? '-'" disabled />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="profile-card">
        <template #header>
          <span>修改密码</span>
        </template>
        <el-form label-width="96px" label-position="left">
          <el-form-item label="当前密码">
            <el-input v-model="passwordForm.current" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="passwordForm.next" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认新密码">
            <el-input v-model="passwordForm.confirm" type="password" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="changePassword">更新密码</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.profile-card {
  border: 1px solid var(--admin-border);
}

@media (max-width: 900px) {
  .profile-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
