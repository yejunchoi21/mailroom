import { describe, expect, it } from 'vitest'
import { classifyCsvRow, classifyCsvRows, parseSubscriberCsv } from './csvImport.js'

const existing = [
  {
    id: 'sub-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    emailKey: 'ada@example.com',
    status: 'Subscribed',
  },
  {
    id: 'sub-2',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    emailKey: 'grace@example.com',
    status: 'Unsubscribed',
  },
]

describe('classifyCsvRow', () => {
  it('marks rows with valid new emails as valid', () => {
    const result = classifyCsvRow(
      { name: 'Alan Turing', email: 'alan@example.com', __lineNumber: 2 },
      existing,
    )

    expect(result.type).toBe('valid')
    expect(result.email).toBe('alan@example.com')
  })

  it('rejects invalid emails', () => {
    const result = classifyCsvRow(
      { name: 'Broken', email: 'not-an-email', __lineNumber: 3 },
      existing,
    )

    expect(result.type).toBe('invalid')
    expect(result.reason).toBe('Invalid email')
  })

  it('rejects missing name or email', () => {
    expect(
      classifyCsvRow({ name: '', email: 'a@example.com', __lineNumber: 4 }, existing)
        .type,
    ).toBe('invalid')

    expect(
      classifyCsvRow({ name: 'No Email', email: '', __lineNumber: 5 }, existing)
        .type,
    ).toBe('invalid')
  })

  it('detects duplicates regardless of capitalization', () => {
    const result = classifyCsvRow(
      { name: 'Ada Copy', email: 'ADA@example.com', __lineNumber: 6 },
      existing,
    )

    expect(result.type).toBe('duplicate')
    expect(result.reason).toBe('Email already exists')
  })

  it('never treats unsubscribed addresses as importable', () => {
    const result = classifyCsvRow(
      { name: 'Grace Copy', email: 'Grace@Example.com', __lineNumber: 7 },
      existing,
    )

    expect(result.type).toBe('duplicate')
    expect(result.existingStatus).toBe('Unsubscribed')
    expect(result.reason).toMatch(/not be resubscribed/i)
  })

  it('flags duplicate emails within the same CSV file', () => {
    const seen = new Set()
    const first = classifyCsvRow(
      { name: 'One', email: 'new@example.com', __lineNumber: 2 },
      existing,
      seen,
    )
    const second = classifyCsvRow(
      { name: 'Two', email: 'NEW@example.com', __lineNumber: 3 },
      existing,
      seen,
    )

    expect(first.type).toBe('valid')
    expect(second.type).toBe('duplicate')
    expect(second.reason).toMatch(/in this file/i)
  })
})

describe('classifyCsvRows', () => {
  it('splits valid, invalid, and duplicate rows', () => {
    const result = classifyCsvRows(
      [
        { Name: 'New Person', Email: 'new@example.com' },
        { Name: 'Bad', Email: 'bad-email' },
        { Name: 'Ada Again', Email: 'ada@example.com' },
        { Name: 'Grace Again', Email: 'grace@example.com' },
      ],
      existing,
    )

    expect(result.valid).toHaveLength(1)
    expect(result.invalid).toHaveLength(1)
    expect(result.duplicates).toHaveLength(2)
    expect(result.duplicates.some((row) => row.existingStatus === 'Unsubscribed')).toBe(
      true,
    )
  })
})

describe('parseSubscriberCsv', () => {
  it('parses name and email headers with Papa Parse', async () => {
    const csv = 'name,email\nKatherine Johnson,katherine@example.com\n'
    const parsed = await parseSubscriberCsv(csv)

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0].name).toBe('Katherine Johnson')
    expect(parsed.rows[0].email).toBe('katherine@example.com')
  })
})
