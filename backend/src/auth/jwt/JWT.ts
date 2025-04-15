import { createPrivateKey, sign } from 'node:crypto'

import { SignJWT, jwtVerify } from 'jose'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const verify = async (token: string, signkey: Buffer): Promise<JwtPayloadType | null> => {
  if (!token) throw new LogError('401 Unauthorized')
  logger.info(
    'JWT.verify... token, signkey, signkey.toString(hex)',
    token,
    signkey,
    signkey.toString('hex'),
  )

  try {
    /*
    const { KeyObject } = await import('node:crypto')
    const cryptoKey = await crypto.subtle.importKey('raw', signkey, { name: 'RS256' }, false, [ 
      'sign',
    ])
    const keyObject = KeyObject.from(cryptoKey)
    logger.info('JWT.verify... keyObject=', keyObject)
    logger.info('JWT.verify... keyObject.asymmetricKeyDetails=', keyObject.asymmetricKeyDetails)
    logger.info('JWT.verify... keyObject.asymmetricKeyType=', keyObject.asymmetricKeyType)
    logger.info('JWT.verify... keyObject.asymmetricKeySize=', keyObject.asymmetricKeySize)
    */
    const { payload } = await jwtVerify(token, signkey, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gradido:audience',
    })
    logger.info('JWT.verify after jwtVerify... payload=', payload)
    return payload as unknown as JwtPayloadType
  } catch (err) {
    logger.error('JWT.verify after jwtVerify... error=', err)
    return null
  }
}

export const encode = async (payload: JwtPayloadType, signkey: Buffer): Promise<string> => {
  logger.info('JWT.encode... payload=', payload)
  logger.info('JWT.encode... signkey=', signkey)
  logger.info('JWT.encode... signkey length=', signkey.length)
  logger.info('JWT.encode... signkey.toString(hex)=', signkey.toString('hex'))
  try {
    const token = await new SignJWT({ payload, 'urn:gradido:claim': true })
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setIssuer('urn:gradido:issuer')
      .setAudience('urn:gradido:audience')
      .setExpirationTime(payload.expiration)
      .sign(signkey)
    return token
  } catch (e) {
    logger.error('Failed to sign JWT:', e)
    throw e
  }
}

export const verifyJwtType = async (token: string, signkey: Buffer): Promise<string> => {
  const payload = await verify(token, signkey)
  return payload ? payload.tokentype : 'unknown token type'
}
