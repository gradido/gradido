import { describe, expect, it } from 'bun:test'
import { uuidv4Schema, uint32Schema } from './base.schema'
import { v4 as uuidv4 } from 'uuid'

describe('uuidv4 schema', () => {
  it('should validate uuidv4 (40x)', () => {
    for (let i = 0; i < 40; i++) {
      const uuid = uuidv4()
      expect(uuidv4Schema.safeParse(uuid).success).toBeTruthy()
    }
  })
})

describe('uint32 schema', () => {
  it('should validate uint32 (40x)', () => {
    for (let i = 0; i < 40; i++) {
      const uint32 = Math.floor(Math.random() * 4294967295)
      expect(uint32Schema.safeParse(uint32).success).toBeTruthy()
    }
  })
  it('should validate 2092352810', () => {
    expect(uint32Schema.safeParse(2092352810).success).toBeTruthy()
  })
})
