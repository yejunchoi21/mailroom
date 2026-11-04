import { sanitizeHtml, htmlToPlainPreview } from './sanitizeHtml.js'

export const DRAFTS_STORAGE_KEY = 'mailroom.drafts.v1'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `draft-${crypto.randomUUID()}`
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyDraft() {
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: '',
    subject: '',
    body: '',
    preview: '',
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    source: 'user',
  }
}

export function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return null

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null

  const body = sanitizeHtml(typeof raw.body === 'string' ? raw.body : '')
  const subject = typeof raw.subject === 'string' ? raw.subject : ''
  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  const updatedAt =
    typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    subject,
    body,
    preview:
      typeof raw.preview === 'string' && raw.preview
        ? raw.preview
        : htmlToPlainPreview(body || subject),
    status: 'Draft',
    createdAt,
    updatedAt,
    source: 'user',
  }
}

export function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizeDraft).filter(Boolean)
  } catch {
    return []
  }
}

export function saveDrafts(drafts) {
  const normalized = drafts.map(normalizeDraft).filter(Boolean)
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function upsertDraft(drafts, draftInput) {
  const now = new Date().toISOString()
  const existingIndex = drafts.findIndex((draft) => draft.id === draftInput.id)

  const body = sanitizeHtml(draftInput.body || '')
  const nextDraft = normalizeDraft({
    ...draftInput,
    body,
    preview: htmlToPlainPreview(body || draftInput.subject || ''),
    status: 'Draft',
    source: 'user',
    createdAt:
      existingIndex >= 0 ? drafts[existingIndex].createdAt : draftInput.createdAt || now,
    updatedAt: now,
  })

  if (!nextDraft) {
    return { drafts, draft: null, error: 'Campaign name is required.' }
  }

  const nextDrafts =
    existingIndex >= 0
      ? drafts.map((draft, index) => (index === existingIndex ? nextDraft : draft))
      : [nextDraft, ...drafts]

  return {
    drafts: saveDrafts(nextDrafts),
    draft: nextDraft,
    error: null,
  }
}

export function deleteDraft(drafts, draftId) {
  const nextDrafts = drafts.filter((draft) => draft.id !== draftId)
  return saveDrafts(nextDrafts)
}
