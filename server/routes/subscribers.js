import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { isValidEmail, normalizeEmail } from '../services/validation.js'

const router = Router()

function toSubscriber(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    emailKey: doc.emailKey,
    status: doc.status,
    dateAdded: doc.dateAdded,
    updatedAt: doc.updatedAt,
    source: doc.source || 'manual',
    isTestData: doc.isTestData !== false,
    localId: doc.localId || null,
  }
}

function ownerFilter(userId) {
  return { userId: new ObjectId(userId) }
}

router.use(requireAuth, requireCsrf)

router.get('/', async (req, res, next) => {
  try {
    const db = await connectDb()
    const docs = await db
      .collection('subscribers')
      .find(ownerFilter(req.user.id))
      .sort({ dateAdded: -1 })
      .toArray()

    res.json({ subscribers: docs.map(toSubscriber) })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim()
    const status =
      req.body?.status === 'Unsubscribed' ? 'Unsubscribed' : 'Subscribed'

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    const now = new Date().toISOString()
    const doc = {
      userId: new ObjectId(req.user.id),
      name,
      email,
      emailKey: normalizeEmail(email),
      status,
      dateAdded: req.body?.dateAdded || now,
      updatedAt: now,
      source: req.body?.source === 'import' ? 'import' : 'manual',
      isTestData: req.body?.isTestData !== false,
      localId: req.body?.localId || null,
    }

    const db = await connectDb()
    try {
      const result = await db.collection('subscribers').insertOne(doc)
      return res
        .status(201)
        .json({ subscriber: toSubscriber({ ...doc, _id: result.insertedId }) })
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ error: 'A subscriber with this email already exists.' })
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscriber id.' })
    }

    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim()
    const status =
      req.body?.status === 'Unsubscribed' ? 'Unsubscribed' : 'Subscribed'

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    const db = await connectDb()
    const emailKey = normalizeEmail(email)

    try {
      const result = await db.collection('subscribers').findOneAndUpdate(
        {
          _id: new ObjectId(req.params.id),
          ...ownerFilter(req.user.id),
        },
        {
          $set: {
            name,
            email,
            emailKey,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: 'after' },
      )

      if (!result) {
        return res.status(404).json({ error: 'Subscriber not found.' })
      }

      return res.json({ subscriber: toSubscriber(result) })
    } catch (error) {
      if (error?.code === 11000) {
        return res
          .status(409)
          .json({ error: 'A subscriber with this email already exists.' })
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscriber id.' })
    }

    const db = await connectDb()
    const result = await db.collection('subscribers').deleteOne({
      _id: new ObjectId(req.params.id),
      ...ownerFilter(req.user.id),
    })

    if (!result.deletedCount) {
      return res.status(404).json({ error: 'Subscriber not found.' })
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.post('/import', async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : []
    if (!rows.length) {
      return res.status(400).json({ error: 'No rows to import.' })
    }

    const db = await connectDb()
    const existing = await db
      .collection('subscribers')
      .find(ownerFilter(req.user.id))
      .toArray()
    const byEmail = new Map(existing.map((doc) => [doc.emailKey, doc]))

    let added = 0
    let skippedDuplicates = 0
    let skippedUnsubscribed = 0
    const invalid = []
    const toInsert = []
    const seenInFile = new Set()

    for (const [index, row] of rows.entries()) {
      const name = String(row?.name || '').trim()
      const email = String(row?.email || '').trim()

      if (!name || !isValidEmail(email)) {
        invalid.push({
          line: index + 1,
          name,
          email,
          reason: !name ? 'Missing name' : 'Invalid email',
        })
        continue
      }

      const emailKey = normalizeEmail(email)
      if (seenInFile.has(emailKey)) {
        skippedDuplicates += 1
        continue
      }
      seenInFile.add(emailKey)

      const current = byEmail.get(emailKey)
      if (current) {
        if (current.status === 'Unsubscribed') skippedUnsubscribed += 1
        else skippedDuplicates += 1
        continue
      }

      const now = new Date().toISOString()
      const doc = {
        userId: new ObjectId(req.user.id),
        name,
        email,
        emailKey,
        status: 'Subscribed',
        dateAdded: now,
        updatedAt: now,
        source: 'import',
        isTestData: true,
        localId: null,
      }
      toInsert.push(doc)
      byEmail.set(emailKey, doc)
      added += 1
    }

    if (toInsert.length) {
      await db.collection('subscribers').insertMany(toInsert, { ordered: false })
    }

    res.json({
      added,
      skippedDuplicates,
      skippedUnsubscribed,
      invalid,
    })
  } catch (error) {
    next(error)
  }
})

export default router
