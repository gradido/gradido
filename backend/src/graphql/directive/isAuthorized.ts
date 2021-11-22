/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuthChecker } from 'type-graphql'

import decode from '../../jwt/decode'
import encode from '../../jwt/encode'

const isAuthorized: AuthChecker<any> = async (
  { /* root, args, */ context /*, info */ } /*, roles */,
) => {
  if (context.token) {
    const decoded = decode(context.token)
    context.pubKey = Buffer.from(decoded.pubKey).toString('hex')
    context.setHeaders.push({ key: 'token', value: encode(decoded.pubKey) })
    return true
  }
  throw new Error('401 Unauthorized')
}

export default isAuthorized
