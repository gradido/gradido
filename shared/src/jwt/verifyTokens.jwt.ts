import { createHmac, timingSafeEqual } from 'node:crypto'
import { getLogger } from 'log4js'
import { JWT_LEEWAY_SECONDS, LOG4JS_BASE_CATEGORY_NAME } from '../const'
import { Duration } from '../data'
import { Result } from '../errorTypes'
import { Uuidv4 } from '../schema'
import { JWT_HEADER_HMAC_BASE64 } from './const'
import { AuthenticationFailed, AuthenticationFailedType } from './errorTypes'
import {
  AuthContext,
  AuthContextInput,
  authContextSchema,
  JwtPayload,
  jwtPayloadSchema,
} from './jwt.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.jwt.verifyTokens`)

// return gradido id of user if valid, else null
export function verifyFrontendLoginToken(
  jwtToken: string,
  authContext: AuthContext,
): Uuidv4 | null {
  const result = verifyJwtHmac(jwtToken, authContext)
  if (!result.success) {
    logger.warn(`error verify login token: ${result.error.message}`)
    return null
  }
  const payload = result.value
  if (payload.iss !== authContext.issuer || payload.aud !== authContext.issuer) {
    logger.warn(`jwt token was created from/for another server: ${payload.iss}`)
    return null
  }
  return result.value.sub
}

// generic native implementation

function verifyJwtHmac(
  jwtToken: string,
  authContext: AuthContext,
): Result<JwtPayload, AuthenticationFailed> {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = jwtToken.split('.')
    // check header
    if (JWT_HEADER_HMAC_BASE64 !== headerBase64) {
      const jsonHeader = Buffer.from(headerBase64, 'base64url').toString()
      return {
        success: false,
        error: new AuthenticationFailed(
          `Expected HS256 algo, get: ${jsonHeader}`,
          AuthenticationFailedType.UNEXPECTED_FORMAT,
        ),
      }
    }

    const calculatedSignature = createHmac('sha256', authContext.signingKey)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest()

    // check signature
    const signature = Buffer.from(signatureBase64, 'base64url')
    if (
      signature.length !== calculatedSignature.length ||
      !timingSafeEqual(signature, calculatedSignature)
    ) {
      return {
        success: false,
        error: new AuthenticationFailed(
          'calculated sign !== sign from input',
          AuthenticationFailedType.INVALID_SIGNATURE,
        ),
      }
    }

    // check payload

    // check structure
    const parseResult = jwtPayloadSchema.safeParse(
      JSON.parse(Buffer.from(payloadBase64, 'base64url').toString()),
    )
    if (!parseResult.success) {
      return {
        success: false,
        error: new AuthenticationFailed(
          `Cannot parse jwt payload: ${JSON.stringify(parseResult.error.flatten(), null, 2)}`,
          AuthenticationFailedType.INVALID_JWT_TOKEN,
        ),
      }
    }

    // check exp
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (nowSeconds > parseResult.data.exp + JWT_LEEWAY_SECONDS) {
      const expiredDuration = Duration.seconds(nowSeconds - parseResult.data.exp)
      return {
        success: false,
        error: new AuthenticationFailed(
          `expired since ${expiredDuration}`,
          AuthenticationFailedType.EXPIRED_JWT_TOKEN,
        ),
      }
    }
    return { success: true, value: parseResult.data }
  } catch (e) {
    return {
      success: false,
      error: new AuthenticationFailed(
        `exception on parsing jwt token: ${e}`,
        AuthenticationFailedType.INVALID_JWT_TOKEN,
      ),
    }
  }
}
