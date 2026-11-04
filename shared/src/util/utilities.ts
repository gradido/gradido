import { promisify } from 'node:util'

export const fullName = (firstName: string, lastName: string): string =>
  [firstName, lastName].filter(Boolean).join(' ')

export const delay = promisify(setTimeout)
