// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { createHmac, generateKeyPairSync } from 'node:crypto'
import { jwtVerify } from 'jose'
import { Duration } from '../data'
import { createFrontendLoginToken } from './createTokens.jwt'
import {
  decodeSegment,
  TEST_GRADIDO_ID,
  TEST_ISSUER,
  TEST_NOW,
  TEST_NOW_SECONDS,
  testAuthContext,
  testSecretKey,
} from './testHelpers.jwt'

describe('createFrontendLoginToken', () => {
  beforeEach(() => {
    setSystemTime(TEST_NOW)
  })
  afterEach(() => {
    setSystemTime()
  })

  it('builds a compact jwt of three base64url segments', () => {
    const token = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext())
    const segments = token.split('.')
    expect(segments).toHaveLength(3)
    for (const segment of segments) {
      expect(segment).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })

  it('writes a HS256 header', () => {
    const [header] = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    expect(decodeSegment(header)).toEqual({ alg: 'HS256', typ: 'JWT' })
  })

  it('names the community as issuer and audience and the user as subject', () => {
    const [, payload] = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    expect(decodeSegment(payload)).toMatchObject({
      iss: TEST_ISSUER,
      aud: TEST_ISSUER,
      sub: TEST_GRADIDO_ID,
    })
  })

  it('expires after the duration of the auth context, counted from now', () => {
    const [, payload] = createFrontendLoginToken(
      TEST_GRADIDO_ID,
      testAuthContext({ duration: Duration.hours(2) }),
    ).split('.')
    expect(decodeSegment(payload).exp).toBe(TEST_NOW_SECONDS + 2 * 60 * 60)
  })

  it('signs header and payload with HMAC-SHA256 of the signing key', () => {
    const [header, payload, signature] = createFrontendLoginToken(
      TEST_GRADIDO_ID,
      testAuthContext(),
    ).split('.')
    const expected = createHmac('sha256', testSecretKey())
      .update(`${header}.${payload}`)
      .digest('base64url')
    expect(signature).toBe(expected)
  })

  it('signs differently with another key', () => {
    const tokenA = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext())
    const tokenB = createFrontendLoginToken(
      TEST_GRADIDO_ID,
      testAuthContext({ signingKey: testSecretKey('another secret') }),
    )
    expect(tokenA.split('.')[1]).toBe(tokenB.split('.')[1])
    expect(tokenA.split('.')[2]).not.toBe(tokenB.split('.')[2])
  })

  it('is accepted by a standard jwt library', async () => {
    const token = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext())
    const { payload, protectedHeader } = await jwtVerify(
      token,
      new TextEncoder().encode('secret123'),
      { issuer: TEST_ISSUER, audience: TEST_ISSUER, currentDate: TEST_NOW },
    )
    expect(protectedHeader.alg).toBe('HS256')
    expect(payload.sub).toBe(TEST_GRADIDO_ID)
  })

  it('is issued now', () => {
    const [, payload] = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    expect(decodeSegment(payload).iat).toBe(TEST_NOW_SECONDS)
  })

  // the frontend counts the session from its own clock with `exp - iat` (frontend store.js)
  it('carries its lifetime as exp - iat', () => {
    const [, payload] = createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext()).split('.')
    const { exp, iat } = decodeSegment(payload) as { exp: number; iat: number }
    expect(exp - iat).toBe(600)
  })

  it('throws for a subject that is neither a uuid v4 nor the dlt-connector', () => {
    expect(() => createFrontendLoginToken('some-service', testAuthContext())).toThrow()
  })

  it('throws for a signing key that is no secret key', () => {
    const { publicKey } = generateKeyPairSync('ed25519')
    expect(() =>
      createFrontendLoginToken(TEST_GRADIDO_ID, testAuthContext({ signingKey: publicKey })),
    ).toThrow()
  })
})
