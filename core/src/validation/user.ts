import { ZodError } from 'zod'
import { getLogger } from 'log4js'
import { LOG4JS_CATEGORY_SCHEMA_ALIAS } from '.'
import { aliasExists } from 'database'
import { aliasSchema } from 'shared'

const logger = getLogger(`${LOG4JS_CATEGORY_SCHEMA_ALIAS}.alias`)

export async function validateAlias(alias: string): Promise<true> {
  try {
    aliasSchema.parse(alias)
  } catch (err) {
    if (err instanceof ZodError || (err as Error).name === 'ZodError') {
      // throw only first error, but log all errors
      logger.warn('invalid alias', alias, (err as ZodError).errors)
      throw new Error((err as ZodError).errors[0].message)
    }
    throw err
  }

  if (await aliasExists(alias)) {
    logger.warn('alias already in use', alias)
    throw new Error('Given alias is already in use')
  }

  return true
}
