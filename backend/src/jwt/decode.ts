/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt, { JwtPayload } from 'jsonwebtoken'
import CONFIG from '../config/'

interface CustomJwtPayload extends JwtPayload {
  sessionId: number
  pubKey: Buffer
}

export default (token: string): any => {
  if (!token) return new Error('401 Unauthorized')
  let sessionId = null
  let pubKey = null
  try {
    const decoded = <CustomJwtPayload>jwt.verify(token, CONFIG.JWT_SECRET)
    sessionId = decoded.sessionId
    pubKey = decoded.pubKey
    return {
      token,
      sessionId,
      pubKey,
    }
  } catch (err) {
    throw new Error('403.13 - Client certificate revoked')
  }
}
