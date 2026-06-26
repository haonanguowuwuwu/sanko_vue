import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchPointsSummary } from '@/api/profile'
import { useUserStore } from '@/stores/user'

export const useProfileStore = defineStore('profile', () => {
  const pointsBalance = ref(0)
  const loaded = ref(false)

  async function loadPoints() {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      pointsBalance.value = 0
      loaded.value = false
      return
    }
    const summary = await fetchPointsSummary()
    pointsBalance.value = summary.balance
    loaded.value = true
  }

  function clear() {
    pointsBalance.value = 0
    loaded.value = false
  }

  return { pointsBalance, loaded, loadPoints, clear }
})
