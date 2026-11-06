/**
 * Convert a wall-clock date/time in a named IANA time zone to a UTC Date.
 * dateStr: YYYY-MM-DD, timeStr: HH:MM
 */
export function zonedLocalToUtc(dateStr, timeStr, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Date must use YYYY-MM-DD.')
  }
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error('Time must use HH:MM.')
  }
  if (!timeZone || typeof timeZone !== 'string') {
    throw new Error('Time zone is required.')
  }

  // Validate time zone early.
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
  } catch {
    throw new Error('Unrecognized time zone.')
  }

  const asUtc = new Date(`${dateStr}T${timeStr}:00.000Z`)
  if (Number.isNaN(asUtc.getTime())) {
    throw new Error('Invalid date or time.')
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(asUtc)

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )

  const asLocalMs = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  const offset = asLocalMs - asUtc.getTime()
  return new Date(asUtc.getTime() - offset)
}

export function assertFutureUtc(date, now = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid scheduled time.')
  }
  if (date.getTime() <= now.getTime()) {
    throw new Error('Schedule time must be in the future.')
  }
}
