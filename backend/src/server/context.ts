import { ExpressContext } from 'apollo-server-express'
import { dbSelectModuleSettings, Transaction as dbTransaction, User as dbUser } from 'database'
import { GradidoUnit } from 'shared'

import { Role } from '@/auth/Role'
import { ModuleActivation } from '@/data/Module.logic'

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
  moduleActivation?: Promise<ModuleActivation>
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

/**
 * Which optional modules are switched on, read once per request.
 *
 * The authorization check runs once per authorized root field, so without this a single
 * operation would read the same single-row table once per such field.
 *
 * What is memoized is the PROMISE, not its value. The root fields of one operation are
 * dispatched together, so a memo written only after the read had resolved would be missed
 * by every one of them and each would issue its own query. Memoizing the promise also
 * makes one request see one answer: with the value memoized, two fields of the same
 * operation could straddle an admin's flip and disagree about it. A rejection is memoized
 * too, which is what we want - the context lives for one request, so its fields fail
 * together rather than each retrying a database that just failed.
 *
 * Kept on the context rather than in a process-wide cache: a flip in the admin UI is then
 * visible on the very next request, which is as immediate as it can be observed.
 *
 * No row means every module is off. That is what a fresh install reads, and the
 * migration writes none on purpose.
 */
export const getModuleActivation = (context: Context): Promise<ModuleActivation> => {
  if (!context.moduleActivation) {
    context.moduleActivation = dbSelectModuleSettings().then((row) => ({
      // Boolean() rather than a comparison against 1: drizzle's tinyint column normalizes
      // what the driver hands back, so this only has to turn 0/1 into a boolean.
      matchingActive: Boolean(row?.matchingActive),
    }))
  }
  return context.moduleActivation
}

export const getUser = (context: Context): dbUser => {
  if (context.user) {
    return context.user
  }
  throw new LogError('No user given in context')
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
