import { Role } from '@/auth/Role'
import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { ExpressContext } from 'apollo-server-express'

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  user?: dbUser
  clientTimezoneOffset?: number
  // hack to use less DB calls for Balance Resolver
  lastTransaction?: dbTransaction
  transactionCount?: number
  linkCount?: number
  sumHoldAvailableAmount?: Decimal
}

const context = (args: ExpressContext): Context => {
  const authorization = args.req.headers.authorization
  const clientTimezoneOffset = args.req.headers.clienttimezoneoffset
  const context: Context = {
    token: null,
    setHeaders: [],
  }
  if (authorization) {
    context.token = authorization.replace(/^Bearer /, '')
  }
  if (clientTimezoneOffset && typeof clientTimezoneOffset === 'string') {
    context.clientTimezoneOffset = Number(clientTimezoneOffset)
  }
  return context
}

export const getUser = (context: Context): dbUser => {
  if (context.user) return context.user
  throw new Error('No user given in context!')
}

export const getClientTimezoneOffset = (context: Context): number => {
  if (
    (context.clientTimezoneOffset || context.clientTimezoneOffset === 0) &&
    Math.abs(context.clientTimezoneOffset) <= 27 * 60
  ) {
    return context.clientTimezoneOffset
  }
  throw new Error('No valid client time zone offset in context!')
}

export default context
