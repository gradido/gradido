import jwt from 'jsonwebtoken'
import CONFIG from '@/config/'
import { CustomJwtPayload } from './CustomJwtPayload'

export const decode = (token: string): CustomJwtPayload | null => {
  if (!token) throw new Error('401 Unauthorized')
  try {
    return <CustomJwtPayload>jwt.verify(token, CONFIG.JWT_SECRET)
  } catch (err) {
    return null
  }
}

export const encode = (pubKey: Buffer): string => {
  const token = jwt.sign({ pubKey }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
  })
  return token
}
