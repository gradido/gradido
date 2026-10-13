import { createHash } from 'crypto'
import { getHomeCommunityDrizzle } from 'database'
import { Elysia } from 'elysia'
import { exportJWK, importSPKI } from 'jose'
import { getLogger } from 'log4js'
import { FRONTEND_LOGIN_ROUTE, GRADIDO_REALM } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  jwksFailedSchema,
  jwksSchema,
  openidConfigurationSchema,
  RsaPublicJwk,
} from './openIDConnect.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.openIDConnect`)
const defaultErrorForCaller = 'Internal Server Error'

const ROUTE_PREFIX = `/realms/${GRADIDO_REALM}`
const CERTS_PATH = '/protocol/openid-connect/certs'

export const openIdConnectRoutes = new Elysia({ prefix: ROUTE_PREFIX })
  .get(
    '/.well-known/openid-configuration',
    () => ({
      issuer: new URL(FRONTEND_LOGIN_ROUTE, CONFIG.COMMUNITY_URL).toString(),
      jwks_uri: new URL(`${ROUTE_PREFIX}${CERTS_PATH}`, CONFIG.COMMUNITY_URL).toString(),
    }),
    {
      response: { 200: openidConfigurationSchema },
    },
  )
  .get(
    CERTS_PATH,
    async ({ set, status }) => {
      const homeCommunity = await getHomeCommunityDrizzle()
      if (!homeCommunity.publicJwtKey) {
        logger.error('HomeCommunity publicJwtKey not found')
        throw new Error(defaultErrorForCaller)
      }
      try {
        const rs256Key = await importSPKI(homeCommunity.publicJwtKey, 'RS256')
        const rsaKey = await importSPKI(homeCommunity.publicJwtKey, 'RSA-OAEP-256')
        // exportJWK is typed for every kind of key; that these are RSA public keys is what the
        // response schema checks
        const jwkRs256 = (await exportJWK(rs256Key)) as RsaPublicJwk
        const jwkRsa = (await exportJWK(rsaKey)) as RsaPublicJwk

        // Optional: calculate Key ID (z.B. SHA-256 Fingerprint)
        const kid = createHash('sha256').update(homeCommunity.publicJwtKey).digest('base64url')

        set.headers['Cache-Control'] = 'public, max-age=3600, immutable'
        return {
          keys: [
            {
              ...jwkRs256,
              alg: 'RS256' as const,
              use: 'sig' as const,
              kid,
            },
            {
              ...jwkRsa,
              alg: 'RSA-OAEP-256' as const,
              use: 'sig' as const,
              kid,
            },
          ],
        }
      } catch (err) {
        logger.error('Failed to convert publicJwtKey to JWK', err)
        return status(500, { error: 'Failed to generate JWKS' })
      }
    },
    {
      response: { 200: jwksSchema, 500: jwksFailedSchema },
    },
  )
