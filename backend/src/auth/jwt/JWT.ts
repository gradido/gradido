import { SignJWT, jwtVerify } from 'jose'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const decode = async (token: string, signkey: Buffer): Promise<JwtPayloadType | null> => {
  if (!token) throw new LogError('401 Unauthorized')

  try {
    const secret = new TextEncoder().encode(signkey.toString())
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gradido:audience',
    })
    logger.debug('JWT.decode after jwtVerify... payload=', payload)
    return payload as unknown as JwtPayloadType
  } catch (err) {
    return null
  }
}

export const encode = async (payload: JwtPayloadType, signkey: Buffer): Promise<string> => {
  const secret = new TextEncoder().encode(signkey.toString())
  const token = await new SignJWT({ payload, 'urn:gradido:claim': true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:gradido:issuer')
    .setAudience('urn:gradido:audience')
    .setExpirationTime(payload.expiration)
    .sign(secret)
  return token
}

export const decodeJwtType = async (token: string, signkey: Buffer): Promise<string> => {
  const payload = await decode(token, signkey)
  return payload ? payload.tokentype : 'unknown token type'
}
