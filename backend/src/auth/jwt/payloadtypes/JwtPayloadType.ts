import { JWTPayload } from 'jose'

import { CONFIG } from '@/config'

export class JwtPayloadType implements JWTPayload {
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
    this.expiration = CONFIG.REDEEM_JWT_TOKEN_EXPIRATION || '10m'
  }
}
