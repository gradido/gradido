// AI-GENERATED — not an architecture reference
import { createHmac, createSecretKey, KeyObject } from 'node:crypto'
import { Duration } from '../data'
import { AuthSigningType } from '../enum'
import { JwtSigner } from './JwtSigner'
import { AuthContext } from './jwt.schema'

// test-only helpers for the *.jwt.test.ts files, not exported from the package index

export const TEST_ISSUER = 'https://community.example'
export const TEST_AUDIENCE = 'https://community.example/'
export const TEST_SECRET = 'secret123'
export const TEST_GRADIDO_ID = '3d813cbb-47fb-42ba-91df-831e1593ac29'
export const TEST_NOW = new Date('2026-01-01T12:00:00.000Z')
export const TEST_NOW_SECONDS = Math.floor(TEST_NOW.getTime() / 1000)

export function testSecretKey(secret = TEST_SECRET): KeyObject {
  return createSecretKey(Buffer.from(secret, 'utf8'))
}

export function testSigner(
  secret = TEST_SECRET,
  type: AuthSigningType = AuthSigningType.HMAC,
): JwtSigner {
  return new JwtSigner(secret, type)
}

export function testAuthContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    issuer: TEST_ISSUER,
    audience: TEST_AUDIENCE,
    duration: Duration.minutes(10),
    signer: testSigner(),
    ...overrides,
  }
}

export function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString())
}

// signs whatever it is handed, valid or not, independent of the code under test
export function signRawToken(
  headerBase64: string,
  payloadBase64: string,
  key: KeyObject = testSecretKey(),
  algorithm: 'sha256' | 'sha512' = 'sha256',
): string {
  const signed = `${headerBase64}.${payloadBase64}`
  return `${signed}.${createHmac(algorithm, key).update(signed).digest('base64url')}`
}

export function signTestToken(
  payload: unknown,
  header: unknown = { alg: 'HS256', typ: 'JWT' },
  key: KeyObject = testSecretKey(),
): string {
  return signRawToken(base64UrlJson(header), base64UrlJson(payload), key)
}

export function validTestPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: TEST_ISSUER,
    sub: TEST_GRADIDO_ID,
    aud: TEST_AUDIENCE,
    exp: TEST_NOW_SECONDS + 600,
    ...overrides,
  }
}
