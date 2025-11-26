import { createHash } from 'crypto'
import { getHomeCommunity } from 'database'
import { exportJWK, importSPKI } from 'jose'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { FRONTEND_LOGIN_ROUTE, GRADIDO_REALM, LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.openIDConnect`)
const defaultErrorForCaller = 'Internal Server Error'

export const openidConfiguration = async (req: any, res: any): Promise<void> => {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json({
    issuer: new URL(FRONTEND_LOGIN_ROUTE, CONFIG.COMMUNITY_URL).toString(),
    jwks_uri: new URL(
      `/realms/${GRADIDO_REALM}/protocol/openid-connect/certs`,
      CONFIG.COMMUNITY_URL,
    ).toString(),
  })
}

export const jwks = async (req: any, res: any): Promise<void> => {
  const homeCommunity = await getHomeCommunity()
  if (!homeCommunity) {
    logger.error('HomeCommunity not found')
    throw new Error(defaultErrorForCaller)
  }
  if (!homeCommunity.publicJwtKey) {
    logger.error('HomeCommunity publicJwtKey not found')
    throw new Error(defaultErrorForCaller)
  }
  try {
    const rs256Key = await importSPKI(homeCommunity.publicJwtKey, 'RS256')
    const rsaKey = await importSPKI(homeCommunity.publicJwtKey, 'RSA-OAEP-256')
    const jwkRs256 = await exportJWK(rs256Key)
    const jwkRsa = await exportJWK(rsaKey)

    // Optional: calculate Key ID (z.B. SHA-256 Fingerprint)
    const kid = createHash('sha256').update(homeCommunity.publicJwtKey).digest('base64url')

    const jwks = {
      keys: [
        {
          ...jwkRs256,
          alg: 'RS256',
          use: 'sig',
          kid,
        },
        {
          ...jwkRsa,
          alg: 'RSA-OAEP-256',
          use: 'sig',
          kid,
        },
      ],
    }
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json(jwks)
  } catch (err) {
    logger.error('Failed to convert publicJwtKey to JWK', err)
    res.status(500).json({ error: 'Failed to generate JWKS' })
  }
}
