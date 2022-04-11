/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Role } from '@/auth/Role'
import { User as dbUser } from '@entity/User'

export interface Context {
  token: string | null
  setHeaders: { key: string; value: string }[]
  role?: Role
  user?: dbUser
}

const context = (args: any): Context => {
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
