// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { isSchemaMismatch } from './AppOutdated.logic'

describe('isSchemaMismatch', () => {
  it('is so where one of the errors is a failed validation', () => {
    expect(
      isSchemaMismatch([
        { extensions: { code: 'FORBIDDEN' } },
        { extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } },
      ]),
    ).toBe(true)
  })

  it('is not so for any other failure', () => {
    expect(isSchemaMismatch([{ extensions: { code: 'FORBIDDEN' } }, {}])).toBe(false)
  })
})
