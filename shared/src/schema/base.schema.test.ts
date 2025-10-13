import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { uuidv4Schema, uint32Schema, buffer32Schema } from './base.schema'
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

describe('buffer32 schema', () => {
  it('should validate buffer', () => {
    const { publicKey } = generateKeyPairSync('ed25519')
    const buffer = publicKey.export({ type: 'spki', format: 'der' }).slice(-32)
    expect(Buffer.isBuffer(buffer)).toBeTruthy()
    expect(buffer.length).toBe(32)
    expect(buffer32Schema.safeParse(buffer).success).toBeTruthy()
  })

  it("shouldn't validate string", () => {
    expect(buffer32Schema.safeParse('3e1a2eecc95c48fedf47a522a8c77b91').success).toBeFalsy()
  })
})
