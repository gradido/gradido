// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { createHmac } from 'node:crypto'
import { AuthSigningType } from '../enum'
import { AuthenticationFailedType } from './errorTypes'
import { JwtSigner } from './JwtSigner'
import { base64UrlJson, decodeSegment, TEST_SECRET } from './testHelpers.jwt'

const hs256Header = base64UrlJson({ alg: 'HS256', typ: 'JWT' })
const hs512Header = base64UrlJson({ alg: 'HS512', typ: 'JWT' })

describe('JwtSigner', () => {
  describe.each([
    [AuthSigningType.HMAC, 'HS256', 'sha256', 32],
    [AuthSigningType.HMAC512, 'HS512', 'sha512', 64],
  ] as const)('signing type %p (%s)', (type, alg, algorithm, signatureBytes) => {
    const signer = new JwtSigner(TEST_SECRET, type)
    const expected = (input: string) => createHmac(algorithm, TEST_SECRET).update(input)

    it('signs with the HMAC of the secret, read as utf8', () => {
      expect(signer.signBase64('header.payload')).toBe(
        expected('header.payload').digest('base64url'),
      )
    })

    it('returns the same signature as buffer and as base64url', () => {
      const buffer = signer.signBuffer('header.payload')
      expect(buffer).toHaveLength(signatureBytes)
      expect(buffer.toString('base64url')).toBe(signer.signBase64('header.payload'))
    })

    it('builds a token of its header, the payload and the signature over both', () => {
      const [header, payload, signature] = signer.createJwtToken('cGF5bG9hZA').split('.')
      expect(decodeSegment(header)).toEqual({ alg, typ: 'JWT' })
      expect(payload).toBe('cGF5bG9hZA')
      expect(signature).toBe(expected(`${header}.cGF5bG9hZA`).digest('base64url'))
    })

    it('accepts its own header', () => {
      const [header] = signer.createJwtToken('cGF5bG9hZA').split('.')
      expect(signer.isHeaderValid(header)).toEqual({ success: true })
    })
  })

  it('signs differently with another secret', () => {
    const a = new JwtSigner(TEST_SECRET, AuthSigningType.HMAC)
    const b = new JwtSigner('another secret', AuthSigningType.HMAC)
    expect(a.signBase64('header.payload')).not.toBe(b.signBase64('header.payload'))
  })

  describe('isHeaderValid', () => {
    const signer = new JwtSigner(TEST_SECRET, AuthSigningType.HMAC)

    it('rejects the header of the other signing type', () => {
      const hs512 = new JwtSigner(TEST_SECRET, AuthSigningType.HMAC512)
      expect(signer.isHeaderValid(hs512Header).success).toBe(false)
      expect(hs512.isHeaderValid(hs256Header).success).toBe(false)
    })

    // compared as string, not parsed
    it.each([
      ['no typ', { alg: 'HS256' }],
      ['other key order', { typ: 'JWT', alg: 'HS256' }],
      ['algorithm none', { alg: 'none', typ: 'JWT' }],
    ])('rejects a header with %s', (_name, header) => {
      expect(signer.isHeaderValid(base64UrlJson(header)).success).toBe(false)
    })

    it('names the expected algorithm and the received header in the error', () => {
      const result = signer.isHeaderValid(hs512Header)
      if (result.success) {
        throw new Error('expected a failure')
      }
      expect(result.error.type).toBe(AuthenticationFailedType.UNEXPECTED_FORMAT)
      expect(result.error.message).toContain('Expected HS256')
      expect(result.error.message).toContain('"alg":"HS512"')
    })
  })

  // a value outside the enum, as a caller without type check could hand in
  it('throws for a signing type that is not implemented', () => {
    expect(() => new JwtSigner(TEST_SECRET, 99 as AuthSigningType)).toThrow('not implemented yet')
  })
})
