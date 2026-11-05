import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { htmlToPlainPreview, sanitizeHtml } from '../services/sanitize.js'
import { isValidEmail, normalizeEmail } from '../services/validation.js'

const router = Router()

router.use(requireAuth, requireCsrf)

/**
 * Explicitly import browser localStorage backup data into the signed-in account.
 * Prevents duplicate imports via per-user importedLocalIds tracking.
 */
router.post('/local-backup', async (req, res, next) => {
  try {
    const drafts = Array.isArray(req.body?.drafts) ? req.body.drafts : []
    const subscribers = Array.isArray(req.body?.subscribers)
      ? req.body.subscribers
      : []

    const db = await connectDb()
    const userId = new ObjectId(req.user.id)
    const user = await db.collection('users').findOne({ _id: userId })

    const importedCampaignIds = new Set(user?.importedLocalIds?.campaigns || [])
    const importedSubscriberIds = new Set(
      user?.importedLocalIds?.subscribers || [],
    )

    const existingSubscribers = await db
      .collection('subscribers')
      .find({ userId })
      .toArray()
    const emailMap = new Map(
      existingSubscribers.map((doc) => [doc.emailKey, doc]),
    )

    const report = {
      campaigns: {
        imported: 0,
        skippedAlreadyImported: 0,
        invalid: [],
      },
      subscribers: {
        imported: 0,
        skippedAlreadyImported: 0,
        skippedDuplicates: 0,
        skippedUnsubscribed: 0,
        invalid: [],
      },
    }

    const campaignDocs = []
    const newlyImportedCampaignLocalIds = []

    for (const draft of drafts) {
      const localId = typeof draft?.id === 'string' ? draft.id : null
      const name = String(draft?.name || '').trim()

      if (!localId || !name) {
        report.campaigns.invalid.push({
          localId,
          name,
          reason: !localId ? 'Missing local id' : 'Campaign name is required',
        })
        continue
      }

      if (importedCampaignIds.has(localId)) {
        report.campaigns.skippedAlreadyImported += 1
        continue
      }

      const body = sanitizeHtml(draft.body || '')
      const subject = String(draft.subject || '')
      const now = new Date().toISOString()

      campaignDocs.push({
        userId,
        name,
        subject,
        body,
        preview: htmlToPlainPreview(body || subject),
        status: 'Draft',
        createdAt: draft.createdAt || now,
        updatedAt: draft.updatedAt || now,
        localId,
      })
      newlyImportedCampaignLocalIds.push(localId)
      importedCampaignIds.add(localId)
    }

    const subscriberDocs = []
    const newlyImportedSubscriberLocalIds = []

    for (const row of subscribers) {
      const localId = typeof row?.id === 'string' ? row.id : null
      const name = String(row?.name || '').trim()
      const email = String(row?.email || '').trim()

      if (!localId || !name || !isValidEmail(email)) {
        report.subscribers.invalid.push({
          localId,
          name,
          email,
          reason: !localId
            ? 'Missing local id'
            : !name
              ? 'Missing name'
              : 'Invalid email',
        })
        continue
      }

      if (importedSubscriberIds.has(localId)) {
        report.subscribers.skippedAlreadyImported += 1
        continue
      }

      const emailKey = normalizeEmail(email)
      const existing = emailMap.get(emailKey)
      if (existing) {
        if (existing.status === 'Unsubscribed') {
          report.subscribers.skippedUnsubscribed += 1
        } else {
          report.subscribers.skippedDuplicates += 1
        }
        // Still mark local id as seen so retries don't keep reporting it as new invalid work
        newlyImportedSubscriberLocalIds.push(localId)
        importedSubscriberIds.add(localId)
        continue
      }

      const now = new Date().toISOString()
      const doc = {
        userId,
        name,
        email,
        emailKey,
        status: row.status === 'Unsubscribed' ? 'Unsubscribed' : 'Subscribed',
        dateAdded: row.dateAdded || now,
        updatedAt: row.updatedAt || now,
        source: row.source === 'import' ? 'import' : 'manual',
        isTestData: row.isTestData !== false,
        localId,
      }
      subscriberDocs.push(doc)
      emailMap.set(emailKey, doc)
      newlyImportedSubscriberLocalIds.push(localId)
      importedSubscriberIds.add(localId)
    }

    if (campaignDocs.length) {
      await db.collection('campaigns').insertMany(campaignDocs)
      report.campaigns.imported = campaignDocs.length
    }

    if (subscriberDocs.length) {
      await db.collection('subscribers').insertMany(subscriberDocs)
      report.subscribers.imported = subscriberDocs.length
    }

    await db.collection('users').updateOne(
      { _id: userId },
      {
        $addToSet: {
          'importedLocalIds.campaigns': {
            $each: newlyImportedCampaignLocalIds,
          },
          'importedLocalIds.subscribers': {
            $each: newlyImportedSubscriberLocalIds,
          },
        },
      },
    )

    res.json({ report })
  } catch (error) {
    next(error)
  }
})

export default router
