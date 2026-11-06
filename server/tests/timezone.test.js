import { describe, expect, it } from 'vitest'
import { assertFutureUtc, zonedLocalToUtc } from '../services/timezone.js'

describe('zonedLocalToUtc', () => {
  it('converts a known America/New_York winter time to UTC', () => {
    const utc = zonedLocalToUtc('2026-01-15', '09:30', 'America/New_York')
    expect(utc.toISOString()).toBe('2026-01-15T14:30:00.000Z')
  })

  it('rejects invalid time zones', () => {
    expect(() => zonedLocalToUtc('2026-01-15', '09:30', 'Mars/Phobos')).toThrow(
      /time zone/i,
    )
  })
})

describe('assertFutureUtc', () => {
  it('rejects past times', () => {
    expect(() =>
      assertFutureUtc(new Date('2020-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z')),
    ).toThrow(/future/i)
  })

  it('allows future times', () => {
    expect(() =>
      assertFutureUtc(new Date('2027-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z')),
    ).not.toThrow()
  })
})
