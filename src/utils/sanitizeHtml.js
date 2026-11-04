import DOMPurify from 'dompurify'
import { isValidLinkUrl } from './linkValidation.js'

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
}

let hooksRegistered = false

function registerHooks() {
  if (hooksRegistered || typeof window === 'undefined') return

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return

    const href = node.getAttribute('href')
    if (!href || !isValidLinkUrl(href)) {
      node.removeAttribute('href')
    }

    node.setAttribute('rel', 'noopener noreferrer')
    node.setAttribute('target', '_blank')
  })

  hooksRegistered = true
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return ''
  registerHooks()
  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}

export function htmlToPlainPreview(html, maxLength = 140) {
  const sanitized = sanitizeHtml(html)
  const text = sanitized
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}
