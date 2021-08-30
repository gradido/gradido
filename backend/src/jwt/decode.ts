/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import CONFIG from '../config/'

export default (token: string): any => {
  if (!token) return null
  let sessionId = null
  const email = null
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET)
    sessionId = decoded.sub
    // email = decoded.email
    return {
      token,
      sessionId,
      email,
    }
  } catch (err) {
    return null
  }
}
