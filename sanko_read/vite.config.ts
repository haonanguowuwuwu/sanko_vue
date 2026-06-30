import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function sankoDevBanner() {
  return {
    name: 'sanko-dev-banner',
    configureServer(server: ViteDevServer) {
      server.httpServer?.once('listening', () => {
        const env = loadEnv(server.config.mode, server.config.envDir, '')
        const useMock = env.VITE_USE_MOCK !== 'false'
        const base = env.VITE_API_BASE_URL || 'http://127.0.0.1:8083'
        const mode = server.config.mode

        console.log('')
        console.log('  Sanko Read 开发服务')
        console.log(`  → Vite mode: ${mode}`)
        if (useMock) {
          console.log('  → 数据：内置 Mock（不会请求小后端）')
          console.log('  → 联调请改用: npm run dev:api')
        } else {
          console.log(`  → 数据：联调小后端 ${base}`)
          console.log('  → 请先启动: cd sanko_server && npm run dev')
          console.log('  → Mock 请改用: npm run dev:mock')
        }
        console.log('')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), sankoDevBanner()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: [
      'underscore',
      'jszip',
      'fflate',
      'chardet',
      'mammoth',
      'marked',
      'mhtml2html',
      'js-untar',
      'pdfjs-dist',
      'rangy/lib/rangy-core.js',
      'rangy/lib/rangy-textrange',
    ],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
