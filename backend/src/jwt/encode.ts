/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import CONFIG from '../config/'

// Generate an Access Token
export default function encode(data: any): string {
  const { user, sessionId } = data
  const { email, language, firstName, lastName } = user
  const token = jwt.sign({ email, language, firstName, lastName, sessionId }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
    // issuer: CONFIG.GRAPHQL_URI,
    // audience: CONFIG.CLIENT_URI,
    subject: sessionId.toString(),
  })
  return token
}
