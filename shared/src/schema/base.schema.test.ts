import { describe, expect, it } from 'bun:test'
import { uuidv4Schema } from './base.schema'
import { v4 as uuidv4 } from 'uuid'

describe('uuidv4 schema', () => {
  it('should validate uuidv4 (40x)', () => {
    for (let i = 0; i < 40; i++) {
      const uuid = uuidv4()
      expect(uuidv4Schema.safeParse(uuid).success).toBeTruthy()
    }
  })
})
