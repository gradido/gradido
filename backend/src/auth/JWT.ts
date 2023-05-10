import { verify, sign } from 'jsonwebtoken'

import { CONFIG } from '@/config/'
import { LogError } from '@/server/LogError'

import { CustomJwtPayload } from './CustomJwtPayload'

export const decode = (token: string): CustomJwtPayload | null => {
  if (!token) throw new LogError('401 Unauthorized')
  try {
    return verify(token, CONFIG.JWT_SECRET) as CustomJwtPayload
  } catch (err) {
    return null
  }
}

export const encode = (gradidoID: string): string => {
  const token = sign({ gradidoID }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
  })
  return token
}
