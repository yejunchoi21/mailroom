import { describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * Focused permission helpers mirroring route ownership checks.
 * Automated tests never call Resend.
 */
function canAccessCampaign(campaign, userId) {
  if (!campaign) return false
  return String(campaign.userId) === String(userId)
}

function recipientForTestSend(user) {
  return user.email
}

describe('delivery permissions', () => {
  it('only allows the campaign owner to send or schedule', () => {
    const ownerId = new ObjectId()
    const otherId = new ObjectId()
    const campaign = { userId: ownerId, name: 'Owned' }

    expect(canAccessCampaign(campaign, ownerId)).toBe(true)
    expect(canAccessCampaign(campaign, otherId)).toBe(false)
    expect(canAccessCampaign(null, ownerId)).toBe(false)
  })

  it('forces test sends to the signed-in account email only', () => {
    const user = { id: 'abc', email: 'owner@example.com' }
    expect(recipientForTestSend(user)).toBe('owner@example.com')
    expect(recipientForTestSend(user)).not.toBe('someone-else@example.com')
  })
})
