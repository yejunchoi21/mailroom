import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { connectDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { cancelSchedule, toSchedule } from '../services/scheduler.js'

const router = Router()

router.use(requireAuth, requireCsrf)

router.get('/schedules', async (req, res, next) => {
  try {
    const db = await connectDb()
    const docs = await db
      .collection('schedules')
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ scheduledFor: 1 })
      .toArray()

    res.json({ schedules: docs.map(toSchedule) })
  } catch (error) {
    next(error)
  }
})

router.post('/schedules/:id/cancel', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid schedule id.' })
    }

    const updated = await cancelSchedule({
      scheduleId: req.params.id,
      userId: req.user.id,
    })

    if (!updated) {
      return res.status(409).json({
        error: 'Only schedules still waiting (Scheduled) can be cancelled.',
      })
    }

    res.json({ schedule: toSchedule(updated) })
  } catch (error) {
    next(error)
  }
})

export default router
