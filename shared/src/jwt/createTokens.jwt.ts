import * as v from 'valibot'
import { Duration } from '../data'
import { Uuidv4 } from '../schema'
import { AuthContext, JwtPayloadInput, jwtPayloadSchema } from './jwt.schema'

/**
 * Creates a token that names a user, for the purpose the auth context stands for:
 * the session token of a logged-in user, the handshake token for the gms, ...
 *
 * A JWT signed by `authContext.signer` with the claims
 * - `iss`: `authContext.issuer`
 * - `aud`: `authContext.audience`
 * - `sub`: the gradido id of the user
 * - `iat`: now
 * - `exp`: now + `authContext.duration`
 *
 * The frontend reads the lifetime of its session from `exp - iat`, so both belong in the token.
 *
 * Counterpart: `verifyUserToken`, with the same auth context.
 *
 * @param gradidoID gradido id of the user, a uuid v4 (the schema also lets 'dlt-connector' pass)
 * @param authContext issuer, audience, lifetime and signer of the token
 * @returns the token in compact serialization: `header.payload.signature`
 * @throws ValiError if `gradidoID` is not a valid subject
 */
export function createUserToken(gradidoID: Uuidv4, authContext: AuthContext): string {
  const payloadObj: JwtPayloadInput = {
    iss: authContext.issuer,
    sub: gradidoID,
    aud: authContext.audience,
    ...calculateTimes(authContext.duration),
  }
  return authContext.signer.createJwtToken(payloadToBase64(payloadObj))
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
 * Validates the payload against `jwtPayloadSchema` and encodes it as second segment of a token.
 * @throws ValiError if the payload is invalid
 */
function payloadToBase64(payload: JwtPayloadInput): string {
  return Buffer.from(JSON.stringify(v.parse(jwtPayloadSchema, payload))).toString('base64url')
}
