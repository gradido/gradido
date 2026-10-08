import { describe, expect, it } from 'bun:test'
import { createSecretKey, generateKeyPairSync } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { Duration } from '../data/Duration'
import {
  blankAsNull,
  durationSchema,
  emailSchema,
  hexBytesSchema,
  nodeCryptoKeyObjectSchema,
  positiveIntegerSchema,
  uint32Schema,
  uuidv4Schema,
} from './base.schema'

describe('uuidv4 schema', () => {
  it('should validate uuidv4 (40x)', () => {
    for (let i = 0; i < 40; i++) {
      const uuid = uuidv4()
      expect(v.safeParse(uuidv4Schema, uuid).success).toBeTruthy()
    }
  })
})

describe('hexBytes schema', () => {
  it('turns hex into the bytes it spells, whatever the case and with a prefix', () => {
    for (const input of ['a51ef8ac', 'A51EF8AC', '0xa51ef8ac', '0ha51ef8ac']) {
      expect(v.parse(hexBytesSchema, input)).toEqual(Buffer.from('a51ef8ac', 'hex'))
    }
  })

  it('refuses what Buffer.from would read wrong', () => {
    for (const input of ['a51ef8a', 'a51ef8ag', '', 'xyz', ' a51ef8ac']) {
      expect(v.safeParse(hexBytesSchema, input).success).toBe(false)
    }
  })

  it('composes with a length in bytes', () => {
    const key = v.pipe(hexBytesSchema, v.length(16))
    expect(v.safeParse(key, 'a51ef8ac7ef1abf162fb7a65261acd7a').success).toBe(true)
    expect(v.safeParse(key, 'a51ef8ac').success).toBe(false)
  })
})

describe('uint32 schema', () => {
  it('should validate uint32 (40x)', () => {
    for (let i = 0; i < 40; i++) {
      const uint32 = Math.floor(Math.random() * 4294967295)
      expect(v.safeParse(uint32Schema, uint32).success).toBeTruthy()
    }
  })
  it('should validate 2092352810', () => {
    expect(v.safeParse(uint32Schema, 2092352810).success).toBeTruthy()
  })
})

describe('email schema', () => {
  // trim, toLowerCase and the email check run in the order of the pipe: trimmed first, or an
  // address with a blank around it is refused before it would have been trimmed.
  it('trims and lowercases before it checks', () => {
    expect(v.parse(emailSchema, ' Bernd@Example.COM ')).toBe('bernd@example.com')
    expect(v.parse(emailSchema, 'bernd@example.com\t')).toBe('bernd@example.com')
  })

  it('refuses what is no address, blank or not', () => {
    expect(v.safeParse(emailSchema, ' bernd ').success).toBe(false)
    expect(v.safeParse(emailSchema, '   ').success).toBe(false)
  })

  it('test punny code', () => {
    expect(v.safeParse(emailSchema, 'kontakt@xn--mller-gmbh-feb.de').success).toBe(true)
  })

  it.each([
    'bernd@example.com',
    'bernd.das.brot@example.com',
    'bernd+gradido@example.com',
    'bernd_brot-1@example.com',
    "o'brien@example.com",
    'bernd@mail.example.co.uk',
    'bernd@t-online.de',
    'bernd@123.example.com',
    'b@e.de',
  ])('accepts %s', (email) => {
    expect(v.parse(emailSchema, email)).toBe(email)
  })

  it.each([
    ['no @', 'bernd.example.com'],
    ['two @', 'bernd@brot@example.com'],
    ['nothing before the @', '@example.com'],
    ['nothing after the @', 'bernd@'],
    ['a blank inside', 'bernd brot@example.com'],
    ['a blank in the domain', 'bernd@exam ple.com'],
    ['a domain that begins with a hyphen', 'bernd@-example.com'],
    ['a domain that ends with a hyphen', 'bernd@example-.com'],
    ['a domain that begins with a dot', 'bernd@.example.com'],
    ['a domain that ends with a dot', 'bernd@example.com.'],
    ['two dots in a row in the domain', 'bernd@example..com'],
    ['an umlaut in the domain that is not written as punycode', 'bernd@müller.de'],
    ['an umlaut before the @', 'jürgen@example.com'],
    ['a name and angle brackets around the address', 'Bernd <bernd@example.com>'],
    ['the empty string', ''],
  ])('refuses %s', (_what, email) => {
    expect(v.safeParse(emailSchema, email).success).toBe(false)
  })

  it.each([[null], [undefined], [7], [{}], [['bernd@example.com']]])(
    'refuses %p, which is no string',
    (value) => {
      expect(v.safeParse(emailSchema, value).success).toBe(false)
    },
  )

  // Two hyphens in a row are what punycode has, so the rule cannot refuse them elsewhere.
  it('accepts two hyphens in a row in the domain', () => {
    expect(v.safeParse(emailSchema, 'bernd@t--online.de').success).toBe(true)
  })

  // What rfcEmail lets through and zod's rule did not: said here so that it is no surprise.
  it('asks for no top-level domain, and takes dots anywhere before the @', () => {
    expect(v.safeParse(emailSchema, 'bernd@localhost').success).toBe(true)
    expect(v.safeParse(emailSchema, '.bernd..brot.@example.com').success).toBe(true)
  })

  it('names no address in its message', () => {
    const result = v.safeParse(emailSchema, 'bernd.example.com')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe('Invalid email')
    }
  })
})

