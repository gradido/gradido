import { z } from 'zod'
import { getLogger } from 'log4js'
import { LOG_CATEGORY_SCHEMA_ALIAS } from '.'
import { aliasExists } from 'database'

export const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/
const logger = getLogger(`${LOG_CATEGORY_SCHEMA_ALIAS}.alias`)

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
  .min(3, 'Given alias is too short')
  .max(20, 'Given alias is too long')
  .regex(VALID_ALIAS_REGEX, 'Invalid characters in alias')
  .refine((val) => !RESERVED_ALIAS.includes(val.toLowerCase()), {
    message: 'Given alias is not allowed',
  })

export const validateAlias = async (alias: string): Promise<true> => {
  try {
    aliasSchema.parse(alias)
  } catch (err) {
    if (err instanceof z.ZodError) {
      // throw only first error, but log all errors
      logger.warn('invalid alias', alias, err.errors)
      throw new Error(err.errors[0].message)
    }
    throw err
  }

  if (await aliasExists(alias)) {
    logger.warn('alias already in use', alias)
    throw new Error('Given alias is already in use')
  }

  return true
}
