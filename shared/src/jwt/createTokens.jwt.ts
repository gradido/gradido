import { Duration } from '../data'
import { Uuidv4 } from '../schema'
import { AuthContext, JwtPayloadInput, jwtPayloadSchema } from './jwt.schema'

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
export function createUserToken(gradidoID: Uuidv4, authContext: AuthContext): string {
  const payloadObj: JwtPayloadInput = {
    iss: authContext.issuer,
    sub: gradidoID,
    aud: authContext.audience,
    ...calculateTimes(authContext.duration),
  }
  return authContext.hash.createJwtToken(payloadToBase64(payloadObj))
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

function payloadToBase64(payload: JwtPayloadInput): string {
  return Buffer.from(JSON.stringify(jwtPayloadSchema.parse(payload))).toString('base64url')
}
