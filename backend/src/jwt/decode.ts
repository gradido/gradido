/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import '../config'

export default async (authorizationHeader: string): any => {
  if (!authorizationHeader) return null
  const token = authorizationHeader.replace('Bearer ', '')
  let sessionId = null
  let email = null
  try {
    const decoded = await jwt.verify(token, CONFIG.JWT_SECRET)
    sessionId = decoded.sub
    email = decoded.email
  } catch (err) {
    return null
  }
  return {
    token,
    sessionId,
    email,
  }
}
