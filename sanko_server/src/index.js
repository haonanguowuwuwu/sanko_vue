import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import booksRoutes from './routes/books.js'
import favoritesRoutes from './routes/favorites.js'
import bookshelvesRoutes from './routes/bookshelves.js'
import catalogRoutes from './routes/catalog.js'
import annotationsRoutes from './routes/annotations.js'
import bookmarksRoutes from './routes/bookmarks.js'
import profileRoutes from './routes/profile.js'
import profileAccountRoutes from './routes/profileAccount.js'
import chatRoutes from './routes/chat.js'
import announcementRoutes from './routes/announcement.js'
import { ok } from './response.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 8083

const app = express()

app.use(cors())
app.use(express.json())

// 样本书文件：复用前端 public/sample-books
const sampleBooksDir = path.resolve(__dirname, '../../sanko_read/public/sample-books')
const uploadsDir = path.resolve(__dirname, '../uploads')
app.use('/files/uploads', express.static(uploadsDir))
app.use('/files', express.static(sampleBooksDir))

app.get('/health', (_req, res) => {
  res.json(ok({ status: 'up', mock: false }))
})

app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/bookshelves', bookshelvesRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/annotations', annotationsRoutes)
app.use('/api/bookmarks', bookmarksRoutes)
app.use('/api/profile/points', profileRoutes)
app.use('/api/profile', profileAccountRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/announcement', announcementRoutes)

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

app.listen(PORT, () => {
  console.log(`\n  Sanko 联调小后端已启动`)
  console.log(`  → http://localhost:${PORT}`)
  console.log(`  → 健康检查 GET /health`)
  console.log(`  → 样本书文件 GET /files/demo.epub`)
  console.log(`\n  前端切换：sanko_read/.env.development 设置 VITE_USE_MOCK=false\n`)
})
