import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { getStoredToken } from '@/api/request'

export const useUserStore = defineStore('user', () => {
  const username = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const initialized = ref(false)

  const isLoggedIn = computed(() => username.value !== null)

  async function init() {
    if (initialized.value) return
    initialized.value = true
    if (!getStoredToken()) return
    try {
      const user = await authApi.fetchMe()
      if (user) {
        username.value = user.username
        userId.value = user.id
      }
    } catch {
      username.value = null
      userId.value = null
    }
  }

  async function login(name: string, password: string) {
    const result = await authApi.login(name, password)
    username.value = result.user.username
    userId.value = result.user.id
  }

  async function logout() {
    await authApi.logout()
    username.value = null
    userId.value = null
  }

  return { username, userId, isLoggedIn, initialized, init, login, logout }
})
