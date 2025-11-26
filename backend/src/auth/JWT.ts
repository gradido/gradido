import { jwtVerify, SignJWT } from 'jose'

import { CONFIG } from '@/config/'
import { LogError } from '@/server/LogError'

import { CustomJwtPayload } from './CustomJwtPayload'

export const decode = async (token: string): Promise<CustomJwtPayload | null> => {
  if (!token) {
    throw new LogError('401 Unauthorized')
  }

  try {
    const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:gradido:issuer',
      audience: 'urn:gradido:audience',
    })
    return payload as CustomJwtPayload
  } catch (_err) {
    return null
  }
}

export const encode = async (gradidoID: string): Promise<string> => {
  const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
  const token = await new SignJWT({ gradidoID, 'urn:gradido:claim': true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:gradido:issuer')
    .setAudience('urn:gradido:audience')
    .setExpirationTime(CONFIG.JWT_EXPIRES_IN)
    .sign(secret)
  return token
}
