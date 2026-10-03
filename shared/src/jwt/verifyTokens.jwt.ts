import { createHmac, timingSafeEqual } from 'node:crypto'
import { getLogger } from 'log4js'
import { JWT_LEEWAY_SECONDS, LOG4JS_BASE_CATEGORY_NAME } from '../const'
import { Duration } from '../data'
import { Result } from '../errorTypes'
import { Uuidv4 } from '../schema'
import { JWT_HEADER_HMAC_BASE64 } from './const'
import { AuthenticationFailed, AuthenticationFailedType } from './errorTypes'
import { AuthContext, JwtPayload, jwtPayloadSchema } from './jwt.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.jwt.verifyTokens`)

/**
 * Verifies a session token created by `createFrontendLoginToken`.
 *
 * Valid is a token that
 * - consists of exactly three segments
 * - carries exactly the HS256 header this module writes
 * - is signed with `authContext.signingKey`
 * - has a payload matching `jwtPayloadSchema`
 * - is not issued in the future and not expired, each with `JWT_LEEWAY_SECONDS` of tolerance
 * - names `authContext.issuer` as both `iss` and `aud`
 *
 * Never throws: the reason for a rejection goes to the log as warning,
 * an expired token, the ordinary end of a session, only as debug.
 *
 * The dlt-connector authenticates with a token of the same shape and `sub: 'dlt-connector'`.
 *
 * @param jwtToken the token as received, without "Bearer " prefix
 * @param authContext issuer and signing key to verify against, `duration` is not used here
 * @returns gradido id of user (or 'dlt-connector') if valid, else null
 */
export function verifyFrontendLoginToken(
  jwtToken: string,
  authContext: AuthContext,
): Uuidv4 | null {
  const result = verifyJwtHmac(jwtToken, authContext)
  if (!result.success) {
    if (result.error.type !== AuthenticationFailedType.EXPIRED_JWT_TOKEN) {
      logger.warn(`error verify login token: ${result.error.message}`)
    } else {
      logger.debug(`expired login token`)
    }
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

/**
 * Checks segment count, header, signature, payload structure, `iat` and `exp` of a HS256 signed token,
 * in this order, so the payload is only parsed after the signature has proven its origin.
 * Issuer and audience are left to the caller.
 *
 * @returns the parsed payload, or the first reason the token was rejected for
 */
function verifyJwtHmac(
  jwtToken: string,
  authContext: AuthContext,
): Result<JwtPayload, AuthenticationFailed> {
  try {
    const parts = jwtToken.split('.')
    if (parts.length !== 3) {
      return {
        success: false,
        error: new AuthenticationFailed(
          'unexpected part count',
          AuthenticationFailedType.INVALID_JWT_TOKEN,
        ),
      }
    }
    const [headerBase64, payloadBase64, signatureBase64] = parts
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

    // check iat and exp
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (parseResult.data.iat && parseResult.data.iat > nowSeconds + JWT_LEEWAY_SECONDS) {
      const futureDuration = Duration.seconds(parseResult.data.iat - nowSeconds)
      return {
        success: false,
        error: new AuthenticationFailed(
          `issued in the future, in ${futureDuration}`,
          AuthenticationFailedType.INVALID_JWT_TOKEN,
        ),
      }
    }
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
