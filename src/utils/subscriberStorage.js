import { isValidEmail, normalizeEmail } from './emailValidation.js'

export const SUBSCRIBERS_STORAGE_KEY = 'mailroom.subscribers.v1'
export const SUBSCRIBER_STATUSES = ['Subscribed', 'Unsubscribed']

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sub-${crypto.randomUUID()}`
  }
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptySubscriber() {
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: '',
    email: '',
    status: 'Subscribed',
    dateAdded: now,
    updatedAt: now,
    source: 'manual',
    isTestData: true,
  }
}

export function normalizeSubscriber(raw) {
  if (!raw || typeof raw !== 'object') return null

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim() : ''

  if (!name || !isValidEmail(email)) return null

  const status =
    raw.status === 'Unsubscribed' ? 'Unsubscribed' : 'Subscribed'
  const dateAdded =
    typeof raw.dateAdded === 'string' ? raw.dateAdded : new Date().toISOString()

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    email,
    emailKey: normalizeEmail(email),
    status,
    dateAdded,
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : dateAdded,
    source: raw.source === 'import' ? 'import' : 'manual',
    isTestData: raw.isTestData !== false,
  }
}

export function loadSubscribers() {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizeSubscriber).filter(Boolean)
  } catch {
    return []
  }
}

export function saveSubscribers(subscribers) {
  const normalized = subscribers.map(normalizeSubscriber).filter(Boolean)
  localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function findSubscriberByEmail(subscribers, email) {
  const key = normalizeEmail(email)
  return subscribers.find((subscriber) => subscriber.emailKey === key) || null
}

export function upsertSubscriber(subscribers, input, { allowStatusChange = true } = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim() : ''

  if (!name) {
    return { subscribers, subscriber: null, error: 'Name is required.' }
  }

  if (!isValidEmail(email)) {
    return {
      subscribers,
      subscriber: null,
      error: 'Enter a valid email address.',
    }
  }

  const existingById =
    input.id != null
      ? subscribers.find((subscriber) => subscriber.id === input.id)
      : null
  const existingByEmail = findSubscriberByEmail(subscribers, email)

  if (existingByEmail && existingByEmail.id !== existingById?.id) {
    return {
      subscribers,
      subscriber: null,
      error: 'A subscriber with this email already exists.',
    }
  }

  const now = new Date().toISOString()
  let nextStatus = input.status === 'Unsubscribed' ? 'Unsubscribed' : 'Subscribed'

  if (existingById && !allowStatusChange) {
    nextStatus = existingById.status
  }

  const nextSubscriber = normalizeSubscriber({
    id: existingById?.id || input.id || createId(),
    name,
    email,
    status: nextStatus,
    dateAdded: existingById?.dateAdded || input.dateAdded || now,
    updatedAt: now,
    source: existingById?.source || input.source || 'manual',
    isTestData: existingById?.isTestData ?? input.isTestData ?? true,
  })

  const nextSubscribers = existingById
    ? subscribers.map((subscriber) =>
        subscriber.id === existingById.id ? nextSubscriber : subscriber,
      )
    : [nextSubscriber, ...subscribers]

  return {
    subscribers: saveSubscribers(nextSubscribers),
    subscriber: nextSubscriber,
    error: null,
  }
}

export function deleteSubscriber(subscribers, subscriberId) {
  const next = subscribers.filter((subscriber) => subscriber.id !== subscriberId)
  return saveSubscribers(next)
}

export function applyImportRows(subscribers, validRows) {
  const next = [...subscribers]
  let added = 0
  let skippedUnsubscribed = 0
  let skippedDuplicates = 0

  for (const row of validRows) {
    const existing = findSubscriberByEmail(next, row.email)

    if (existing) {
      if (existing.status === 'Unsubscribed') {
        skippedUnsubscribed += 1
      } else {
        skippedDuplicates += 1
      }
      continue
    }

    const created = normalizeSubscriber({
      name: row.name,
      email: row.email,
      status: 'Subscribed',
      source: 'import',
      isTestData: true,
      dateAdded: new Date().toISOString(),
    })

    if (created) {
      next.unshift(created)
      added += 1
    }
  }

  return {
    subscribers: saveSubscribers(next),
    added,
    skippedUnsubscribed,
    skippedDuplicates,
  }
}
