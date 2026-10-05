// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { SignJWT } from 'jose'
import { JWT_LEEWAY_SECONDS } from '../const'
import { AuthSigningType } from '../enum'
import { createUserToken } from './createTokens.jwt'
import {
  base64UrlJson,
  signRawToken,
  signTestToken,
  TEST_AUDIENCE,
  TEST_GRADIDO_ID,
  TEST_ISSUER,
  TEST_NOW,
  TEST_NOW_SECONDS,
  testAuthContext,
  testSecretKey,
  testSigner,
  validTestPayload,
} from './testHelpers.jwt'
import { verifyUserToken } from './verifyTokens.jwt'

describe('verifyUserToken', () => {
  beforeEach(() => {
    setSystemTime(TEST_NOW)
  })
  afterEach(() => {
    setSystemTime()
  })

  describe('valid token', () => {
    it('returns the gradido id of a token from createUserToken', () => {
      const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
      expect(verifyUserToken(token, testAuthContext())).toBe(TEST_GRADIDO_ID)
    })

    // the token dlt-connector/src/client/backend/BackendClient.ts builds with jose
    it('returns "dlt-connector" for the token of the dlt-connector', async () => {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt(TEST_NOW_SECONDS)
        .setSubject('dlt-connector')
        .setIssuer(TEST_ISSUER)
        .setAudience(TEST_AUDIENCE)
        .setExpirationTime(TEST_NOW_SECONDS + 600)
        .sign(new TextEncoder().encode('secret123'))
      expect(verifyUserToken(token, testAuthContext())).toBe('dlt-connector')
    })

    it('accepts the optional claims iat and jti', () => {
      const token = signTestToken(
        validTestPayload({ iat: TEST_NOW_SECONDS, jti: 'b0a4a1f5-8f4e-4b0c-9a3e-2d5c6f7a8b9c' }),
      )
      expect(verifyUserToken(token, testAuthContext())).toBe(TEST_GRADIDO_ID)
    })
  })

  describe('signature', () => {
    it('rejects a token signed with another key', () => {
      const token = signTestToken(validTestPayload(), undefined, testSecretKey('another secret'))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects a token whose payload was exchanged after signing', () => {
      const [header, , signature] = signTestToken(validTestPayload()).split('.')
      const forgedPayload = base64UrlJson(
        validTestPayload({ sub: '9f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f' }),
      )
      expect(
        verifyUserToken(`${header}.${forgedPayload}.${signature}`, testAuthContext()),
      ).toBeNull()
    })

    it('rejects a token with an empty signature', () => {
      const [header, payload] = signTestToken(validTestPayload()).split('.')
      expect(verifyUserToken(`${header}.${payload}.`, testAuthContext())).toBeNull()
    })

    it('rejects a token with a truncated signature', () => {
      const token = signTestToken(validTestPayload())
      expect(verifyUserToken(token.slice(0, -4), testAuthContext())).toBeNull()
    })
  })

  describe('header', () => {
    it('rejects the algorithm "none"', () => {
      const token = `${base64UrlJson({ alg: 'none', typ: 'JWT' })}.${base64UrlJson(validTestPayload())}.`
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects another algorithm even with a matching HMAC', () => {
      const token = signTestToken(validTestPayload(), { alg: 'HS512', typ: 'JWT' })
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    // the header is compared as a string, not parsed: only the exact bytes this module writes pass
    it('rejects a HS256 header that is not byte for byte its own', () => {
      const withoutTyp = signTestToken(validTestPayload(), { alg: 'HS256' })
      const otherKeyOrder = signTestToken(validTestPayload(), { typ: 'JWT', alg: 'HS256' })
      expect(verifyUserToken(withoutTyp, testAuthContext())).toBeNull()
      expect(verifyUserToken(otherKeyOrder, testAuthContext())).toBeNull()
    })
  })

  describe('signing type', () => {
    const hs512 = () => testAuthContext({ signer: testSigner(undefined, AuthSigningType.HMAC512) })

    it('returns the gradido id of a HS512 token under a HS512 auth context', () => {
      const token = createUserToken(TEST_GRADIDO_ID, hs512())
      expect(verifyUserToken(token, hs512())).toBe(TEST_GRADIDO_ID)
    })

    it('rejects a HS256 token under a HS512 auth context and the other way round', () => {
      expect(
        verifyUserToken(createUserToken(TEST_GRADIDO_ID, testAuthContext()), hs512()),
      ).toBeNull()
      expect(
        verifyUserToken(createUserToken(TEST_GRADIDO_ID, hs512()), testAuthContext()),
      ).toBeNull()
    })

    it('rejects a HS512 header over a HS256 signature', () => {
      const token = signTestToken(validTestPayload(), { alg: 'HS512', typ: 'JWT' })
      expect(verifyUserToken(token, hs512())).toBeNull()
    })
  })

  describe('malformed input', () => {
    it('rejects a valid token with a fourth segment appended', () => {
      const token = signTestToken(validTestPayload())
      expect(verifyUserToken(`${token}.junk`, testAuthContext())).toBeNull()
      expect(verifyUserToken(`${token}.`, testAuthContext())).toBeNull()
    })

    it.each(['', 'abc', 'a.b', '..', 'not a token at all'])('rejects %p', (token) => {
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects a correctly signed payload that is no json', () => {
      const token = signRawToken(
        base64UrlJson({ alg: 'HS256', typ: 'JWT' }),
        Buffer.from('no json').toString('base64url'),
      )
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })
  })

  describe('payload', () => {
    it.each(['iss', 'sub', 'aud', 'exp'])('rejects a token without %s', (claim) => {
      const payload = validTestPayload()
      delete payload[claim]
      expect(verifyUserToken(signTestToken(payload), testAuthContext())).toBeNull()
    })

    it('rejects a subject that is neither a uuid v4 nor the dlt-connector', () => {
      const token = signTestToken(validTestPayload({ sub: 'some-service' }))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects an expiration time that is no integer', () => {
      const token = signTestToken(validTestPayload({ exp: '2026-01-01' }))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })
  })

  describe('issued at', () => {
    it('accepts a token issued up to the leeway in the future', () => {
      const token = signTestToken(validTestPayload({ iat: TEST_NOW_SECONDS + JWT_LEEWAY_SECONDS }))
      expect(verifyUserToken(token, testAuthContext())).toBe(TEST_GRADIDO_ID)
    })

    it('rejects a token issued one second past the leeway in the future', () => {
      const token = signTestToken(
        validTestPayload({ iat: TEST_NOW_SECONDS + JWT_LEEWAY_SECONDS + 1 }),
      )
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })
  })

  describe('expiration', () => {
    it('accepts a token up to the leeway after its expiration time', () => {
      const token = signTestToken(validTestPayload({ exp: TEST_NOW_SECONDS - JWT_LEEWAY_SECONDS }))
      expect(verifyUserToken(token, testAuthContext())).toBe(TEST_GRADIDO_ID)
    })

    it('rejects a token one second past the leeway', () => {
      const token = signTestToken(
        validTestPayload({ exp: TEST_NOW_SECONDS - JWT_LEEWAY_SECONDS - 1 }),
      )
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects a created token once its duration and the leeway have passed', () => {
      const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
      setSystemTime(new Date(TEST_NOW.getTime() + (600 + JWT_LEEWAY_SECONDS + 1) * 1000))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })
  })

  describe('issuer and audience', () => {
    it('rejects a token issued by another community', () => {
      const token = signTestToken(validTestPayload({ iss: 'https://other.example' }))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects a token meant for another community', () => {
      const token = signTestToken(validTestPayload({ aud: 'https://other.example' }))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    it('rejects a token whose audience differs only by the trailing slash', () => {
      const token = signTestToken(validTestPayload({ aud: TEST_AUDIENCE.slice(0, -1) }))
      expect(verifyUserToken(token, testAuthContext())).toBeNull()
    })

    // what keeps the tokens of two purposes apart that share secret, issuer and subject
    it('rejects its own token under another audience in the auth context', () => {
      const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
      expect(
        verifyUserToken(token, testAuthContext({ audience: `${TEST_AUDIENCE}hook/gms/` })),
      ).toBeNull()
    })

    it('rejects its own token under another issuer in the auth context', () => {
      const token = createUserToken(TEST_GRADIDO_ID, testAuthContext())
      expect(
        verifyUserToken(token, testAuthContext({ issuer: 'https://other.example' })),
      ).toBeNull()
    })
  })
})
