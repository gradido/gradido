
import { generateKeyPair, exportSPKI, exportPKCS8, KeyLike, SignJWT, decodeJwt, generalDecrypt, importPKCS8, importSPKI, jwtVerify, CompactEncrypt, compactDecrypt } from 'jose'

import { GeneralJWE } from 'jose/dist/types/types'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const createKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // Generate key pair using jose library
  const keyPair = await generateKeyPair('RS256');
  logger.debug(`Federation: writeJwtKeyPairInHomeCommunity generated keypair=`, keyPair);
  
  // Convert keys to PEM format for storage in database
  const publicKeyPem = await exportSPKI(keyPair.publicKey);
  const privateKeyPem = await exportPKCS8(keyPair.privateKey);
  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

export const verify = async (token: string, publicKey: string): Promise<JwtPayloadType | null> => {
  if (!token) {
    throw new LogError('401 Unauthorized')
  }
  logger.info('JWT.verify... token, publicKey=', token, publicKey)

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
    const importedKey = await importSPKI(publicKey, 'RS256')
    // Convert the key to JWK format if needed
    const secret = typeof importedKey === 'string' 
      ? JSON.parse(importedKey)
      : importedKey;
    // const secret = new TextEncoder().encode(publicKey)
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

export const encode = async (payload: JwtPayloadType, privatekey: string): Promise<string> => {
  logger.info('JWT.encode... payload=', payload)
  logger.info('JWT.encode... privatekey=', privatekey)
  try {
    const importedKey = await importPKCS8(privatekey, 'RS256')
    const secret = typeof importedKey === 'string' 
    ? JSON.parse(importedKey)
    : importedKey;

    // const secret = new TextEncoder().encode(privatekey)
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
  } catch (e) {
    logger.error('Failed to sign JWT:', e)
    throw e
  }
}

export const verifyJwtType = async (token: string, publicKey: string): Promise<string> => {
  const payload = await verify(token, publicKey)
  return payload ? payload.tokentype : 'unknown token type'
}

export const decode = (token: string): JwtPayloadType => {
  const { payload } = decodeJwt(token)
  return payload as JwtPayloadType
}

export const encrypt = async (payload: JwtPayloadType, publicKey: string): Promise<string> => {
  logger.info('JWT.encrypt... payload=', payload)
  logger.info('JWT.encrypt... publicKey=', publicKey)
  try {
    const encryptKey = await importSPKI(publicKey, 'RS256')
    // Convert the key to JWK format if needed
    const recipientKey = typeof encryptKey === 'string' 
      ? JSON.parse(encryptKey)
      : encryptKey;
    
    const jwe = await new CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(recipientKey)
    /*
    const jwe = await new EncryptJWT({ payload, 'urn:gradido:claim': true })
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .setIssuedAt()
      .setIssuer('urn:gradido:issuer')
      .setAudience('urn:gradido:audience')
      .setExpirationTime('5m')
      .encrypt(recipientKey);

    const token = await new EncryptJWT({ payload, 'urn:gradido:claim': true })
      .setProtectedHeader({
        alg: 'RS256',
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

export const decrypt = async(jwe: string, privateKey: string): Promise<string> => {
  logger.info('JWT.decrypt... jwe=', jwe)
  logger.info('JWT.decrypt... privateKey=', privateKey)
  try {
    const decryptKey = await importPKCS8(privateKey, 'RS256')
    const { plaintext, protectedHeader } =
      await compactDecrypt(jwe, decryptKey)
    logger.info('JWT.decrypt... plaintext=', plaintext)
    logger.info('JWT.decrypt... protectedHeader=', protectedHeader)
    return plaintext.toString()
    /*
    const generalJwe = await GeneralJWE.parse(jwe)
    const jws = await generalDecrypt(generalJwe, privateKey, { alg: 'ECDH-ES+A256KW', enc: 'A256GCM' })
    
    const { payload, protectedHeader } = await jwtDecrypt(jwe, privateKey);

    console.log(payload);
    console.log(protectedHeader);
    
    logger.info('JWT.decrypt... jws=', jws)
    return jws.toString()
    */
  } catch (e) {
    logger.error('Failed to decrypt JWT:', e)
    throw e
  }
}
