import { Role } from '@/auth/Role'
import { User as dbUser } from '@entity/User'
import { Transaction as dbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { ExpressContext } from 'apollo-server-express'
import { backendLogger as logger } from '@/server/logger'

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  user?: dbUser
  clientRequestTime?: string
  // hack to use less DB calls for Balance Resolver
  lastTransaction?: dbTransaction
  transactionCount?: number
  linkCount?: number
  sumHoldAvailableAmount?: Decimal
}

const context = (args: ExpressContext): Context => {
  const authorization = args.req.headers.authorization
  const clientRequestTime = args.req.headers.clientrequesttime
  const context: Context = {
    token: null,
    setHeaders: [],
  }
  if (authorization) {
    context.token = authorization.replace(/^Bearer /, '')
  }
  if (clientRequestTime && typeof clientRequestTime === 'string') {
    context.clientRequestTime = clientRequestTime
  }
  return context
}

export const getUser = (context: Context): dbUser => {
  if (context.user) return context.user
  throw new Error('No user given in context!')
}

export const getClientRequestTime = (context: Context): Date => {
  // console.log('context:', context)
  if (context.clientRequestTime) {
    logger.info(`context with clientRequestTime=${context.clientRequestTime}`)
    return new Date(context.clientRequestTime)
  }
  // throw new Error('No clientRequestTime given in context!')
  logger.info(`missing clientRequestTime, using BackendTime...`)
  return new Date()
}

export default context
