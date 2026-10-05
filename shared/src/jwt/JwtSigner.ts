import { createHmac, createSecretKey, Hmac, KeyObject } from 'node:crypto'
import { AuthSigningType } from '../enum'
import { VoidResult } from '../errorTypes'
import { AuthenticationFailed, AuthenticationFailedType } from './errorTypes'

export class JwtSigner {
  private header: { alg: string; typ: string }
  private headerBase64: string
  private key: KeyObject
  private algorithm: string // algorithm for hash function call

  public constructor(jwtSecret: string, type: AuthSigningType.HMAC | AuthSigningType.HMAC512) {
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

  public signBase64(signatureInput: string): string {
    return this.jwtHash().update(signatureInput).digest('base64url')
  }

  public signBuffer(signatureInput: string): Buffer {
    return this.jwtHash().update(signatureInput).digest()
  }

  public createJwtToken(payloadBase64: string) {
    const headerPayload = `${this.headerBase64}.${payloadBase64}`
    return `${headerPayload}.${this.signBase64(headerPayload)}`
  }

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
