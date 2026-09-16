import { ExpressContext } from 'apollo-server-express'
import { Transaction as dbTransaction, User as dbUser } from 'database'
import { GradidoUnit } from 'shared'

import { Role } from '@/auth/Role'

import { LogError } from './LogError'

/**
 * What one HTTP request has been served so far, across every operation it carries.
 *
 * ⛔ An OBJECT on the context, and that is the mechanism rather than a matter of style.
 * Apollo calls the context function once per HTTP request and gives every operation of a
 * batched POST (a body that is an array of operations) a SHALLOW copy of what it returned
 * (apollo-server-core 2.26: runHttpQuery -> buildRequestContext -> cloneObject). A number
 * on the context is copied by value, so each operation would count from zero and a batch
 * would multiply every cap kept there; this object is copied by reference, so all
 * operations of one request count in the same place. Aliases, which repeat a field inside
 * one operation, count here as well.
 */
export interface RequestBudget {
  // Full-size member pictures, capped at MEMBER_AVATARS_FULL_MAX_PER_REQUEST.
  memberAvatarsFullServed: number
  // Other communities asked by memberAvatars, capped at MEMBER_AVATARS_RELAYS_MAX_PER_REQUEST.
  memberAvatarsRelayed: number
}

/** A budget with nothing spent. The context function creates one per HTTP request. */
export const newRequestBudget = (): RequestBudget => ({
  memberAvatarsFullServed: 0,
  memberAvatarsRelayed: 0,
})

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
  // ⛔ Per HTTP request, not per field and not per operation -- see RequestBudget. A cap
  // written inside one resolver call counts to one every time, because a document may ask
  // for the same field under any number of aliases; a count kept as a number on the context
  // restarts for every operation of a batch. The batched reader next to it caps the LIST it
  // is handed instead (MEMBER_AVATARS_MAX_REFS), which holds only because the list travels
  // as one argument.
  requestBudget: RequestBudget
}

export const context = (args: ExpressContext): Context => {
  const authorization = args.req.headers.authorization
  const clientTimezoneOffset = args.req.headers.clienttimezoneoffset
  const context: Context = {
    token: null,
    setHeaders: [],
    requestBudget: newRequestBudget(),
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
