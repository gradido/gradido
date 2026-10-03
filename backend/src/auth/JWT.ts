import { createSecretKey } from 'node:crypto'
import {
  AuthContext,
  authContextSchema,
  createFrontendLoginToken,
  Duration,
  Uuidv4,
  verifyFrontendLoginToken,
} from 'shared'
import { CONFIG } from '@/config/'

// built once at module load: an invalid COMMUNITY_URL or JWT_EXPIRES_IN stops the server at startup
const authContext: AuthContext = authContextSchema.parse({
  issuer: CONFIG.COMMUNITY_URL,
  signingKey: createSecretKey(Buffer.from(CONFIG.JWT_SECRET, 'utf8')),
  duration: Duration.fromString(CONFIG.JWT_EXPIRES_IN),
})

/**
 * Verifies the session token of a request.
 * @returns user gradidoId if valid or null
 */
export function decode(token: string): Uuidv4 | null {
  return verifyFrontendLoginToken(token, authContext)
}

/**
 * Creates the session token for a user, valid for `CONFIG.JWT_EXPIRES_IN`.
 * @throws if gradidoID is neither a uuid v4 nor 'dlt-connector'
 */
export function encode(gradidoID: string): string {
  return createFrontendLoginToken(gradidoID, authContext)
}
