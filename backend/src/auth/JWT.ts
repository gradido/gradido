import { SignJWT, jwtVerify } from 'jose'

import { CONFIG } from '@/config/'
import { LogError } from '@/server/LogError'

import { CustomJwtPayload } from './CustomJwtPayload'

export const decode = async (token: string): Promise<CustomJwtPayload | null> => {
  if (!token) throw new LogError('401 Unauthorized')

  try {
    const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'urn:example:issuer', // TODO urn
      audience: 'urn:example:audience', // TODO urn
    })
    return payload as CustomJwtPayload
  } catch (err) {
    return null
  }
}

export const encode = async (gradidoID: string): Promise<string> => {
  const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)
  const token = await new SignJWT({ gradidoID, 'urn:example:claim': true }) // TODO urn
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:example:issuer') // TODO urn
    .setAudience('urn:example:audience') // TODO urn
    .setExpirationTime(CONFIG.JWT_EXPIRES_IN)
    .sign(secret)
  return token
}
