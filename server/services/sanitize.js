import sanitizeHtmlLib from 'sanitize-html'

const OPTIONS = {
  allowedTags: [
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
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    span: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
  },
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return sanitizeHtmlLib(html, OPTIONS)
}

export function htmlToPlainPreview(html, maxLength = 140) {
  const text = sanitizeHtml(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}
