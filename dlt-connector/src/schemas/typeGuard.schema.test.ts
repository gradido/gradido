import { describe, it, expect } from 'bun:test'
import { uuidv4Schema, topicIndexSchema, uuid4HashSchema, memoSchema } from './typeGuard.schema'
import * as v from 'valibot'
import { v4 as uuidv4 } from 'uuid'
import { MemoryBlock } from 'gradido-blockchain-js'

describe('typeGuard.schema', () => {
  describe('Uuidv4', () => {
    const uuidv4String = uuidv4()
    const uuidv4Hash = MemoryBlock.fromHex(uuidv4String.replace(/-/g, '')).calculateHash()

    it('from string to uuidv4', () => {
      const uuidv4Value = v.parse(uuidv4Schema, uuidv4String)
      expect(uuidv4Value.toString()).toBe(uuidv4String)
    })

    it('from uuidv4 to hash', () => {
      const uuidv4Value = v.parse(uuidv4Schema, uuidv4String)
      const uuidv4HashParsed = v.parse(uuid4HashSchema, uuidv4Value)
      expect(uuidv4HashParsed.copyAsString()).toBe(uuidv4Hash.copyAsString())
    })

    it('from uuidv4 string to hash', () => {
      const uuidv4HashParsed = v.parse(uuid4HashSchema, uuidv4String)
      expect(uuidv4HashParsed.copyAsString()).toBe(uuidv4Hash.copyAsString())
    })

    it('from uuidv4 hash to topicIndex (hash in hex format', () => {
      const uuidv4HashParsed = v.parse(uuid4HashSchema, uuidv4String)
      const topicIndex = v.parse(topicIndexSchema, uuidv4HashParsed)
      expect(topicIndex.toString()).toBe(uuidv4Hash.convertToHex())
    })

    it('from uuidv4 to topicIndex (hash in hex format)', () => {
      const uuidv4Value = v.parse(uuidv4Schema, uuidv4String)
      const topicIndex = v.parse(topicIndexSchema, uuidv4Value)
      expect(topicIndex.toString()).toBe(uuidv4Hash.convertToHex())
    })

    it('from uuidv4 string to topicIndex (hash in hex format)', () => {
      const topicIndex = v.parse(topicIndexSchema, uuidv4String)
      expect(topicIndex.toString()).toBe(uuidv4Hash.convertToHex())
    })
  })
  describe('Basic Type Schemas for transactions', () => {
      describe('Memo', () => {
        it('min length',  () => {
          const memoValue = 'memo1'
          const memoValueParsed = v.parse(memoSchema, memoValue)
          expect(memoValueParsed.toString()).toBe(memoValue)
        })
        it('max length', () => {
          const memoValue = 's'.repeat(255)
          const memoValueParsed = v.parse(memoSchema, memoValue)
          expect(memoValueParsed.toString()).toBe(memoValue)
        })
        it('to short', () => {
          const memoValue = 'memo'
          expect(() => v.parse(memoSchema, memoValue)).toThrow(new Error('expect string length >= 5'))
        })
        it('to long', () => {
          const memoValue = 's'.repeat(256)
          expect(() => v.parse(memoSchema, memoValue)).toThrow(new Error('expect string length <= 255'))
        })
      })
    })
})