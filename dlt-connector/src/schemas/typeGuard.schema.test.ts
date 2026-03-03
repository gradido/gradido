import { describe, expect, it } from 'bun:test'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { memoSchema, MEMO_MAX_CHARS, MEMO_MIN_CHARS, uuidv4Schema } from './typeGuard.schema'

describe('typeGuard.schema', () => {
  describe('Uuidv4', () => {
    const uuidv4String = uuidv4()

    it('from string to uuidv4', () => {
      const uuidv4Value = v.parse(uuidv4Schema, uuidv4String)
      expect(uuidv4Value.toString()).toBe(uuidv4String)
    })
  })
  describe('Basic Type Schemas for transactions', () => {
    describe('Memo', () => {
      it('min length', () => {
        const memoValue = 'memo1'
        const memoValueParsed = v.parse(memoSchema, memoValue)
        expect(memoValueParsed.toString()).toBe(memoValue)
      })
      it('max length', () => {
        const memoValue = 's'.repeat(MEMO_MAX_CHARS)
        const memoValueParsed = v.parse(memoSchema, memoValue)
        expect(memoValueParsed.toString()).toBe(memoValue)
      })
      it('to short', () => {
        const memoValue = 'memo'
        expect(() => v.parse(memoSchema, memoValue)).toThrow(new Error(`expect string length >= ${MEMO_MIN_CHARS}`))
      })
      it('to long', () => {
        const memoValue = 's'.repeat(MEMO_MAX_CHARS + 1)
        expect(() => v.parse(memoSchema, memoValue)).toThrow(
          new Error(`expect string length <= ${MEMO_MAX_CHARS}`),
        )
      })
    })
  })
})
