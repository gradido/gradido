import { generateKeyPair, exportSPKI, exportPKCS8, SignJWT, decodeJwt, importPKCS8, importSPKI, jwtVerify, CompactEncrypt, compactDecrypt } from 'jose'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getLogger } from 'log4js'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT`)

import { LogError } from '@/server/LogError'

import { JwtPayloadType } from './payloadtypes/JwtPayloadType'
import { EncryptedJWEJwtPayloadType } from './payloadtypes/EncryptedJWEJwtPayloadType'

export const createKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // Generate key pair using jose library
  const keyPair = await generateKeyPair('RS256');
  logger.debug(`Federation: writeJwtKeyPairInHomeCommunity generated keypair...`);
  
  // Convert keys to PEM format for storage in database
  const publicKeyPem = await exportSPKI(keyPair.publicKey);
  const privateKeyPem = await exportPKCS8(keyPair.privateKey);
  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

export const verify = async (token: string, publicKey: string): Promise<JwtPayloadType | null> => {
  if (!token) {
    throw new LogError('401 Unauthorized')
  }
  logger.debug('JWT.verify... token, publicKey=', token, publicKey)

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
    logger.debug('JWT.verify after jwtVerify... payload=', payload)
    return payload as JwtPayloadType
  } catch (err) {
    logger.error('JWT.verify after jwtVerify... error=', err)
    return null
  }
}

export const encode = async (payload: JwtPayloadType, privatekey: string): Promise<string> => {
  logger.debug('JWT.encode... payload=', payload)
  logger.debug('JWT.encode... privatekey=', privatekey.substring(0, 10))
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
  logger.debug('JWT.encrypt... payload=', payload)
  logger.debug('JWT.encrypt... publicKey=', publicKey)
  try {
    const encryptKey = await importSPKI(publicKey, 'RSA-OAEP-256')
    // Convert the key to JWK format if needed
    const recipientKey = typeof encryptKey === 'string' 
      ? JSON.parse(encryptKey)
      : encryptKey;
    
    const jwe = await new CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(recipientKey)
   logger.debug('JWT.encrypt... jwe=', jwe)
    return jwe.toString()
  } catch (e) {
    logger.error('Failed to encrypt JWT:', e)
    throw e
  }
}

export const decrypt = async(jwe: string, privateKey: string): Promise<string> => {
  logger.debug('JWT.decrypt... jwe=', jwe)
  logger.debug('JWT.decrypt... privateKey=', privateKey.substring(0, 10))
  try {
    const decryptKey = await importPKCS8(privateKey, 'RSA-OAEP-256')
    const { plaintext, protectedHeader } =
      await compactDecrypt(jwe, decryptKey)
    logger.debug('JWT.decrypt... plaintext=', plaintext)
    logger.debug('JWT.decrypt... protectedHeader=', protectedHeader)
    return new TextDecoder().decode(plaintext)
  } catch (e) {
    logger.error('Failed to decrypt JWT:', e)
    throw e
  }
}

export const encryptAndSign = async (payload: JwtPayloadType, privateKey: string, publicKey: string): Promise<string> => {
  const jwe = await encrypt(payload, publicKey)
  logger.debug('JWT.encryptAndSign... jwe=', jwe)
  const jws = await encode(new EncryptedJWEJwtPayloadType(jwe), privateKey)
  logger.debug('JWT.encryptAndSign... jws=', jws)
  return jws
}

export const verifyAndDecrypt = async (token: string, privateKey: string, publicKey: string): Promise<JwtPayloadType | null> => {
  const jweVerifyResult = await verify(token, publicKey)
  if (!jweVerifyResult) {
    return null
  }
  const jwePayload = jweVerifyResult.payload as EncryptedJWEJwtPayloadType
  logger.debug('JWT.verifyAndDecrypt... jwePayload=', jwePayload)
  if (!jwePayload) {
    return null
  }
  const jwePayloadType = jwePayload.tokentype
  if (jwePayloadType !== EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE) {
    return null
  }
  const jwe = jwePayload.jwe
  logger.debug('JWT.verifyAndDecrypt... jwe=', jwe)
  const payload = await decrypt(jwe as string, privateKey)
  logger.debug('JWT.verifyAndDecrypt... payload=', payload)
  return JSON.parse(payload) as JwtPayloadType
}
