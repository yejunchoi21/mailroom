import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import { closeDb, connectDb, pingDb } from './db.js'
import { attachSession } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import subscriberRoutes from './routes/subscribers.js'
import importRoutes from './routes/import.js'

const app = express()
const port = Number(process.env.PORT) || 3002
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(attachSession)

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pingDb()
    res.status(200).json({
      status: 'ok',
      mongodb: 'connected',
      database: result.database,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      mongodb: 'disconnected',
      message: error.message || 'MongoDB health check failed',
      timestamp: new Date().toISOString(),
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/subscribers', subscriberRoutes)
app.use('/api/import', importRoutes)

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error.' })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

await connectDb()

const server = app.listen(port, () => {
  console.log(`Mailroom API listening on http://localhost:${port}`)
})

async function shutdown() {
  server.close()
  await closeDb()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
