import { sanitizeHtml } from './sanitize.js'

/**
 * Build email-safe HTML and plain text from editor HTML.
 */
export function buildEmailContent({ subject, bodyHtml, campaignName }) {
  const safeBody = sanitizeHtml(bodyHtml || '')
  const safeSubject = String(subject || campaignName || 'Mailroom preview').trim()

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeText(safeSubject)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f5f5f7;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d2d2d7;border-radius:12px;">
      <tr>
        <td style="padding:24px;">
          ${safeBody || '<p style="margin:0;color:#6e6e73;"><em>No message body.</em></p>'}
        </td>
      </tr>
    </table>
    <p style="max-width:640px;margin:16px auto 0;font-size:12px;color:#86868b;text-align:center;">
      Sent as a Mailroom test/scheduled preview to your account email only.
    </p>
  </body>
</html>`

  const text = htmlToPlainText(safeBody || 'No message body.')

  return {
    subject: safeSubject || 'Mailroom preview',
    html,
    text,
  }
}

export function htmlToPlainText(html) {
  return sanitizeHtml(html || '')
    .replace(/<\/(p|div|h1|h2|h3|li|br|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
