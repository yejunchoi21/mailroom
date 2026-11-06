import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

const schedules = new Map()

function makeCollection() {
  return {
    async findOneAndUpdate(filter, update, options = {}) {
      const entries = [...schedules.values()]
      let match = null

      if (filter.status === 'Scheduled' && filter.scheduledFor) {
        const due = entries
          .filter(
            (doc) =>
              doc.status === 'Scheduled' &&
              doc.scheduledFor.getTime() <= filter.scheduledFor.$lte.getTime(),
          )
          .sort((a, b) => a.scheduledFor - b.scheduledFor)
        match = due[0] || null
      } else if (filter._id && filter.userId && filter.status) {
        match =
          entries.find(
            (doc) =>
              String(doc._id) === String(filter._id) &&
              String(doc.userId) === String(filter.userId) &&
              doc.status === filter.status,
          ) || null
      } else if (filter._id && filter.status) {
        match =
          entries.find(
            (doc) =>
              String(doc._id) === String(filter._id) && doc.status === filter.status,
          ) || null
      }

      if (!match) return null

      const next = {
        ...match,
        ...(update.$set || {}),
      }
      schedules.set(String(match._id), next)
      return options.returnDocument === 'after' ? next : match
    },
  }
}

vi.mock('../db.js', () => ({
  connectDb: vi.fn(async () => ({
    collection: (name) => {
      if (name !== 'schedules') throw new Error(`Unexpected collection ${name}`)
      return makeCollection()
    },
  })),
}))

describe('scheduler', () => {
  beforeEach(() => {
    schedules.clear()
  })

  it('atomically claims a due schedule once and submits with idempotency key', async () => {
    const {
      __resetSchedulerStateForTests,
      claimNextDueSchedule,
      processClaimedSchedule,
    } = await import('../services/scheduler.js')

    __resetSchedulerStateForTests()

    const id = new ObjectId()
    const userId = new ObjectId()
    schedules.set(String(id), {
      _id: id,
      userId,
      campaignId: new ObjectId(),
      status: 'Scheduled',
      scheduledFor: new Date('2020-01-01T00:00:00Z'),
      recipientEmail: 'owner@example.com',
      idempotencyKey: `schedule-send/${userId}/${id}`,
      snapshot: {
        name: 'Test',
        subject: 'Hello',
        bodyHtml: '<p>Hi</p>',
        bodyText: 'Hi',
      },
    })

    const sendMock = vi.fn(async () => ({ id: 'provider-1' }))
    const claimed = await claimNextDueSchedule(new Date('2026-01-01T00:00:00Z'))
    expect(claimed.status).toBe('Processing')

    const secondClaim = await claimNextDueSchedule(new Date('2026-01-01T00:00:00Z'))
    expect(secondClaim).toBeNull()

    const processed = await processClaimedSchedule(claimed, { send: sendMock })
    expect(processed.status).toBe('Submitted')
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0][0].idempotencyKey).toBe(
      `schedule-send/${userId}/${id}`,
    )
  })

  it('skips overlapping schedule ticks', async () => {
    const { __resetSchedulerStateForTests, runScheduleTick } = await import(
      '../services/scheduler.js'
    )
    __resetSchedulerStateForTests()

    const id = new ObjectId()
    schedules.set(String(id), {
      _id: id,
      userId: new ObjectId(),
      campaignId: new ObjectId(),
      status: 'Scheduled',
      scheduledFor: new Date('2020-01-01T00:00:00Z'),
      recipientEmail: 'owner@example.com',
      idempotencyKey: `schedule-send/overlap/${id}`,
      snapshot: {
        name: 'Test',
        subject: 'Hello',
        bodyHtml: '<p>Hi</p>',
        bodyText: 'Hi',
      },
    })

    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })

    const slowSend = vi.fn(async () => {
      await gate
      return { id: 'provider-slow' }
    })

    const first = runScheduleTick({
      send: slowSend,
      now: new Date('2026-01-01T00:00:00Z'),
    })

    // Wait until the slow send has been entered.
    await vi.waitFor(() => {
      expect(slowSend).toHaveBeenCalled()
    })

    const overlap = await runScheduleTick({
      send: slowSend,
      now: new Date('2026-01-01T00:00:00Z'),
    })
    expect(overlap).toEqual({ skipped: true, reason: 'overlap' })

    release({ id: 'provider-slow' })
    await first
  })

  it('cancels only schedules that are still Scheduled', async () => {
    const { cancelSchedule, __resetSchedulerStateForTests } = await import(
      '../services/scheduler.js'
    )
    __resetSchedulerStateForTests()

    const id = new ObjectId()
    const userId = new ObjectId()
    schedules.set(String(id), {
      _id: id,
      userId,
      status: 'Scheduled',
      scheduledFor: new Date('2030-01-01T00:00:00Z'),
    })

    const cancelled = await cancelSchedule({
      scheduleId: String(id),
      userId: String(userId),
    })
    expect(cancelled.status).toBe('Cancelled')

    const again = await cancelSchedule({
      scheduleId: String(id),
      userId: String(userId),
    })
    expect(again).toBeNull()
  })

  it('prevents cancelling another user schedule', async () => {
    const { cancelSchedule, __resetSchedulerStateForTests } = await import(
      '../services/scheduler.js'
    )
    __resetSchedulerStateForTests()

    const id = new ObjectId()
    schedules.set(String(id), {
      _id: id,
      userId: new ObjectId(),
      status: 'Scheduled',
      scheduledFor: new Date('2030-01-01T00:00:00Z'),
    })

    const result = await cancelSchedule({
      scheduleId: String(id),
      userId: new ObjectId().toHexString(),
    })
    expect(result).toBeNull()
  })
})
