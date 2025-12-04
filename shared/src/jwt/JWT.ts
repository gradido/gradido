import {
  CompactEncrypt,
  compactDecrypt,
  decodeJwt,
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importPKCS8,
  importSPKI,
  jwtVerify,
  SignJWT,
} from 'jose'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT`)

import { EncryptedJWEJwtPayloadType } from './payloadtypes/EncryptedJWEJwtPayloadType'
import { JwtPayloadType } from './payloadtypes/JwtPayloadType'

export const createKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // Generate key pair using jose library
  const keyPair = await generateKeyPair('RS256', {
    modulusLength: 2048, // recommended key size
    extractable: true,
  })
  logger.debug(`Federation: writeJwtKeyPairInHomeCommunity generated keypair...`)

  // Convert keys to PEM format for storage in database
  const publicKeyPem = await exportSPKI(keyPair.publicKey)
  const privateKeyPem = await exportPKCS8(keyPair.privateKey)
  return { publicKey: publicKeyPem, privateKey: privateKeyPem }
}

export const verify = async (
  handshakeID: string,
  token: string,
  publicKey: string,
): Promise<JwtPayloadType | null> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.verify`)
  methodLogger.addContext('handshakeID', handshakeID)
  if (!token) {
    methodLogger.error('verify... token is empty')
    throw new Error('401 Unauthorized')
  }
  methodLogger.debug('verify... token, publicKey=', token, publicKey)

  try {
    const importedKey = await importSPKI(publicKey, 'RS256')
    // Convert the key to JWK format if needed
    const secret = typeof importedKey === 'string' ? JSON.parse(importedKey) : importedKey
    // const secret = new TextEncoder().encode(publicKey)
    const { payload } = await jwtVerify(token, secret, {
      issuer: JwtPayloadType.ISSUER,
      audience: JwtPayloadType.AUDIENCE,
    })
    payload.handshakeID = handshakeID
    methodLogger.debug('verify after jwtVerify... payload=', payload)
    return payload as JwtPayloadType
  } catch (err) {
    methodLogger.error('verify after jwtVerify... error=', err)
    return null
  }
}

export const encode = async (payload: JwtPayloadType, privatekey: string): Promise<string> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.encode`)
  methodLogger.addContext('handshakeID', payload.handshakeID)
  methodLogger.debug('encode... payload=', payload)
  methodLogger.debug('encode... privatekey=', privatekey.substring(0, 20))
  try {
    const importedKey = await importPKCS8(privatekey, 'RS256')
    const secret = typeof importedKey === 'string' ? JSON.parse(importedKey) : importedKey

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
    methodLogger.debug('encode... token=', token)
    return token
  } catch (e) {
    methodLogger.error('Failed to sign JWT:', e)
    throw e
  }
}

export const verifyJwtType = async (
  handshakeID: string,
  token: string,
  publicKey: string,
): Promise<string> => {
  const payload = await verify(handshakeID, token, publicKey)
  return payload ? payload.tokentype : 'unknown token type'
}

export const decode = (token: string): JwtPayloadType => {
  const { payload } = decodeJwt(token)
  return payload as JwtPayloadType
}

export const encrypt = async (payload: JwtPayloadType, publicKey: string): Promise<string> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.encrypt`)
  methodLogger.addContext('handshakeID', payload.handshakeID)
  methodLogger.debug('encrypt... payload=', payload)
  methodLogger.debug('encrypt... publicKey=', publicKey)
  try {
    const encryptKey = await importSPKI(publicKey, 'RSA-OAEP-256')
    // Convert the key to JWK format if needed
    const recipientKey = typeof encryptKey === 'string' ? JSON.parse(encryptKey) : encryptKey

    const jwe = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(recipientKey)
    methodLogger.debug('encrypt... jwe=', jwe)
    return jwe.toString()
  } catch (e) {
    methodLogger.error('Failed to encrypt JWT:', e)
    throw e
  }
}

export const decrypt = async (
  handshakeID: string,
  jwe: string,
  privateKey: string,
): Promise<string> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.decrypt`)
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug('decrypt... jwe=', jwe)
  methodLogger.debug('decrypt... privateKey=', privateKey.substring(0, 10))
  try {
    const decryptKey = await importPKCS8(privateKey, 'RSA-OAEP-256')
    const { plaintext, protectedHeader } = await compactDecrypt(jwe, decryptKey)
    methodLogger.debug('decrypt... plaintext=', plaintext)
    methodLogger.debug('decrypt... protectedHeader=', protectedHeader)
    return new TextDecoder().decode(plaintext)
  } catch (e) {
    methodLogger.error('Failed to decrypt JWT:', e)
    throw e
  }
}

export const encryptAndSign = async (
  payload: JwtPayloadType,
  privateKey: string,
  publicKey: string,
): Promise<string> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.encryptAndSign`)
  methodLogger.addContext('handshakeID', payload.handshakeID)
  const jwe = await encrypt(payload, publicKey)
  methodLogger.debug('encryptAndSign... jwe=', jwe)
  const jws = await encode(new EncryptedJWEJwtPayloadType(payload.handshakeID, jwe), privateKey)
  methodLogger.debug('encryptAndSign... jws=', jws)
  return jws
}

export const verifyAndDecrypt = async (
  handshakeID: string,
  token: string,
  privateKey: string,
  publicKey: string,
): Promise<JwtPayloadType | null> => {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.auth.jwt.JWT.verifyAndDecrypt`)
  methodLogger.addContext('handshakeID', handshakeID)
  const jweVerifyResult = await verify(handshakeID, token, publicKey)
  if (!jweVerifyResult) {
    return null
  }
  const jwePayload = jweVerifyResult.payload as EncryptedJWEJwtPayloadType
  methodLogger.debug('verifyAndDecrypt... jwePayload=', jwePayload)
  if (!jwePayload) {
    return null
  }
  const jwePayloadType = jwePayload.tokentype
  if (jwePayloadType !== EncryptedJWEJwtPayloadType.ENCRYPTED_JWE_TYPE) {
    return null
  }
  const jwe = jwePayload.jwe
  methodLogger.debug('verifyAndDecrypt... jwe=', jwe)
  const payload = await decrypt(handshakeID, jwe as string, privateKey)
  methodLogger.debug('verifyAndDecrypt... payload=', payload)
  return JSON.parse(payload) as JwtPayloadType
}
