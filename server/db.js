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
  return db
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
