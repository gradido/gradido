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
  moduleActivation?: ModuleActivation
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
 * The authorization check runs per field resolution, not per request, so without this
 * one HTTP request would read the same single-row table once per resolved field. Kept
 * on the context rather than in a process-wide cache: a flip in the admin UI is then
 * visible on the very next request, which is as immediate as it can be observed - a
 * request already in flight could not see a mid-flight flip in any design.
 *
 * No row means every module is off. That is what a fresh install reads, and the
 * migration writes none on purpose.
 */
export const getModuleActivation = async (context: Context): Promise<ModuleActivation> => {
  if (!context.moduleActivation) {
    const row = await dbSelectModuleSettings()
    // Boolean() rather than a comparison against 1: the column is tinyint(1) and whether
    // the driver hands back a number or a boolean is a driver setting, not something this
    // code should depend on.
    context.moduleActivation = { matchingActive: Boolean(row?.matchingActive) }
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
