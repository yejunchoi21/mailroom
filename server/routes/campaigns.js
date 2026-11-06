import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { buildEmailContent } from '../services/emailContent.js'
import { sendEmail } from '../services/resendClient.js'
import { htmlToPlainPreview, sanitizeHtml } from '../services/sanitize.js'
import { toSchedule } from '../services/scheduler.js'
import { assertFutureUtc, zonedLocalToUtc } from '../services/timezone.js'

const router = Router()

const sendTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many test email requests. Try again later.' },
})


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

/**
 * Send a saved campaign preview to the signed-in user's own email only.
 */
router.post('/:id/send-test', sendTestLimiter, async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign id.' })
    }

    const db = await connectDb()
    const campaign = await db.collection('campaigns').findOne({
      _id: new ObjectId(req.params.id),
      ...ownerFilter(req.user.id),
    })

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' })
    }

    const content = buildEmailContent({
      subject: campaign.subject,
      bodyHtml: campaign.body,
      campaignName: campaign.name,
    })

    if (!content.subject.trim()) {
      return res.status(400).json({ error: 'Add a subject before sending a test.' })
    }

    const result = await sendEmail({
      to: req.user.email,
      subject: `[Mailroom test] ${content.subject}`,
      html: content.html,
      text: content.text,
      idempotencyKey: `test-send/${req.user.id}/${campaign._id}/${Date.now()}`,
    })

    return res.status(202).json({
      status: 'submitted',
      recipient: req.user.email,
      providerMessageId: result.id,
      notice:
        'Resend accepted the message. Provider acceptance does not confirm inbox delivery.',
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * Schedule a future owner-only send. Stores a content snapshot + UTC instant.
 */
router.post('/:id/schedule', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid campaign id.' })
    }

    const localDate = String(req.body?.date || '').trim()
    const localTime = String(req.body?.time || '').trim()
    const timezone = String(req.body?.timezone || '').trim()

    let scheduledFor
    try {
      scheduledFor = zonedLocalToUtc(localDate, localTime, timezone)
      assertFutureUtc(scheduledFor)
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message })
    }

    const db = await connectDb()
    const campaign = await db.collection('campaigns').findOne({
      _id: new ObjectId(req.params.id),
      ...ownerFilter(req.user.id),
    })

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' })
    }

    const content = buildEmailContent({
      subject: campaign.subject,
      bodyHtml: campaign.body,
      campaignName: campaign.name,
    })

    if (!content.subject.trim()) {
      return res.status(400).json({ error: 'Add a subject before scheduling.' })
    }

    const now = new Date()
    const scheduleId = new ObjectId()
    const doc = {
      _id: scheduleId,
      userId: new ObjectId(req.user.id),
      campaignId: campaign._id,
      status: 'Scheduled',
      scheduledFor,
      timezone,
      localDate,
      localTime,
      recipientEmail: req.user.email,
      snapshot: {
        name: campaign.name,
        subject: content.subject,
        bodyHtml: campaign.body,
        bodyText: content.text,
      },
      idempotencyKey: `schedule-send/${req.user.id}/${scheduleId.toHexString()}`,
      providerMessageId: null,
      error: null,
      claimedAt: null,
      cancelledAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    await db.collection('schedules').insertOne(doc)

    res.status(201).json({
      schedule: toSchedule(doc),
      notice:
        'Scheduled for your account email only. The backend must keep running to send it.',
    })
  } catch (error) {
    next(error)
  }
})

export default router
