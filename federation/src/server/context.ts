import { Community as dbCommunity } from '@entity/Community'
import { ExpressContext } from 'apollo-server-express'

import { Role } from '@/auth/Role'

import { LogError } from './LogError'

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  community?: dbCommunity
}

export const context = (args: ExpressContext): Context => {
  const authorization = args.req.headers.authorization
  const context: Context = {
    token: null,
    setHeaders: [],
  }
  if (authorization) {
    context.token = authorization.replace(/^Bearer /, '')
  }
  return context
}

export const getUser = (context: Context): dbCommunity => {
  if (context.community) return context.community
  throw new LogError('No user given in context')
}
