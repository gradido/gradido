import { string } from 'zod'

export const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/

const RESERVED_ALIAS = [
  'admin',
  'email',
  'gast',
  'gdd',
  'gradido',
  'guest',
  'home',
  'root',
  'support',
  'temp',
  'tmp',
  'tmp',
  'user',
  'usr',
  'var',
]

export const aliasSchema = string()
  .min(3, 'Given alias is too short')
  .max(20, 'Given alias is too long')
  .regex(VALID_ALIAS_REGEX, 'Invalid characters in alias')
  .refine((val) => !RESERVED_ALIAS.includes(val.toLowerCase()), {
    message: 'Given alias is not allowed',
  })
