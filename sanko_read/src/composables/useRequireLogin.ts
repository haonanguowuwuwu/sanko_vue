import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

export function useRequireLogin() {
  const userStore = useUserStore()
  const { isLoggedIn } = storeToRefs(userStore)
  const route = useRoute()
  const router = useRouter()

  const promptLogin = (message = '请先登录后再操作', redirect?: string) => {
    ElMessage.warning(message)
    void router.push({
      path: route.path,
      query: { ...route.query, login: '1', redirect: redirect ?? route.fullPath },
    })
  }

  const requireLogin = (action: () => void, message?: string, redirect?: string) => {
    if (!isLoggedIn.value) {
      promptLogin(message, redirect)
      return false
    }
    action()
    return true
  }

  return { isLoggedIn, requireLogin, promptLogin }
}
