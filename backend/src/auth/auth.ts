/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'
import decode from '../jwt/decode'
import { apiGet } from '../apis/loginAPI'
import CONFIG from '../config'

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export const isAuthorized: AuthChecker<any> = async ({ root, args, context, info }, roles) => {
  if (context.token) {
    const decoded = decode(context.token)
    if (decoded.sessionId && decoded.sessionId !== 0) {
      const result = await apiGet(
        `${CONFIG.LOGIN_API_URL}checkSessionState?session_id=${decoded.sessionId}`,
      )
      context.sessionId = decoded.sessionId
      return result.success
    }
  }
  return false
}
