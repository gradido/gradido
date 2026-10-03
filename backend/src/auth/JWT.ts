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

const authContext: AuthContext = authContextSchema.parse({
  issuer: CONFIG.COMMUNITY_URL,
  signingKey: createSecretKey(Buffer.from(CONFIG.JWT_SECRET, 'utf8')),
  duration: Duration.fromString(CONFIG.JWT_EXPIRES_IN),
})

// return user gradidoId if valid or null
export function decode(token: string): Uuidv4 | null {
  return verifyFrontendLoginToken(token, authContext)
}

export function encode(gradidoID: string): string {
  return createFrontendLoginToken(gradidoID, authContext)
}
