
import { generateKeyPair, exportSPKI, exportPKCS8, SignJWT, decodeJwt, importPKCS8, importSPKI, jwtVerify, CompactEncrypt, compactDecrypt } from 'jose'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'
import { EncryptedJWEJwtPayloadType } from './payloadtypes/EncryptedJWEJwtPayloadType'

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
    const importedKey = await importSPKI(publicKey, 'RS256')
    // Convert the key to JWK format if needed
    const secret = typeof importedKey === 'string' 
      ? JSON.parse(importedKey)
      : importedKey;
    // const secret = new TextEncoder().encode(publicKey)
    const { payload } = await jwtVerify(token, secret, {
      issuer: JwtPayloadType.ISSUER,
      audience: JwtPayloadType.AUDIENCE,
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
      .setIssuer(JwtPayloadType.ISSUER)
      .setAudience(JwtPayloadType.AUDIENCE)
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
  } catch (e) {
    logger.error('Failed to decrypt JWT:', e)
    throw e
  }
}

export const encryptAndSign = async (payload: JwtPayloadType, privateKey: string, publicKey: string): Promise<string> => {
  const jwe = await encrypt(payload, publicKey)
  const jws = await encode(new EncryptedJWEJwtPayloadType(jwe), privateKey)
  return jws
}

export const verifyAndDecrypt = async (token: string, privateKey: string, publicKey: string): Promise<JwtPayloadType | null> => {
  const jwePayload = await verify(token, privateKey) as EncryptedJWEJwtPayloadType
  if (!jwePayload) {
    return null
  }
  const payload = await decrypt(jwePayload.jwe as string, publicKey)
  return JSON.parse(payload) as JwtPayloadType
}
