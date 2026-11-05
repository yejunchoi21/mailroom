#!/usr/bin/env node
/**
 * Creates two accounts and verifies neither can read/modify the other's data.
 */
import 'dotenv/config'

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3002'

function extractCookie(response) {
  const raw = response.headers.getSetCookie?.() || []
  if (raw.length) {
    return raw.map((value) => value.split(';')[0]).join('; ')
  }
  const single = response.headers.get('set-cookie')
  return single ? single.split(';')[0] : ''
}

async function request(path, { method = 'GET', body, cookie, csrfToken } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (cookie) headers.Cookie = cookie
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  return {
    status: response.status,
    data,
    cookie: extractCookie(response) || cookie || '',
  }
}

async function signup(label) {
  const email = `${label}-${Date.now()}@example.com`
  const result = await request('/api/auth/signup', {
    method: 'POST',
    body: {
      name: label,
      email,
      password: 'password123',
    },
  })

  if (result.status !== 201) {
    throw new Error(`Signup failed for ${label}: ${JSON.stringify(result.data)}`)
  }

  return {
    email,
    cookie: result.cookie,
    csrfToken: result.data.csrfToken,
    user: result.data.user,
  }
}

async function main() {
  const alice = await signup('alice')
  const bob = await signup('bob')

  const aliceCampaign = await request('/api/campaigns', {
    method: 'POST',
    cookie: alice.cookie,
    csrfToken: alice.csrfToken,
    body: {
      name: 'Alice Draft',
      subject: 'Hi',
      body: '<p>Secret for Alice</p>',
    },
  })

  if (aliceCampaign.status !== 201) {
    throw new Error(`Alice campaign create failed: ${JSON.stringify(aliceCampaign.data)}`)
  }

  const campaignId = aliceCampaign.data.campaign.id

  const aliceSubscriber = await request('/api/subscribers', {
    method: 'POST',
    cookie: alice.cookie,
    csrfToken: alice.csrfToken,
    body: {
      name: 'Alice Contact',
      email: 'alice-contact@example.com',
      status: 'Subscribed',
    },
  })

  if (aliceSubscriber.status !== 201) {
    throw new Error(
      `Alice subscriber create failed: ${JSON.stringify(aliceSubscriber.data)}`,
    )
  }

  const subscriberId = aliceSubscriber.data.subscriber.id

  const bobCampaigns = await request('/api/campaigns', {
    cookie: bob.cookie,
    csrfToken: bob.csrfToken,
  })
  const bobSubscribers = await request('/api/subscribers', {
    cookie: bob.cookie,
    csrfToken: bob.csrfToken,
  })

  if (bobCampaigns.data.campaigns?.some((item) => item.id === campaignId)) {
    throw new Error('Isolation failed: Bob can see Alice campaign')
  }

  if (bobSubscribers.data.subscribers?.some((item) => item.id === subscriberId)) {
    throw new Error('Isolation failed: Bob can see Alice subscriber')
  }

  const bobUpdate = await request(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    cookie: bob.cookie,
    csrfToken: bob.csrfToken,
    body: { name: 'Hacked', subject: '', body: '' },
  })

  const bobDelete = await request(`/api/subscribers/${subscriberId}`, {
    method: 'DELETE',
    cookie: bob.cookie,
    csrfToken: bob.csrfToken,
  })

  if (bobUpdate.status !== 404) {
    throw new Error(`Expected Bob campaign update 404, got ${bobUpdate.status}`)
  }

  if (bobDelete.status !== 404) {
    throw new Error(`Expected Bob subscriber delete 404, got ${bobDelete.status}`)
  }

  console.log('Isolation checks passed for two accounts.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
