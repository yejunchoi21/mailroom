import { Resend } from 'resend'

let client
let sendImpl = null

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.')
  }
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not configured.')
  }

  return { apiKey, fromEmail }
}

function getClient() {
  if (!client) {
    const { apiKey } = getResendConfig()
    client = new Resend(apiKey)
  }
  return client
}

/** Used by tests to avoid real network calls. */
export function setEmailSender(fn) {
  sendImpl = fn
}

export function resetEmailSender() {
  sendImpl = null
  client = undefined
}

/**
 * Send one email through Resend (or a test double).
 * Returns { id } on acceptance. Provider acceptance is not confirmed delivery.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}) {
  const { fromEmail } = getResendConfig()

  if (sendImpl) {
    return sendImpl({
      from: fromEmail,
      to,
      subject,
      html,
      text,
      idempotencyKey,
    })
  }

  const resend = getClient()
  const { data, error } = await resend.emails.send(
    {
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    },
    {
      idempotencyKey,
    },
  )

  if (error) {
    throw new Error(error.message || 'Resend rejected the email.')
  }

  return { id: data?.id || null }
}
