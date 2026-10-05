import { ensureUrlEndsWithSlash } from 'core'
import {
  AuthContext,
  AuthSigningType,
  authContextSchema,
  createUserToken,
  Duration,
  JwtPayloadSubject,
  JwtSigner,
  verifyUserToken,
} from 'shared'
import { CONFIG } from '@/config/'

// built once at module load: an invalid COMMUNITY_URL or JWT_EXPIRES_IN stops the server at startup
// the audience is the community url with trailing slash, a client that builds this token itself
// (dlt-connector) has to write it the same way
const authContext: AuthContext = authContextSchema.parse({
  issuer: CONFIG.COMMUNITY_URL,
  audience: ensureUrlEndsWithSlash(CONFIG.COMMUNITY_URL),
  duration: Duration.fromString(CONFIG.JWT_EXPIRES_IN),
  signer: new JwtSigner(CONFIG.JWT_SECRET, AuthSigningType.HMAC),
})

/**
 * Verifies the session token of a request.
 * @returns user gradidoId if valid or null
 */
export function decode(token: string): JwtPayloadSubject | null {
  return verifyUserToken(token, authContext)
}

/**
 * Creates the session token for a user, valid for `CONFIG.JWT_EXPIRES_IN`.
 * @throws if gradidoID is neither a uuid v4 nor 'dlt-connector'
 */
export function encode(gradidoID: string): string {
  return createUserToken(gradidoID, authContext)
}
