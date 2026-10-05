// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { createHmac } from 'node:crypto'
import { jwtVerify } from 'jose'
import { Duration } from '../data'
import { AuthSigningType } from '../enum'
import { createUserToken } from './createTokens.jwt'
import {
  decodeSegment,
  TEST_AUDIENCE,
  TEST_GRADIDO_ID,
  TEST_ISSUER,
  TEST_NOW,
  TEST_NOW_SECONDS,
  testAuthContext,
  testSecretKey,
  testSigner,
} from './testHelpers.jwt'

describe('createUserToken', () => {
  beforeEach(() => {
    setSystemTime(TEST_NOW)
  })
  afterEach(() => {
    setSystemTime()
  })

  it('builds a compact jwt of three base64url segments', () => {
    const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
    const segments = token.split('.')
    expect(segments).toHaveLength(3)
    for (const segment of segments) {
      expect(segment).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })

  it('writes the header of the signer in the auth context', () => {
    const [hs256] = createUserToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    const [hs512] = createUserToken(
      TEST_GRADIDO_ID,
      testAuthContext({ signer: testSigner(undefined, AuthSigningType.HMAC512) }),
    ).split('.')
    expect(decodeSegment(hs256)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeSegment(hs512)).toEqual({ alg: 'HS512', typ: 'JWT' })
  })

  it('names issuer and audience of the auth context and the user as subject', () => {
    const [, payload] = createUserToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    expect(decodeSegment(payload)).toMatchObject({
      iss: TEST_ISSUER,
      aud: TEST_AUDIENCE,
      sub: TEST_GRADIDO_ID,
    })
  })

  it('expires after the duration of the auth context, counted from now', () => {
    const [, payload] = createUserToken(
      TEST_GRADIDO_ID,
      testAuthContext({ duration: Duration.hours(2) }),
    ).split('.')
    expect(decodeSegment(payload).exp).toBe(TEST_NOW_SECONDS + 2 * 60 * 60)
  })

  it('signs header and payload with the HMAC of the signer', () => {
    const [header, payload, signature] = createUserToken(TEST_GRADIDO_ID, testAuthContext()).split(
      '.',
    )
    const expected = createHmac('sha256', testSecretKey())
      .update(`${header}.${payload}`)
      .digest('base64url')
    expect(signature).toBe(expected)
  })

  it('signs differently with another key', () => {
    const tokenA = createUserToken(TEST_GRADIDO_ID, testAuthContext())
    const tokenB = createUserToken(
      TEST_GRADIDO_ID,
      testAuthContext({ signer: testSigner('another secret') }),
    )
    expect(tokenA.split('.')[1]).toBe(tokenB.split('.')[1])
    expect(tokenA.split('.')[2]).not.toBe(tokenB.split('.')[2])
  })

  it('is accepted by a standard jwt library', async () => {
    const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
    const { payload, protectedHeader } = await jwtVerify(
      token,
      new TextEncoder().encode('secret123'),
      { issuer: TEST_ISSUER, audience: TEST_AUDIENCE, currentDate: TEST_NOW },
    )
    expect(protectedHeader.alg).toBe('HS256')
    expect(payload.sub).toBe(TEST_GRADIDO_ID)
  })

  it('is issued now', () => {
    const [, payload] = createUserToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    expect(decodeSegment(payload).iat).toBe(TEST_NOW_SECONDS)
  })

  // the frontend counts the session from its own clock with `exp - iat` (frontend store.js)
  it('carries its lifetime as exp - iat', () => {
    const [, payload] = createUserToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    const { exp, iat } = decodeSegment(payload) as { exp: number; iat: number }
    expect(exp - iat).toBe(600)
  })

  it('throws for a subject that is neither a uuid v4 nor the dlt-connector', () => {
    expect(() => createUserToken('some-service', testAuthContext())).toThrow()
  })
})
