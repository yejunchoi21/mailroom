import { Router } from 'express'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import {
  buildSessionCookie,
  clearSessionCookie,
  createSession,
  destroySession,
} from '../services/sessions.js'
import { isValidEmail, normalizeEmail, requireFields } from '../services/validation.js'

const router = Router()
const SALT_ROUNDS = 12

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
})

function publicUser(user) {
  return {
    id: String(user._id || user.id),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(200).json({ user: null, csrfToken: null })
  }

  return res.status(200).json({
    user: req.user,
    csrfToken: req.session.csrfToken,
  })
})

router.post('/signup', async (req, res, next) => {
  try {
    const missing = requireFields(req.body, ['email', 'password', 'name'])
    if (missing.length) {
      return res.status(400).json({ error: `Missing: ${missing.join(', ')}` })
    }

    const name = String(req.body.name).trim()
    const email = String(req.body.email).trim()
    const password = String(req.body.password)

    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const db = await connectDb()
    const emailKey = normalizeEmail(email)
    const existing = await db.collection('users').findOne({ emailKey })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const now = new Date()
    const doc = {
      name,
      email,
      emailKey,
      passwordHash,
      createdAt: now,
      importedLocalIds: {
        campaigns: [],
        subscribers: [],
      },
    }

    const result = await db.collection('users').insertOne(doc)
    const session = await createSession(result.insertedId)
    const cookie = buildSessionCookie(session._id)

    res.cookie(cookie.name, cookie.value, cookie.options)
    return res.status(201).json({
      user: publicUser({ ...doc, _id: result.insertedId }),
      csrfToken: session.csrfToken,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const missing = requireFields(req.body, ['email', 'password'])
    if (missing.length) {
      return res.status(400).json({ error: `Missing: ${missing.join(', ')}` })
    }

    const email = String(req.body.email).trim()
    const password = String(req.body.password)
    const db = await connectDb()
    const user = await db.collection('users').findOne({
      emailKey: normalizeEmail(email),
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    if (req.session?._id) {
      await destroySession(req.session._id)
    }

    const session = await createSession(user._id)
    const cookie = buildSessionCookie(session._id)
    res.cookie(cookie.name, cookie.value, cookie.options)

    return res.status(200).json({
      user: publicUser(user),
      csrfToken: session.csrfToken,
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/logout', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    await destroySession(req.session._id)
    const cookie = clearSessionCookie()
    res.cookie(cookie.name, cookie.value, cookie.options)
    return res.status(200).json({ ok: true })
  } catch (error) {
    return next(error)
  }
})

export default router
