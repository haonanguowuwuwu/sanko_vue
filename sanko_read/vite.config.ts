import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
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
