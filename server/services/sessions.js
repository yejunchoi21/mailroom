import crypto from 'node:crypto'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'

function sessionTtlMs() {
  return Number(process.env.SESSION_TTL_MS) || 7 * 24 * 60 * 60 * 1000
}

export function cookieName() {
  return process.env.COOKIE_NAME || 'mailroom_session'
}

export async function createSession(userId) {
  const db = await connectDb()
  const now = new Date()
  const session = {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    csrfToken: crypto.randomBytes(24).toString('hex'),
    createdAt: now,
    expiresAt: new Date(now.getTime() + sessionTtlMs()),
  }

  await db.collection('sessions').insertOne(session)
  return session
}

export async function getSession(sessionId) {
  if (!sessionId || !ObjectId.isValid(sessionId)) return null

  const db = await connectDb()
  const session = await db.collection('sessions').findOne({
    _id: new ObjectId(sessionId),
    expiresAt: { $gt: new Date() },
  })

  return session
}

export async function destroySession(sessionId) {
  if (!sessionId || !ObjectId.isValid(sessionId)) return
  const db = await connectDb()
  await db.collection('sessions').deleteOne({ _id: new ObjectId(sessionId) })
}

export async function rotateCsrfToken(sessionId) {
  const db = await connectDb()
  const csrfToken = crypto.randomBytes(24).toString('hex')
  await db.collection('sessions').updateOne(
    { _id: new ObjectId(sessionId) },
    { $set: { csrfToken } },
  )
  return csrfToken
}

export function buildSessionCookie(sessionId) {
  const secure = process.env.COOKIE_SECURE === 'true'
  const maxAge = Math.floor(sessionTtlMs() / 1000)

  return {
    name: cookieName(),
    value: String(sessionId),
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge,
    },
  }
}

export function clearSessionCookie() {
  const secure = process.env.COOKIE_SECURE === 'true'
  return {
    name: cookieName(),
    value: '',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 0,
    },
  }
}
