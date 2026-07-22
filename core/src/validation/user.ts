import { aliasExists } from 'database'
import { getLogger } from 'log4js'
import { aliasSchema } from 'shared'
import { ZodError } from 'zod'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

const createLogger = (method: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.validation.user.${method}`)

export async function validateAlias(alias: string, userId?: number ): Promise<true> {
  const logger = createLogger(`validateAlias`)
  logger.debug(`alias=${alias}, userId=${userId}`)
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
  // Checks if an alias is already used by any user or by other users’ alias history.
  if (await aliasExists(alias, userId)) {
    logger.warn(`alias already in use: alias=${alias}, userId=${userId}`)
    throw new Error('Given alias is already in use')
  }

  return true
}
