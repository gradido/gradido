// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { parseOrThrowFirstIssue } from './parseOrThrowFirstIssue'

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(3, 'name too short')),
  age: v.pipe(v.number(), v.minValue(0, 'age negative')),
})

describe('parseOrThrowFirstIssue', () => {
  it('returns the parsed value', () => {
    expect(parseOrThrowFirstIssue(schema, { name: 'Bernd', age: 3 })).toEqual({
      name: 'Bernd',
      age: 3,
    })
  })

  it('returns what the schema makes of the value', () => {
    expect(parseOrThrowFirstIssue(v.pipe(v.string(), v.toLowerCase()), 'ABC')).toBe('abc')
  })

  it('throws with the message of the first issue only', () => {
    expect(() => parseOrThrowFirstIssue(schema, { name: 'B', age: -1 })).toThrow(
      new Error('name too short'),
    )
  })
})
