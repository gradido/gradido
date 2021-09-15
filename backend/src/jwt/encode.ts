/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import CONFIG from '../config/'

// Generate an Access Token
export default function encode(sessionId: string): string {
  const token = jwt.sign({ sessionId }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
    subject: sessionId.toString(),
  })
  return token
}
