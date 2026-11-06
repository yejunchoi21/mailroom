import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { buildEmailContent } from './emailContent.js'
import { sendEmail } from './resendClient.js'

const SCHEDULE_STATUSES = [
  'Scheduled',
  'Processing',
  'Submitted',
  'Failed',
  'Cancelled',
]

let tickInFlight = false
let intervalHandle = null

export function getScheduleStatuses() {
  return SCHEDULE_STATUSES
}

export function toSchedule(doc) {
  return {
    id: String(doc._id),
    campaignId: String(doc.campaignId),
    status: doc.status,
    scheduledFor: doc.scheduledFor,
    timezone: doc.timezone,
    localDate: doc.localDate,
    localTime: doc.localTime,
    recipientEmail: doc.recipientEmail,
    snapshot: doc.snapshot,
    providerMessageId: doc.providerMessageId || null,
    error: doc.error || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    cancelledAt: doc.cancelledAt || null,
  }
}

/**
 * Atomically claim the next due Scheduled job.
 * Returns null when none are available.
 */
export async function claimNextDueSchedule(now = new Date()) {
  const db = await connectDb()
  const claimed = await db.collection('schedules').findOneAndUpdate(
    {
      status: 'Scheduled',
      scheduledFor: { $lte: now },
    },
    {
      $set: {
        status: 'Processing',
        claimedAt: now,
        updatedAt: now.toISOString(),
      },
    },
    {
      sort: { scheduledFor: 1 },
      returnDocument: 'after',
    },
  )

  return claimed || null
}

export async function processClaimedSchedule(schedule, { send = sendEmail } = {}) {
  const db = await connectDb()
  const content = buildEmailContent({
    subject: schedule.snapshot.subject,
    bodyHtml: schedule.snapshot.bodyHtml,
    campaignName: schedule.snapshot.name,
  })

  try {
    const result = await send({
      to: schedule.recipientEmail,
      subject: content.subject,
      html: content.html,
      text: content.text,
      idempotencyKey: schedule.idempotencyKey,
    })

    const updated = await db.collection('schedules').findOneAndUpdate(
      { _id: schedule._id, status: 'Processing' },
      {
        $set: {
          status: 'Submitted',
          providerMessageId: result?.id || null,
          updatedAt: new Date().toISOString(),
          error: null,
        },
      },
      { returnDocument: 'after' },
    )

    return updated
  } catch (error) {
    const updated = await db.collection('schedules').findOneAndUpdate(
      { _id: schedule._id, status: 'Processing' },
      {
        $set: {
          status: 'Failed',
          error: error.message || 'Send failed',
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: 'after' },
    )
    return updated
  }
}

/**
 * Process due schedules once. Overlapping ticks are skipped.
 */
export async function runScheduleTick(options = {}) {
  if (tickInFlight) {
    return { skipped: true, reason: 'overlap' }
  }

  tickInFlight = true
  const processed = []

  try {
    // Process a bounded batch each minute.
    for (let i = 0; i < 20; i += 1) {
      const claimed = await claimNextDueSchedule(options.now)
      if (!claimed) break
      const result = await processClaimedSchedule(claimed, options)
      processed.push(result)
    }

    return { skipped: false, processedCount: processed.length, processed }
  } finally {
    tickInFlight = false
  }
}

export function startScheduler({ intervalMs = 60_000 } = {}) {
  if (intervalHandle) return

  intervalHandle = setInterval(() => {
    runScheduleTick().catch((error) => {
      console.error('Schedule tick failed:', error)
    })
  }, intervalMs)

  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref()
  }

  console.log(`Mailroom scheduler checking due sends every ${intervalMs / 1000}s`)
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
  tickInFlight = false
}

export async function cancelSchedule({ scheduleId, userId }) {
  const db = await connectDb()
  const result = await db.collection('schedules').findOneAndUpdate(
    {
      _id: new ObjectId(scheduleId),
      userId: new ObjectId(userId),
      status: 'Scheduled',
    },
    {
      $set: {
        status: 'Cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' },
  )

  return result || null
}

/** Test helper */
export function __resetSchedulerStateForTests() {
  tickInFlight = false
  stopScheduler()
}
