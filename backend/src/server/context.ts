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
  // hack to use less DB calls for Balance Resolver
  lastTransaction?: dbTransaction
  transactionCount?: number
  linkCount?: number
  sumHoldAvailableAmount?: Decimal
}

const context = (args: ExpressContext): Context => {
  const authorization = args.req.headers.authorization
  let token: string | null = null
  if (authorization) {
    token = authorization.replace(/^Bearer /, '')
  }
  const context = {
    token,
    setHeaders: [],
  }
  return context
}

export const getUser = (context: Context): dbUser => {
  if (context.user) return context.user
  throw new Error('No user given in context!')
}

export default context
