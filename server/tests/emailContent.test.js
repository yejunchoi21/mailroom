import { describe, expect, it } from 'vitest'
import { buildEmailContent, htmlToPlainText } from '../services/emailContent.js'

describe('buildEmailContent', () => {
  it('sanitizes script tags from HTML and builds plain text', () => {
    const result = buildEmailContent({
      subject: 'Hello',
      bodyHtml: '<p>Hi <strong>there</strong></p><script>alert(1)</script>',
      campaignName: 'Demo',
    })

    expect(result.subject).toBe('Hello')
    expect(result.html).toContain('<strong>there</strong>')
    expect(result.html).not.toContain('<script>')
    expect(result.text).toContain('Hi there')
  })
})

describe('htmlToPlainText', () => {
  it('turns list items into plain lines', () => {
    expect(htmlToPlainText('<ul><li>One</li><li>Two</li></ul>')).toMatch(/One/)
    expect(htmlToPlainText('<ul><li>One</li><li>Two</li></ul>')).toMatch(/Two/)
  })
})
