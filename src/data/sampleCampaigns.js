/** Demo campaigns for browsing. Not persisted — replace with real data later. */
export const sampleCampaigns = [
  {
    id: 'cmp-101',
    name: 'Spring product launch',
    subject: 'Meet our newest collection',
    preview:
      'Soft layers, fresh colors, and pieces made to move with you all season long.',
    body: '<p>Soft layers, fresh colors, and pieces made to move with you all season long.</p><p>Explore the collection today.</p>',
    status: 'Sent',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-28T14:30:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-102',
    name: 'Weekly newsletter #42',
    subject: 'This week in Mailroom',
    preview:
      'Product tips, a quick win for your next send, and what our team is reading.',
    body: '<h2>This week</h2><ul><li>Product tips</li><li>A quick win for your next send</li><li>What our team is reading</li></ul>',
    status: 'Draft',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-02T09:15:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-103',
    name: 'Black Friday early access',
    subject: 'Members get 24-hour early access',
    preview:
      'Doors open tomorrow at 9 a.m. Shop exclusive bundles before they sell out.',
    body: '<p>Doors open tomorrow at <strong>9 a.m.</strong></p><p>Shop exclusive bundles before they sell out.</p>',
    status: 'Scheduled',
    createdAt: '2026-10-25T12:00:00Z',
    updatedAt: '2026-11-01T18:00:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-104',
    name: 'Welcome series — day 1',
    subject: 'Thanks for joining us',
    preview:
      'Here is everything you need to get started, plus a small gift for signing up.',
    body: '<p>Thanks for joining us.</p><p>Here is everything you need to get started, plus a small gift for signing up.</p>',
    status: 'Sent',
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-09-12T11:45:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-105',
    name: 'Re-engagement nudge',
    subject: 'We miss you — here’s 15% off',
    preview:
      'It has been a while. Come back this week and take 15% off your next order.',
    body: '<p>It has been a while.</p><p>Come back this week and take <em>15% off</em> your next order.</p>',
    status: 'Draft',
    createdAt: '2026-10-28T15:00:00Z',
    updatedAt: '2026-10-30T16:20:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-106',
    name: 'Holiday shipping reminder',
    subject: 'Order by Dec 15 for guaranteed delivery',
    preview:
      'Gift guides are ready. Place orders by December 15 to arrive before the holidays.',
    body: '<p>Gift guides are ready.</p><p>Place orders by <strong>December 15</strong> to arrive before the holidays.</p>',
    status: 'Scheduled',
    createdAt: '2026-10-30T08:00:00Z',
    updatedAt: '2026-11-03T08:00:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-107',
    name: 'Customer survey',
    subject: 'Got 2 minutes? Tell us how we’re doing',
    preview:
      'Your feedback shapes what we build next. Share a few thoughts and enter a draw.',
    body: '<p>Your feedback shapes what we build next.</p><p>Share a few thoughts and enter a draw.</p>',
    status: 'Sent',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-22T13:10:00Z',
    source: 'demo',
  },
  {
    id: 'cmp-108',
    name: 'Feature announcement',
    subject: 'Introducing smarter audience segments',
    preview:
      'Target the right people with less guesswork. New segments are ready in your account.',
    body: '<h2>Smarter segments</h2><p>Target the right people with less guesswork. New segments are ready in your account.</p>',
    status: 'Draft',
    createdAt: '2026-10-12T11:00:00Z',
    updatedAt: '2026-10-15T10:05:00Z',
    source: 'demo',
  },
].map((campaign) => ({
  ...campaign,
  isDemo: true,
  isReadOnly: campaign.status === 'Scheduled' || campaign.status === 'Sent',
}))

export const CAMPAIGN_STATUSES = ['Draft', 'Scheduled', 'Sent']

export function isDemoCampaign(campaign) {
  return campaign?.source === 'demo' || campaign?.isDemo === true
}

export function isEditableCampaign(campaign) {
  return !isDemoCampaign(campaign) && campaign?.status === 'Draft'
}
