import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { htmlToPlainPreview, sanitizeHtml } from '../services/sanitize.js'

const router = Router()

function toCampaign(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    subject: doc.subject || '',
    body: doc.body || '',
    preview: doc.preview || '',
    status: doc.status || 'Draft',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    source: 'user',
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
      .collection('campaigns')
      .find(ownerFilter(req.user.id))
      .sort({ updatedAt: -1 })
      .toArray()

    res.json({ campaigns: docs.map(toCampaign) })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) {
      return res.status(400).json({ error: 'Campaign name is required.' })
    }

    const body = sanitizeHtml(req.body?.body || '')
    const subject = String(req.body?.subject || '')
    const now = new Date().toISOString()
    const doc = {
      userId: new ObjectId(req.user.id),
      name,
      subject,
      body,
      preview: htmlToPlainPreview(body || subject),
      status: 'Draft',
      createdAt: req.body?.createdAt || now,
      updatedAt: now,
      localId: req.body?.localId || null,
    }

    const db = await connectDb()
    const result = await db.collection('campaigns').insertOne(doc)
    res.status(201).json({ campaign: toCampaign({ ...doc, _id: result.insertedId }) })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign id.' })
    }

    const name = String(req.body?.name || '').trim()
    if (!name) {
      return res.status(400).json({ error: 'Campaign name is required.' })
    }

    const body = sanitizeHtml(req.body?.body || '')
    const subject = String(req.body?.subject || '')
    const now = new Date().toISOString()
    const db = await connectDb()

    const result = await db.collection('campaigns').findOneAndUpdate(
      {
        _id: new ObjectId(req.params.id),
        ...ownerFilter(req.user.id),
      },
      {
        $set: {
          name,
          subject,
          body,
          preview: htmlToPlainPreview(body || subject),
          status: 'Draft',
          updatedAt: now,
        },
      },
      { returnDocument: 'after' },
    )

    if (!result) {
      return res.status(404).json({ error: 'Campaign not found.' })
    }

    res.json({ campaign: toCampaign(result) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign id.' })
    }

    const db = await connectDb()
    const result = await db.collection('campaigns').deleteOne({
      _id: new ObjectId(req.params.id),
      ...ownerFilter(req.user.id),
    })

    if (!result.deletedCount) {
      return res.status(404).json({ error: 'Campaign not found.' })
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

export default router
