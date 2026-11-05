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
