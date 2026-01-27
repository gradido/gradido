import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.logic.processCommand.${method}`)

export async function processCommand(commandClass: string, commandMethod: string, commandArgs: string[]) {
  const methodLogger = createLogger(`processCommand`)
  methodLogger.info('processing a command...')
}
