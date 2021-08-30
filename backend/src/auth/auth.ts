/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'
import decode from '../jwt/decode'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export const isAuthorized: AuthChecker<any> = ({ root, args, context, info }, roles) => {
  if (context.token) {
    const decoded = decode(context.token)
    if (decoded.sessionId && decoded.sessionId !== 0) {
      context.sessionId = decoded.sessionId
      return true
    }
  }
  return false
}
