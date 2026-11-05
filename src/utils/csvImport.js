import Papa from 'papaparse'
import { isValidEmail, normalizeEmail } from './emailValidation.js'
import { findSubscriberByEmail } from './subscriberStorage.js'

function pickField(row, keys) {
  for (const key of keys) {
    const match = Object.keys(row).find(
      (header) => header.trim().toLowerCase() === key,
    )
    if (match != null && row[match] != null) {
      return String(row[match]).trim()
    }
  }
  return ''
}

/**
 * Classify a single CSV row against existing subscribers.
 * Pure helper used by import preview and tests.
 */
export function classifyCsvRow(row, existingSubscribers, seenEmails = new Set()) {
  const name = pickField(row, ['name', 'full name', 'fullname'])
  const email = pickField(row, ['email', 'email address', 'e-mail'])
  const lineNumber = row.__lineNumber

  if (!name && !email) {
    return {
      type: 'invalid',
      reason: 'Missing name and email',
      name,
      email,
      lineNumber,
    }
  }

  if (!name) {
    return {
      type: 'invalid',
      reason: 'Missing name',
      name,
      email,
      lineNumber,
    }
  }

  if (!email) {
    return {
      type: 'invalid',
      reason: 'Missing email',
      name,
      email,
      lineNumber,
    }
  }

  if (!isValidEmail(email)) {
    return {
      type: 'invalid',
      reason: 'Invalid email',
      name,
      email,
      lineNumber,
    }
  }

  const emailKey = normalizeEmail(email)

  if (seenEmails.has(emailKey)) {
    return {
      type: 'duplicate',
      reason: 'Duplicate email in this file',
      name,
      email,
      lineNumber,
      existingStatus: null,
    }
  }

  seenEmails.add(emailKey)

  const existing = findSubscriberByEmail(existingSubscribers, email)
  if (existing) {
    if (existing.status === 'Unsubscribed') {
      return {
        type: 'duplicate',
        reason: 'Already unsubscribed — will not be resubscribed',
        name,
        email,
        lineNumber,
        existingStatus: 'Unsubscribed',
      }
    }

    return {
      type: 'duplicate',
      reason: 'Email already exists',
      name,
      email,
      lineNumber,
      existingStatus: existing.status,
    }
  }

  return {
    type: 'valid',
    name,
    email,
    lineNumber,
    status: 'Subscribed',
  }
}

export function classifyCsvRows(rows, existingSubscribers) {
  const seenEmails = new Set()
  const valid = []
  const invalid = []
  const duplicates = []

  rows.forEach((row, index) => {
    const classified = classifyCsvRow(
      { ...row, __lineNumber: index + 2 },
      existingSubscribers,
      seenEmails,
    )

    if (classified.type === 'valid') valid.push(classified)
    else if (classified.type === 'invalid') invalid.push(classified)
    else duplicates.push(classified)
  })

  return { valid, invalid, duplicates }
}

export function parseSubscriberCsv(text) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors?.length) {
          const fatal = results.errors.find((error) => error.type === 'Delimiter')
          if (fatal) {
            reject(new Error(fatal.message || 'Could not parse CSV file.'))
            return
          }
        }

        const rows = (results.data || []).filter((row) =>
          Object.values(row).some((value) => String(value || '').trim()),
        )

        resolve({
          rows,
          meta: results.meta,
          errors: results.errors || [],
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export async function previewSubscriberCsv(text, existingSubscribers) {
  const parsed = await parseSubscriberCsv(text)
  const classified = classifyCsvRows(parsed.rows, existingSubscribers)

  return {
    ...classified,
    rowCount: parsed.rows.length,
    fields: parsed.meta?.fields || [],
  }
}
