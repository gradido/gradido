import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

/**
 * A custom Error that logs itself immediately upon instantiation.
 *
 * TODO: Anti-pattern warning:
 * Logging inside the constructor introduces side effects during object creation,
 * which breaks separation of concerns and can lead to duplicate or unwanted logs.
 * It is generally better to log errors where they are caught, not where they are thrown.
 *
 * @class LogError
 * @extends {Error}
 * @param {string} msg - The error message.
 * @param {...any} details - Additional details passed to the logger.
 */
export class LogError extends Error {
  constructor(msg: string, ...details: any[]) {
    super(msg)
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logError`)
    logger.error(msg, ...details)
  }
}
