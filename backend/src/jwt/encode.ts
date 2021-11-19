/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jwt from 'jsonwebtoken'
import CONFIG from '../config/'

// Generate an Access Token
export default function encode(pubKey: Buffer): string {
  const token = jwt.sign({ pubKey }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
  })
  return token
}
