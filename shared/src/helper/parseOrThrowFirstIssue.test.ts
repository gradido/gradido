// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { z } from 'zod'
import { parseOrThrowFirstIssue } from './parseOrThrowFirstIssue'

const schema = z.object({
  name: z.string().min(3, 'name too short'),
  age: z.number().min(0, 'age negative'),
})

describe('parseOrThrowFirstIssue', () => {
  it('returns the parsed value', () => {
    expect(parseOrThrowFirstIssue(schema, { name: 'Bernd', age: 3 })).toEqual({
      name: 'Bernd',
      age: 3,
    })
  })

  it('returns what the schema makes of the value', () => {
    expect(parseOrThrowFirstIssue(z.string().toLowerCase(), 'ABC')).toBe('abc')
  })

  it('throws with the message of the first issue only', () => {
    expect(() => parseOrThrowFirstIssue(schema, { name: 'B', age: -1 })).toThrow(
      new Error('name too short'),
    )
  })
})
