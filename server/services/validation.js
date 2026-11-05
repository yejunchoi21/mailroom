const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

export function isValidEmail(email) {
  const value = String(email || '').trim()
  if (!value || value.length > 254) return false
  return EMAIL_PATTERN.test(value)
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field]
    return value == null || String(value).trim() === ''
  })
  return missing
}
