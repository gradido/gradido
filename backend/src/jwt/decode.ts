import jwt, { JwtPayload } from 'jsonwebtoken'
import CONFIG from '../config/'

interface CustomJwtPayload extends JwtPayload {
  sessionId: number
  pubKey: Buffer
}

type DecodedJwt = {
  token: string
  sessionId: number
  pubKey: Buffer
}

export default (token: string): DecodedJwt => {
  if (!token) throw new Error('401 Unauthorized')
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
