
import { GeneralEncrypt, KeyLike, SignJWT, decodeJwt, jwtVerify } from 'jose'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const verify = async (token: string, signkey: string): Promise<JwtPayloadType | null> => {
  if (!token) {
    throw new LogError('401 Unauthorized')
  }
  logger.info('JWT.verify... token, signkey=', token, signkey)

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
    const secret = new TextEncoder().encode(signkey)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gradido:audience',
    })
    logger.info('JWT.verify after jwtVerify... payload=', payload)
    return payload as JwtPayloadType
  } catch (err) {
    logger.error('JWT.verify after jwtVerify... error=', err)
    return null
  }
}

export const encode = async (payload: JwtPayloadType, signkey: string): Promise<string> => {
  logger.info('JWT.encode... payload=', payload)
  logger.info('JWT.encode... signkey=', signkey)
  try {
    const secret = new TextEncoder().encode(signkey)
    const token = await new SignJWT({ payload, 'urn:gradido:claim': true })
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt()
      .setIssuer('urn:gradido:issuer')
      .setAudience('urn:gradido:audience')
      .setExpirationTime(payload.expiration)
      .sign(secret)
    return token
  } catch (e) {
    logger.error('Failed to sign JWT:', e)
    throw e
  }
}

export const verifyJwtType = async (token: string, signkey: string): Promise<string> => {
  const payload = await verify(token, signkey)
  return payload ? payload.tokentype : 'unknown token type'
}

export const decode = (token: string): JwtPayloadType => {
  const { payload } = decodeJwt(token)
  return payload as JwtPayloadType
}

export const encrypt = async(payload: JwtPayloadType, encryptkey: KeyLike): Promise<string> => {
  logger.info('JWT.encrypt... payload=', payload)
  logger.info('JWT.encrypt... encryptkey=', encryptkey)
  try {
    // Convert the key to JWK format if needed
    const recipientKey = typeof encryptkey === 'string' 
      ? JSON.parse(encryptkey)
      : encryptkey;
    
    const jwe = await new GeneralEncrypt(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({ enc: 'A256GCM' })
      .addRecipient(recipientKey)
      .setUnprotectedHeader({ alg: 'ECDH-ES+A256KW' })
      .encrypt()
    /*
    const token = await new EncryptJWT({ payload, 'urn:gradido:claim': true })
      .setProtectedHeader({
        alg: 'HS256',
        enc: 'A256GCM',
        })
        .setIssuedAt()
        .setIssuer('urn:gradido:issuer')
        .setAudience('urn:gradido:audience')
        .setExpirationTime(payload.expiration)
        .encrypt(encryptkey)
    */    
   logger.info('JWT.encrypt... jwe=', jwe)
    return jwe.toString()
  } catch (e) {
    logger.error('Failed to encrypt JWT:', e)
    throw e
  }
}