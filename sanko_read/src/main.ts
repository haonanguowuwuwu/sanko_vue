import '@/reader/pdfjsSetup'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/styles/variables.css'

function resetLegacyAppearanceOverrides() {
  const root = document.documentElement
  root.style.removeProperty('--sanko-green')
  root.style.removeProperty('--sanko-green-hover')
  document.body.style.removeProperty('font-family')
  root.classList.remove('sanko-dark')
  delete root.dataset.appearance
}

resetLegacyAppearanceOverrides()

import App from './App.vue'
import router from './router'
import { bootstrapApp } from './bootstrap'
import { API_BASE_URL, USE_MOCK } from '@/api/config'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

await bootstrapApp()

if (import.meta.env.DEV) {
  console.info(
    `[Sanko] ${USE_MOCK ? '内置 Mock（未请求小后端）' : `联调小后端 ${API_BASE_URL}`}`,
  )
}

app.mount('#app')
