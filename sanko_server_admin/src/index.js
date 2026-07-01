import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import { ok } from './response.js'
import { store, syncBookContent } from './store.js'

const PORT = Number(process.env.PORT) || 8084
const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  }),
)
app.use(express.json())

app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.set('Pragma', 'no-cache')
  next()
})

app.get('/health', (_req, res) => {
  const sample = store.books.find((b) => b.id === 'b005')
  res.json(
    ok({
      status: 'ok',
      service: 'sanko_server_admin',
      sampleBookContentChars: sample?.fullContent?.length ?? 0,
    }),
  )
})

app.use('/api/admin/auth', authRoutes)
app.use('/api/admin', adminRoutes)

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: 'Not Found', data: null })
})

app.listen(PORT, () => {
  syncBookContent()
  const sample = store.books.find((b) => b.id === 'b005')
  console.log(`sanko_server_admin listening on http://localhost:${PORT}`)
  if (sample) {
    console.log(
      `[books] b005 fullContent=${sample.fullContent?.length ?? 0} chars, preview=${sample.previewExcerpt?.length ?? 0} chars`,
    )
  }
})
