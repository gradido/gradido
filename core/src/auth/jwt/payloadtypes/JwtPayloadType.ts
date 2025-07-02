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

  tokentype: string
  expiration: string // in minutes (format: 10m for ten minutes)
  constructor() {
    this.tokentype = 'unknown jwt type'
    this.expiration = REDEEM_JWT_TOKEN_EXPIRATION || '10m'
  }
}
