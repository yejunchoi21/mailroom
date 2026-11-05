import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { closeDb, pingDb } from './db.js'

const app = express()
const port = Number(process.env.PORT) || 3002

app.use(cors())
app.use(express.json())

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

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

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
