import { CONFIG } from '@/config'
import { FRONTEND_LOGIN_ROUTE, LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getHomeCommunity } from 'database'
import { importSPKI, exportJWK } from 'jose'
import { createHash } from 'crypto'
import { getLogger } from 'log4js'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.openIDConnect`)
const defaultErrorForCaller = 'Internal Server Error'

export const openidConfiguration = async (req: any, res: any): Promise<void> => {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json({
    issuer: new URL(FRONTEND_LOGIN_ROUTE, CONFIG.COMMUNITY_URL).toString(),
    jwks_uri: new URL('/.well-known/jwks.json', CONFIG.COMMUNITY_URL).toString(),
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
    const publicKey = await importSPKI(homeCommunity.publicJwtKey, 'RS256')
    const jwk = await exportJWK(publicKey)

    // Optional: calculate Key ID (z.B. SHA-256 Fingerprint)
    const kid = createHash('sha256')
      .update(homeCommunity.publicJwtKey)
      .digest('base64url')

    const jwks = {
      keys: [
        {
          ...jwk,
          alg: 'RS256',
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