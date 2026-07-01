import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
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
  const initialized = ref(true)

  const isLoggedIn = computed(() => Boolean(token.value))

  function persist(result: AdminLoginResult) {
    token.value = result.token
    profile.value = result.profile
    localStorage.setItem(ADMIN_TOKEN_KEY, result.token)
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(result.profile))
  }

  /** 本地 mock 登录，后续替换为真实 API */
  async function login(username: string, password: string) {
    await new Promise((r) => setTimeout(r, 400))
    if (!username.trim() || !password) {
      throw new Error('请输入用户名和密码')
    }
    const result: AdminLoginResult = {
      token: `admin-token-${Date.now()}`,
      profile: {
        id: 'admin-1',
        username: username.trim(),
        email: `${username.trim()}@sanko.admin`,
        role: '超级管理员',
        lastLoginAt: new Date().toLocaleString('zh-CN'),
      },
    }
    persist(result)
  }

  function updateProfile(patch: Partial<Pick<AdminProfile, 'username' | 'email'>>) {
    if (!profile.value) return
    profile.value = { ...profile.value, ...patch }
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile.value))
  }

  function logout() {
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
    login,
    updateProfile,
    logout,
  }
})
