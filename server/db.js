import { MongoClient } from 'mongodb'

let client
let db

export function getDbConfig() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || 'mailroom'

  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  return { uri, dbName }
}

export async function connectDb() {
  if (db) return db

  const { uri, dbName } = getDbConfig()
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  await ensureIndexes(db)
  return db
}

async function ensureIndexes(database) {
  await database.collection('users').createIndexes([
    { key: { emailKey: 1 }, unique: true },
  ])

  await database.collection('sessions').createIndexes([
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    { key: { userId: 1 } },
  ])

  await database.collection('campaigns').createIndexes([
    { key: { userId: 1, updatedAt: -1 } },
  ])

  await database.collection('subscribers').createIndexes([
    { key: { userId: 1, emailKey: 1 }, unique: true },
    { key: { userId: 1, dateAdded: -1 } },
  ])

  await database.collection('schedules').createIndexes([
    { key: { status: 1, scheduledFor: 1 } },
    { key: { userId: 1, scheduledFor: 1 } },
    { key: { campaignId: 1 } },
    { key: { idempotencyKey: 1 }, unique: true },
  ])
}

export async function pingDb() {
  const database = await connectDb()
  await database.command({ ping: 1 })
  return {
    ok: true,
    database: database.databaseName,
  }
}

export async function closeDb() {
  if (client) {
    await client.close()
    client = undefined
    db = undefined
  }
}
