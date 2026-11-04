const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

/**
 * Returns true when a URL is safe to use as a link href.
 * Rejects javascript:, data:, and other non-http(s)/mailto schemes.
 */
export function isValidLinkUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false

  const value = rawUrl.trim()
  if (!value) return false

  try {
    const parsed = new URL(value, window.location.origin)

    if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) {
      return true
    }

    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

export function normalizeLinkUrl(rawUrl) {
  const value = rawUrl.trim()
  if (!value) return ''

  if (/^(https?:\/\/|mailto:)/i.test(value)) {
    return value
  }

  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) {
    return value
  }

  return `https://${value}`
}
