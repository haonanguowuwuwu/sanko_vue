import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { adminApi } from '@/api/admin'
import { ApiError } from '@/api/request'
import {
  ADMIN_PROFILE_KEY,
  ADMIN_TOKEN_KEY,
  type AdminLoginResult,
  type AdminProfile,
} from '@/types/admin'

function loadProfile(): AdminProfile | null {
  const raw = localStorage.getItem(ADMIN_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminProfile
  } catch {
    return null
  }
}

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const token = ref<string | null>(localStorage.getItem(ADMIN_TOKEN_KEY))
  const profile = ref<AdminProfile | null>(loadProfile())
  const initialized = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value))

  function persist(result: AdminLoginResult) {
    token.value = result.token
    profile.value = result.profile
    localStorage.setItem(ADMIN_TOKEN_KEY, result.token)
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(result.profile))
  }

  async function initAuth() {
    if (initialized.value) return
    if (!token.value) {
      initialized.value = true
      return
    }
    try {
      const me = await adminApi.me()
      profile.value = me
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(me))
    } catch {
      await logout()
    } finally {
      initialized.value = true
    }
  }

  async function login(username: string, password: string) {
    if (!username.trim() || !password) {
      throw new Error('请输入用户名和密码')
    }
    const result = await adminApi.login({ username: username.trim(), password })
    persist(result)
  }

  async function updateProfile(patch: Partial<Pick<AdminProfile, 'username' | 'email'>>) {
    if (!profile.value) return
    const updated = await adminApi.updateProfile({
      username: patch.username ?? profile.value.username,
      email: patch.email ?? profile.value.email,
    })
    profile.value = { ...profile.value, ...updated }
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile.value))
  }

  async function changePassword(current: string, next: string) {
    await adminApi.changePassword({ current, next })
  }

  async function logout() {
    if (token.value) {
      try {
        await adminApi.logout()
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 401) {
          // 忽略登出失败，仍清除本地状态
        }
      }
    }
    token.value = null
    profile.value = null
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_PROFILE_KEY)
  }

  return {
    token,
    profile,
    initialized,
    isLoggedIn,
    initAuth,
    login,
    updateProfile,
    changePassword,
    logout,
  }
})
