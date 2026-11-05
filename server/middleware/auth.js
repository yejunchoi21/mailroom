import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { cookieName, getSession } from '../services/sessions.js'

export async function attachSession(req, _res, next) {
  try {
    const sessionId = req.cookies?.[cookieName()]
    const session = await getSession(sessionId)

    if (!session) {
      req.session = null
      req.user = null
      return next()
    }

    const db = await connectDb()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { passwordHash: 0 } },
    )

    if (!user) {
      req.session = null
      req.user = null
      return next()
    }

    req.session = session
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

export function requireAuth(req, res, next) {
  if (!req.user || !req.session) {
    return res.status(401).json({ error: 'Authentication required.' })
  }
  return next()
}
