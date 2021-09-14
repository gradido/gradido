/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import CONFIG from '../config/'

export default (token: string): any => {
  if (!token) return null
  let sessionId = null
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET)
    sessionId = decoded.sub
    return {
      token,
      sessionId,
    }
  } catch (err) {
    return null
  }
}
