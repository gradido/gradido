import jwt, { JwtPayload } from 'jsonwebtoken'
import CONFIG from '../config/'

interface CustomJwtPayload extends JwtPayload {
  pubKey: Buffer
}

type DecodedJwt = {
  token: string
  pubKey: Buffer
}

export default (token: string): DecodedJwt => {
  if (!token) throw new Error('401 Unauthorized')
  let pubKey = null
  try {
    const decoded = <CustomJwtPayload>jwt.verify(token, CONFIG.JWT_SECRET)
    pubKey = decoded.pubKey
    return {
      token,
      pubKey,
    }
  } catch (err) {
    throw new Error('403.13 - Client certificate revoked')
  }
}
