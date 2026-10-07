// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { Kind } from 'graphql'
import { DateTimeScalar } from './DateTime'

const INVALID = 'Provided date string is invalid and cannot be parsed'

describe('DateTimeScalar', () => {
  it('serializes a Date as its ISO string', () => {
    expect(DateTimeScalar.serialize(new Date('2026-08-12T10:15:30.000Z'))).toBe(
      '2026-08-12T10:15:30.000Z',
    )
  })

  it('serializes nothing but a Date', () => {
    expect(() => DateTimeScalar.serialize('2026-08-12T10:15:30.000Z')).toThrow()
  })

  it.each(['2026-08-12T10:15:30.000Z', '2026-08-12', '2026-08-12T12:15:30+02:00'])(
    'reads %s as a variable and as a literal',
    (value) => {
      const expected = new Date(value)
      expect(DateTimeScalar.parseValue(value)).toEqual(expected)
      expect(DateTimeScalar.parseLiteral({ kind: Kind.STRING, value }, {})).toEqual(expected)
    },
  )

  it.each(['gestern', '', '2026-13-45', 'null'])(
    'refuses %p, which is no date, as a variable and as a literal',
    (value) => {
      expect(() => DateTimeScalar.parseValue(value)).toThrow(INVALID)
      expect(() => DateTimeScalar.parseLiteral({ kind: Kind.STRING, value }, {})).toThrow(INVALID)
    },
  )

  // `new Date` would read each of these as a day of the month after.
  it.each([
    '2026-02-30',
    '2026-02-29',
    '2026-04-31',
    '2026-02-30T10:15:30.000Z',
    '2026-02-30T12:15:30+02:00',
    '2026-00-10',
    '2026-02-00',
  ])('refuses %s, a day the calendar does not have', (value) => {
    expect(() => DateTimeScalar.parseValue(value)).toThrow(INVALID)
    expect(() => DateTimeScalar.parseLiteral({ kind: Kind.STRING, value }, {})).toThrow(INVALID)
  })

  it.each(['2024-02-29', '2026-01-31', '2026-12-31T23:59:59.999Z', '2024-02-29T23:30:00-05:00'])(
    'reads %s, a last day its month does have',
    (value) => {
      expect(DateTimeScalar.parseValue(value)).toEqual(new Date(value))
    },
  )

  it('refuses a variable that is no string', () => {
    expect(() => DateTimeScalar.parseValue(1786529730000)).toThrow('supports only string values')
  })

  it('refuses a literal that is no string', () => {
    expect(() =>
      DateTimeScalar.parseLiteral({ kind: Kind.INT, value: '1786529730000' }, {}),
    ).toThrow('supports only')
  })
})
