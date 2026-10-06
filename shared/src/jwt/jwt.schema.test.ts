// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { Duration } from '../data'
import { authContextSchema, jwtPayloadSchema } from './jwt.schema'
import {
  TEST_AUDIENCE,
  TEST_ISSUER,
  testSecretKey,
  testSigner,
  validTestPayload,
} from './testHelpers.jwt'

describe('jwtPayloadSchema', () => {
  it('accepts the mandatory claims', () => {
    expect(v.safeParse(jwtPayloadSchema, validTestPayload()).success).toBe(true)
  })

  it('accepts the optional claims iat and jti', () => {
    const payload = validTestPayload({ iat: 1, jti: 'b0a4a1f5-8f4e-4b0c-9a3e-2d5c6f7a8b9c' })
    expect(v.safeParse(jwtPayloadSchema, payload).success).toBe(true)
  })

  it('accepts the dlt-connector as subject', () => {
    expect(v.safeParse(jwtPayloadSchema, validTestPayload({ sub: 'dlt-connector' })).success).toBe(
      true,
    )
  })

  it('accepts jti: null', () => {
    expect(v.safeParse(jwtPayloadSchema, validTestPayload({ jti: null })).success).toBe(true)
  })

  it.each(['iss', 'sub', 'aud', 'exp'])('rejects a payload without %s', (claim) => {
    const payload = validTestPayload()
    delete payload[claim]
    expect(v.safeParse(jwtPayloadSchema, payload).success).toBe(false)
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
    expect(v.safeParse(jwtPayloadSchema, validTestPayload({ [claim]: value })).success).toBe(false)
  })

  it('drops claims it does not know', () => {
    const parsed = v.parse(jwtPayloadSchema, validTestPayload({ 'urn:gradido:claim': true }))
    expect(parsed).not.toHaveProperty('urn:gradido:claim')
  })
})

describe('authContextSchema', () => {
  const valid = {
    issuer: TEST_ISSUER,
    audience: TEST_AUDIENCE,
    duration: Duration.minutes(10),
    signer: testSigner(),
  }

  it('accepts issuer, audience, duration and signer', () => {
    const parsed = v.parse(authContextSchema, valid)
    expect(parsed.issuer).toBe(TEST_ISSUER)
    expect(parsed.audience).toBe(TEST_AUDIENCE)
    expect(parsed.duration).toBe(valid.duration)
    expect(parsed.signer).toBe(valid.signer)
  })

  it.each(['issuer', 'audience', 'duration', 'signer'])('rejects a context without %s', (key) => {
    const context: Record<string, unknown> = { ...valid }
    delete context[key]
    expect(v.safeParse(authContextSchema, context).success).toBe(false)
  })

  it('rejects an issuer that is no url', () => {
    expect(v.safeParse(authContextSchema, { ...valid, issuer: 'community' }).success).toBe(false)
  })

  it('rejects an audience that is no url', () => {
    expect(v.safeParse(authContextSchema, { ...valid, audience: 'hook/gms' }).success).toBe(false)
  })

  it('rejects a duration given as string instead of a Duration', () => {
    expect(v.safeParse(authContextSchema, { ...valid, duration: '10m' }).success).toBe(false)
  })

  it('rejects a secret or key object in place of the JwtSigner', () => {
    expect(v.safeParse(authContextSchema, { ...valid, signer: 'secret123' }).success).toBe(false)
    expect(v.safeParse(authContextSchema, { ...valid, signer: testSecretKey() }).success).toBe(
      false,
    )
  })
})
