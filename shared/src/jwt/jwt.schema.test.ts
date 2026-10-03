// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { Duration } from '../data'
import { authContextSchema, hmacKeyObjectSchema, jwtPayloadSchema } from './jwt.schema'
import { TEST_ISSUER, testSecretKey, validTestPayload } from './testHelpers.jwt'

describe('jwtPayloadSchema', () => {
  it('accepts the mandatory claims', () => {
    expect(jwtPayloadSchema.safeParse(validTestPayload()).success).toBe(true)
  })

  it('accepts the optional claims iat and jti', () => {
    const payload = validTestPayload({ iat: 1, jti: 'b0a4a1f5-8f4e-4b0c-9a3e-2d5c6f7a8b9c' })
    expect(jwtPayloadSchema.safeParse(payload).success).toBe(true)
  })

  it('accepts the dlt-connector as subject', () => {
    expect(jwtPayloadSchema.safeParse(validTestPayload({ sub: 'dlt-connector' })).success).toBe(
      true,
    )
  })

  it('accepts jti: null', () => {
    expect(jwtPayloadSchema.safeParse(validTestPayload({ jti: null })).success).toBe(true)
  })

  it.each(['iss', 'sub', 'aud', 'exp'])('rejects a payload without %s', (claim) => {
    const payload = validTestPayload()
    delete payload[claim]
    expect(jwtPayloadSchema.safeParse(payload).success).toBe(false)
  })

  it.each([
    ['iss', 'urn-less text'],
    ['aud', 'urn-less text'],
    ['sub', 'some-service'],
    ['exp', 0],
    ['sub', 'c56a4180-65aa-12d3-a456-426614174000'], // uuid, but not version 4
    ['exp', -1],
    ['exp', 1.5],
    ['exp', '1767268800'],
    ['iat', -1],
    ['jti', 'not a uuid'],
  ])('rejects %s = %p', (claim, value) => {
    expect(jwtPayloadSchema.safeParse(validTestPayload({ [claim]: value })).success).toBe(false)
  })

  it('drops claims it does not know', () => {
    const parsed = jwtPayloadSchema.parse(validTestPayload({ 'urn:gradido:claim': true }))
    expect(parsed).not.toHaveProperty('urn:gradido:claim')
  })
})

describe('hmacKeyObjectSchema', () => {
  it('accepts a secret key', () => {
    expect(hmacKeyObjectSchema.safeParse(testSecretKey()).success).toBe(true)
  })

  it('rejects the keys of an asymmetric key pair', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    expect(hmacKeyObjectSchema.safeParse(publicKey).success).toBe(false)
    expect(hmacKeyObjectSchema.safeParse(privateKey).success).toBe(false)
  })

  it.each(['secret123', Buffer.from('secret123'), null, undefined])(
    'rejects %p, which is no KeyObject',
    (value) => {
      expect(hmacKeyObjectSchema.safeParse(value).success).toBe(false)
    },
  )
})

describe('authContextSchema', () => {
  const valid = {
    issuer: TEST_ISSUER,
    signingKey: testSecretKey(),
    duration: Duration.minutes(10),
  }

  it('accepts issuer, secret key and duration', () => {
    const parsed = authContextSchema.parse(valid)
    expect(parsed.issuer).toBe(TEST_ISSUER)
    expect(parsed.signingKey).toBe(valid.signingKey)
    expect(parsed.duration).toBe(valid.duration)
  })

  it('rejects an issuer that is no url', () => {
    expect(authContextSchema.safeParse({ ...valid, issuer: 'community' }).success).toBe(false)
  })

  // the kind of key is left to the function that signs: hmacKeyObjectSchema for HS256
  it('accepts a key object of any type as signing key', () => {
    const { privateKey } = generateKeyPairSync('ed25519')
    expect(authContextSchema.safeParse({ ...valid, signingKey: privateKey }).success).toBe(true)
  })

  it('rejects a signing key given as plain string', () => {
    expect(authContextSchema.safeParse({ ...valid, signingKey: 'secret123' }).success).toBe(false)
  })

  it('rejects a duration given as string instead of a Duration', () => {
    expect(authContextSchema.safeParse({ ...valid, duration: '10m' }).success).toBe(false)
  })
})
