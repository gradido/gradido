import { createHmac } from 'node:crypto'
import { Duration } from '../data'
import { Uuidv4 } from '../schema'
import { JWT_HEADER_HMAC_BASE64 } from './const'
import { AuthContext, hmacKeyObjectSchema, JwtPayloadInput, jwtPayloadSchema } from './jwt.schema'

/**
 * Creates the session token a logged-in user sends with every request to its community server.
 *
 * A HS256 signed JWT with the claims
 * - `iss` and `aud`: `authContext.issuer`, the token is issued by and meant for the same server
 * - `sub`: the gradido id of the user
 * - `iat`: now
 * - `exp`: now + `authContext.duration`
 *
 * The frontend reads the lifetime of its session from `exp - iat`, so both belong in the token.
 *
 * Counterpart: `verifyFrontendLoginToken`.
 *
 * @param gradidoID gradido id of the user, a uuid v4 (the schema also lets 'dlt-connector' pass)
 * @param authContext issuer, signing key and lifetime of the token
 * @returns the token in compact serialization: `header.payload.signature`
 * @throws ZodError if `gradidoID` is not a valid subject or `authContext.signingKey` is no secret key
 */
export function createFrontendLoginToken(gradidoID: Uuidv4, authContext: AuthContext): string {
  return signJwtHmac(
    {
      iss: authContext.issuer,
      sub: gradidoID,
      aud: authContext.issuer,
      ...calculateTimes(authContext.duration),
    },
    authContext,
  )
}

// generic native implementation

/**
 * @returns now as `iat` and the point in time `duration` from now as `exp`,
 * both as NumericDate, seconds since the unix epoch
 */
function calculateTimes(duration: Duration): { iat: number; exp: number } {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return { iat: nowSeconds, exp: Number(duration.seconds) + nowSeconds }
}

/**
 * Validates the payload against `jwtPayloadSchema` and signs it with HMAC-SHA256 (HS256).
 * native jwt, because it is a bit faster as jose
 * @throws ZodError if the payload or the signing key is invalid
 */
function signJwtHmac(payload: JwtPayloadInput, authContext: AuthContext): string {
  const payloadBase64 = Buffer.from(JSON.stringify(jwtPayloadSchema.parse(payload))).toString(
    'base64url',
  )
  hmacKeyObjectSchema.parse(authContext.signingKey)
  const signed = `${JWT_HEADER_HMAC_BASE64}.${payloadBase64}`
  return `${signed}.${createHmac('sha256', authContext.signingKey).update(signed).digest('base64url')}`
}
