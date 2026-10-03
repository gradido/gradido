import { createHmac } from 'node:crypto'
import { Duration } from '../data'
import { Uuidv4 } from '../schema'
import { JWT_HEADER_HMAC_BASE64 } from './const'
import {
  AuthContext,
  AuthContextInput,
  authContextSchema,
  hmacKeyObjectSchema,
  JwtPayloadInput,
  jwtPayloadSchema,
} from './jwt.schema'

export function createFrontendLoginToken(gradidoID: Uuidv4, authContext: AuthContext): string {
  return signJwtHmac(
    {
      iss: authContext.issuer,
      sub: gradidoID,
      aud: authContext.issuer,
      exp: calculateExpirationTime(authContext.duration),
    },
    authContext,
  )
}

// generic native implementation

function calculateExpirationTime(duration: Duration): number {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return Number(duration.seconds) + nowSeconds
}

// native jwt, because it is a bit faster as jose
function signJwtHmac(payload: JwtPayloadInput, authContext: AuthContext): string {
  const payloadBase64 = Buffer.from(JSON.stringify(jwtPayloadSchema.parse(payload))).toString(
    'base64url',
  )
  hmacKeyObjectSchema.parse(authContext.signingKey)
  const signed = `${JWT_HEADER_HMAC_BASE64}.${payloadBase64}`
  return `${signed}.${createHmac('sha256', authContext.signingKey).update(signed).digest('base64url')}`
}
