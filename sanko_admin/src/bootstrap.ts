import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAdminDataStore } from '@/stores/adminData'

export async function bootstrapApp() {
  const auth = useAdminAuthStore()
  await auth.initAuth()
  if (auth.isLoggedIn) {
    const data = useAdminDataStore()
    await data.loadBootstrap()
  }
}
