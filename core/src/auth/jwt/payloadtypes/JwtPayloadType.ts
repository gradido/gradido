import { JWTPayload } from 'jose'

import { REDEEM_JWT_TOKEN_EXPIRATION } from '../../../config/const'

export class JwtPayloadType implements JWTPayload {
  static ISSUER = 'urn:gradido:issuer'
  static AUDIENCE = 'urn:gradido:audience'

  iat?: number | undefined
  exp?: number | undefined
  nbf?: number | undefined
  jti?: string | undefined
  aud?: string | string[] | undefined
  sub?: string | undefined
  iss?: string | undefined;
  [propName: string]: unknown

  handshakeID: string // used as logger context during authentication handshake between comA and comB
  tokentype: string
  expiration: string // in minutes (format: 10m for ten minutes)
  constructor(handshakeID: string) {
    this.tokentype = 'unknown jwt type'
    this.expiration = REDEEM_JWT_TOKEN_EXPIRATION || '10m'
    this.handshakeID = handshakeID
  }
}
