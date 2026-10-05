import { createHmac, createSecretKey, Hmac, KeyObject } from 'node:crypto'
import { AuthSigningType } from '../enum'
import { VoidResult } from '../errorTypes'
import { AuthenticationFailed, AuthenticationFailedType } from './errorTypes'

/**
 * Signs tokens with one secret and one HMAC signing type, natively with node:crypto.
 * Built once and kept in an auth context, see `authContextSchema`.
 *
 * @example
 * ```typescript
 * const signer = new JwtSigner(CONFIG.JWT_SECRET, AuthSigningType.HMAC)
 * const token = signer.createJwtToken(payloadBase64) // "header.payload.signature"
 * ```
 */
export class JwtSigner {
  private header: { alg: string; typ: string }
  private headerBase64: string
  private key: KeyObject
  private algorithm: string // algorithm for hash function call

  /**
   * @param jwtSecret the shared secret, read as utf8
   * @param type HMAC (HS256) or HMAC512 (HS512)
   * @throws Error for a signing type that is not implemented
   */
  public constructor(jwtSecret: string, type: AuthSigningType) {
    this.key = createSecretKey(Buffer.from(jwtSecret, 'utf8'))

    switch (type) {
      case AuthSigningType.HMAC:
        this.header = { alg: 'HS256', typ: 'JWT' }
        this.algorithm = 'sha256'
        break
      case AuthSigningType.HMAC512:
        this.header = { alg: 'HS512', typ: 'JWT' }
        this.algorithm = 'sha512'
        break
      default:
        throw new Error(`AuthSigningType ${type} not implemented yet`)
    }
    this.headerBase64 = Buffer.from(JSON.stringify(this.header)).toString('base64url')
  }

  /**
   * @param signatureInput what to sign, for a token `header.payload`, both base64url
   * @returns the signature base64url encoded, as it stands in a token
   */
  public signBase64(signatureInput: string): string {
    return this.jwtHash().update(signatureInput).digest('base64url')
  }

  /**
   * @param signatureInput what to sign, for a token `header.payload`, both base64url
   * @returns the raw signature, to compare with `timingSafeEqual`
   */
  public signBuffer(signatureInput: string): Buffer {
    return this.jwtHash().update(signatureInput).digest()
  }

  /**
   * @param payloadBase64 the payload, already validated and base64url encoded
   * @returns the token in compact serialization: `header.payload.signature`
   */
  public createJwtToken(payloadBase64: string) {
    const headerPayload = `${this.headerBase64}.${payloadBase64}`
    return `${headerPayload}.${this.signBase64(headerPayload)}`
  }

  /**
   * Compares a header with the one this signer writes, as string and not parsed:
   * a header with the same meaning but other bytes (other key order, no `typ`) does not pass.
   * @param headerBase64 first segment of a token
   */
  public isHeaderValid(headerBase64: string): VoidResult<AuthenticationFailed> {
    if (this.headerBase64 !== headerBase64) {
      const jsonHeader = Buffer.from(headerBase64, 'base64url').toString()
      return {
        success: false,
        error: new AuthenticationFailed(
          `Expected ${this.header.alg} algo, get: ${jsonHeader}`,
          AuthenticationFailedType.UNEXPECTED_FORMAT,
        ),
      }
    }
    return { success: true }
  }

  private jwtHash(): Hmac {
    return createHmac(this.algorithm, this.key)
  }
}
