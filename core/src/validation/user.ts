import { aliasExists, DrizzleTransaction } from 'database'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { getLogger } from 'log4js'
import { aliasSchema } from 'shared'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.validation.user.${method}`)

export async function validateAlias(
  alias: string,
  userId?: number,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<true> {
  const logger = createLogger(`validateAlias`)
  logger.debug(`alias=${alias}, userId=${userId}`)
  const parsedAlias = v.safeParse(aliasSchema, alias)
  if (!parsedAlias.success) {
    // throw only first error, but log all errors
    logger.warn('invalid alias', alias, parsedAlias.issues)
    throw new Error(parsedAlias.issues[0].message)
  }
  // Checks if an alias is already used by any user or by other users’ alias history.
  if (await aliasExists(alias, userId, tx)) {
    logger.warn(`alias already in use: alias=${alias}, userId=${userId}`)
    throw new Error('Given alias is already in use')
  }

  return true
}
