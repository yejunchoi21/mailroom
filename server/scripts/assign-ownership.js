#!/usr/bin/env node
/**
 * Explicit ownership migration for ownerless campaign/subscriber records.
 *
 * Usage:
 *   node scripts/assign-ownership.js --email you@example.com
 *   node scripts/assign-ownership.js --email you@example.com --dry-run
 *
 * This never runs automatically. Ownerless records are preserved until you
 * intentionally assign them with this command.
 */
import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { closeDb, connectDb } from '../db.js'
import { normalizeEmail } from '../services/validation.js'

function getArg(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

async function main() {
  const email = getArg('--email')
  const dryRun = process.argv.includes('--dry-run')

  if (!email) {
    console.error('Usage: node scripts/assign-ownership.js --email user@example.com [--dry-run]')
    process.exit(1)
  }

  const db = await connectDb()
  const user = await db.collection('users').findOne({
    emailKey: normalizeEmail(email),
  })

  if (!user) {
    console.error(`No user found for ${email}`)
    process.exit(1)
  }

  const ownerlessCampaignQuery = {
    $or: [{ userId: { $exists: false } }, { userId: null }],
  }
  const ownerlessSubscriberQuery = {
    $or: [{ userId: { $exists: false } }, { userId: null }],
  }

  const campaignCount = await db
    .collection('campaigns')
    .countDocuments(ownerlessCampaignQuery)
  const subscriberCount = await db
    .collection('subscribers')
    .countDocuments(ownerlessSubscriberQuery)

  console.log(`User: ${user.email} (${user._id})`)
  console.log(`Ownerless campaigns: ${campaignCount}`)
  console.log(`Ownerless subscribers: ${subscriberCount}`)

  if (dryRun) {
    console.log('Dry run only — no changes made.')
    await closeDb()
    return
  }

  if (!campaignCount && !subscriberCount) {
    console.log('Nothing to assign.')
    await closeDb()
    return
  }

  const userId = new ObjectId(user._id)

  const campaignsResult = await db.collection('campaigns').updateMany(
    ownerlessCampaignQuery,
    { $set: { userId } },
  )
  const subscribersResult = await db.collection('subscribers').updateMany(
    ownerlessSubscriberQuery,
    { $set: { userId } },
  )

  console.log(`Assigned campaigns: ${campaignsResult.modifiedCount}`)
  console.log(`Assigned subscribers: ${subscribersResult.modifiedCount}`)
  await closeDb()
}

main().catch(async (error) => {
  console.error(error)
  await closeDb()
  process.exit(1)
})
