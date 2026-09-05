import { ExpressContext } from 'apollo-server-express'
import { Transaction as dbTransaction, User as dbUser } from 'database'
import { GradidoUnit } from 'shared'

import { Role } from '@/auth/Role'

import { LogError } from './LogError'

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  user?: dbUser
  clientTimezoneOffset?: number
  gradidoID?: string
  // hack to use less DB calls for Balance Resolver
  lastTransaction?: dbTransaction | null
  balanceGDT?: number | null
  transactionCount?: number
  linkCount?: number
  sumHoldAvailableDecayedAmount?: GradidoUnit
  // How many full-size member pictures this ONE request has already been served.
  //
  // ⛔ Per request, not per field. GraphQL lets a single document ask for the same field
  // any number of times under different aliases, so a cap written inside one resolver call
  // counts to one every time and bounds nothing. The batched reader next to it caps the
  // LIST it is handed, which is a cap on the same axis and therefore has the same hole
  // filled by MEMBER_AVATARS_MAX_REFS only because the list travels as one argument.
  memberAvatarsFullServed?: number
}

export const context = (args: ExpressContext): Context => {
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
  if (context.user) {
    return context.user
  }
  throw new LogError('No user given in context')
}

export const getRole = (context: Context): Role => {
  if (context.role) {
    return context.role
  }
  throw new LogError('No role given in context')
}

export const getClientTimezoneOffset = (context: Context): number => {
  if (
    (context.clientTimezoneOffset || context.clientTimezoneOffset === 0) &&
    Math.abs(context.clientTimezoneOffset) <= 27 * 60
  ) {
    return context.clientTimezoneOffset
  }
  throw new LogError('No valid client time zone offset in context')
}
