import { z } from 'zod'
import { User as DbUser } from 'database'
import { Raw } from 'typeorm'
// import { LogError } from '@/server/LogError'

class LogError extends Error {
  details: any[]
  constructor(msg: string, ...details: any[]) {
    super(msg)
    this.name = 'LogError'
    this.message = msg
    this.stack = new Error().stack
    this.details = details
  }
}

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

export const aliasSchema = z
  .string()
  .min(3, 'Alias is too short')
  .max(20, 'Alias is too long')
  .regex(VALID_ALIAS_REGEX, 'Invalid characters in alias')
  .refine((val) => !RESERVED_ALIAS.includes(val.toLowerCase()), {
    message: 'Alias is not allowed',
  })

export const validateAlias = async (alias: string): Promise<true> => {
  try {
    aliasSchema.parse(alias)
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(err)
      throw new LogError(err.errors[0].message, alias)
    }
    throw err
  }

  const aliasInUse = await DbUser.find({
    where: { alias: Raw((a) => `LOWER(${a}) = "${alias.toLowerCase()}"`) },
  })

  if (aliasInUse.length !== 0) {
    throw new LogError('Alias already in use', alias)
  }

  return true
}
