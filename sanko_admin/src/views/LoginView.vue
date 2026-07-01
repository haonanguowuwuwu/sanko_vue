<script setup lang="ts">

import { ref } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { User, Lock } from '@element-plus/icons-vue'

import { useAdminAuthStore } from '@/stores/adminAuth'

import { useAdminDataStore } from '@/stores/adminData'



const route = useRoute()

const router = useRouter()

const auth = useAdminAuthStore()

const dataStore = useAdminDataStore()



const username = ref('admin')

const password = ref('')

const loading = ref(false)



const handleLogin = async () => {

  loading.value = true

  try {

    await auth.login(username.value, password.value)

    await dataStore.loadBootstrap()

    ElMessage.success('登录成功')

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'

    void router.push(redirect)

  } catch (error) {

    const message = error instanceof Error ? error.message : '登录失败'

    ElMessage.error(message)

  } finally {

    loading.value = false

  }

}

</script>



<template>

  <div class="login-page">

    <div class="login-card">

      <div class="login-card__header">

        <span class="login-card__logo">S</span>

        <h1 class="login-card__title">Sanko 管理后台</h1>

        <p class="login-card__subtitle">请使用管理员账号登录</p>

      </div>



      <el-form label-position="top" @submit.prevent="handleLogin">

        <el-form-item label="用户名">

          <el-input

            v-model="username"

            placeholder="请输入用户名"

            size="large"

            :prefix-icon="User"

            autocomplete="username"

          />

        </el-form-item>

        <el-form-item label="密码">

          <el-input

            v-model="password"

            type="password"

            placeholder="请输入密码"

            size="large"

            show-password

            :prefix-icon="Lock"

            autocomplete="current-password"

            @keyup.enter="handleLogin"

          />

        </el-form-item>

        <el-button

          type="primary"

          size="large"

          class="login-card__submit"

          :loading="loading"

          @click="handleLogin"

        >

          登录

        </el-button>

      </el-form>



      <p class="login-card__hint">默认账号 admin / admin123（需先启动 sanko_server_admin:8084）</p>

    </div>

  </div>

</template>



<style scoped>

.login-page {

  min-height: 100vh;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 24px;

  background: linear-gradient(135deg, #001529 0%, #003d1f 100%);

}



.login-card {

  width: 100%;

  max-width: 400px;

  padding: 40px 36px 32px;

  border-radius: 12px;

  background: #fff;

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

}



.login-card__header {

  text-align: center;

  margin-bottom: 28px;

}



.login-card__logo {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: 48px;

  height: 48px;

  border-radius: 12px;

  background: var(--admin-primary);

  color: #fff;

  font-size: 22px;

  font-weight: 700;

  margin-bottom: 16px;

}



.login-card__title {

  margin: 0 0 8px;

  font-size: 22px;

  font-weight: 600;

  color: var(--admin-text);

}



.login-card__subtitle {

  margin: 0;

  font-size: 14px;

  color: var(--admin-text-secondary);

}



.login-card__submit {

  width: 100%;

  margin-top: 8px;

  --el-button-bg-color: var(--admin-primary);

  --el-button-border-color: var(--admin-primary);

  --el-button-hover-bg-color: var(--admin-primary-hover);

  --el-button-hover-border-color: var(--admin-primary-hover);

}



.login-card__hint {

  margin: 20px 0 0;

  font-size: 12px;

  color: var(--admin-text-secondary);

  text-align: center;

  line-height: 1.5;

}

</style>