describe('blankAsNull', () => {
  const schema = blankAsNull(v.pipe(v.string(), v.minLength(3, 'too short')))

  it('takes a blank string as not given', () => {
    for (const blank of ['', ' ', '\t\n']) {
      expect(v.parse(schema, blank)).toBeNull()
    }
  })

  it('lets null and undefined through, as an optional field does', () => {
    expect(v.parse(schema, null)).toBeNull()
    expect(v.parse(schema, undefined)).toBeUndefined()
  })

  it('checks everything else with the schema, and its own message', () => {
    expect(v.parse(schema, 'abc')).toBe('abc')
    const result = v.safeParse(schema, 'ab')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe('too short')
    }
  })
})

describe('nodeCryptoKeyObject schema', () => {
  it('should accept secret, public and private key objects', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    expect(
      v.safeParse(nodeCryptoKeyObjectSchema, createSecretKey(Buffer.from('secret'))).success,
    ).toBe(true)
    expect(v.safeParse(nodeCryptoKeyObjectSchema, publicKey).success).toBe(true)
    expect(v.safeParse(nodeCryptoKeyObjectSchema, privateKey).success).toBe(true)
  })

  it('should reject raw key material', () => {
    expect(v.safeParse(nodeCryptoKeyObjectSchema, 'secret').success).toBe(false)
    expect(v.safeParse(nodeCryptoKeyObjectSchema, Buffer.from('secret')).success).toBe(false)
    expect(v.safeParse(nodeCryptoKeyObjectSchema, undefined).success).toBe(false)
  })
})

describe('duration schema', () => {
  it('should accept a Duration instance', () => {
    const duration = Duration.minutes(10)
    expect(v.parse(durationSchema, duration)).toBe(duration)
  })

  it('should reject anything that is no Duration instance', () => {
    expect(v.safeParse(durationSchema, '10m').success).toBe(false)
    expect(v.safeParse(durationSchema, 600).success).toBe(false)
    expect(v.safeParse(durationSchema, 600n).success).toBe(false)
    expect(v.safeParse(durationSchema, undefined).success).toBe(false)
  })
})

describe('positiveInteger schema', () => {
  it('should accept positive integers', () => {
    expect(v.safeParse(positiveIntegerSchema, 1).success).toBe(true)
    expect(v.safeParse(positiveIntegerSchema, 1767268800).success).toBe(true)
  })

  it('should reject zero, negative numbers, fractions and non-numbers', () => {
    expect(v.safeParse(positiveIntegerSchema, 0).success).toBe(false)
    expect(v.safeParse(positiveIntegerSchema, -1).success).toBe(false)
    expect(v.safeParse(positiveIntegerSchema, 1.5).success).toBe(false)
    expect(v.safeParse(positiveIntegerSchema, '1').success).toBe(false)
    expect(v.safeParse(positiveIntegerSchema, Number.NaN).success).toBe(false)
  })
})
