import { describe, expect, it } from 'bun:test'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { blankAsNull, emailSchema, uint32Schema, uuidv4Schema } from './base.schema'

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

describe('email schema', () => {
  // zod 3 runs trim, toLowerCase and the email check in the order they are chained: trimmed
  // first, or an address with a blank around it is refused before it would have been trimmed.
  it('trims and lowercases before it checks', () => {
    expect(emailSchema.parse(' Bernd@Example.COM ')).toBe('bernd@example.com')
    expect(emailSchema.parse('bernd@example.com\t')).toBe('bernd@example.com')
  })

  it('refuses what is no address, blank or not', () => {
    expect(emailSchema.safeParse(' bernd ').success).toBe(false)
    expect(emailSchema.safeParse('   ').success).toBe(false)
  })
})

describe('blankAsNull', () => {
  const schema = blankAsNull(z.string().min(3, 'too short'))

  it('takes a blank string as not given', () => {
    for (const blank of ['', ' ', '\t\n']) {
      expect(schema.parse(blank)).toBeNull()
    }
  })

  it('lets null and undefined through, as an optional field does', () => {
    expect(schema.parse(null)).toBeNull()
    expect(schema.parse(undefined)).toBeUndefined()
  })

  it('checks everything else with the schema, and its own message', () => {
    expect(schema.parse('abc')).toBe('abc')
    const result = schema.safeParse('ab')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('too short')
    }
  })
})
