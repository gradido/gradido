import { SignJWT, jwtVerify } from 'jose'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const verify = async (token: string, signkey: Buffer): Promise<JwtPayloadType | null> => {
  if (!token) throw new LogError('401 Unauthorized')
  logger.debug(
    'JWT.verify... token, signkey, signkey.toString()',
    token,
    signkey,
    signkey.toString(),
  )

  try {
    const secret = new TextEncoder().encode(signkey.toString())
    logger.debug('JWT.verify... secret=', secret)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gradido:audience',
    })
    logger.debug('JWT.verify after jwtVerify... payload=', payload)
    return payload as unknown as JwtPayloadType
  } catch (err) {
    logger.error('JWT.verify after jwtVerify... error=', err)
    return null
  }
}

export const encode = async (payload: JwtPayloadType, signkey: Buffer): Promise<string> => {
  const secret = new TextEncoder().encode(signkey.toString())
  const token = await new SignJWT({ payload, 'urn:gradido:claim': true })
    .setProtectedHeader({
      alg: 'RS256',
    })
    .setIssuedAt()
    .setIssuer('urn:gradido:issuer')
    .setAudience('urn:gradido:audience')
    .setExpirationTime(payload.expiration)
    .sign(secret)
  return token
}

export const verifyJwtType = async (token: string, signkey: Buffer): Promise<string> => {
  const payload = await verify(token, signkey)
  return payload ? payload.tokentype : 'unknown token type'
}
