/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'

import CONFIG from '../../config'
import { apiGet } from '../../apis/HttpRequest'

import decode from '../../jwt/decode'
import encode from '../../jwt/encode'

const isAuthorized: AuthChecker<any> = async (
  { /* root, args, */ context /*, info */ } /*, roles */,
) => {
  if (context.token) {
    const decoded = decode(context.token)
    // if (decoded.sessionId && decoded.sessionId !== 0) {
    // const result = await apiGet(
    //   `${CONFIG.LOGIN_API_URL}checkSessionState?session_id=${decoded.sessionId}`,
    // )
    // context.sessionId = decoded.sessionId
    context.pubKey = decoded.pubKey
    context.setHeaders.push({ key: 'token', value: encode(decoded.pubKey) })
    return true
    // }
  }
  throw new Error('401 Unauthorized')
}

export default isAuthorized
