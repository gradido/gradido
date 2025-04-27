import { Configuration } from 'log4js'
import { createAppenderConfig } from './appenders'
import { Category, CustomFileAppender, LogLevel } from './types'

export { Category, LogLevel }

function getStdoutAppenderName(cat: Category): string | undefined {
  return cat.stdoutStack ? 'outStack' : cat.stdout ? 'out' : undefined
}

/**
 * Creates the log4js configuration.
 *
 * @param {Category[]} categories - the categories to add to the configuration
 * @param {string} [basePath] - the base path for log files
 * @returns {Configuration} the log4js configuration
 */

export function createLog4jsConfig(categories: Category[], basePath?: string): Configuration {
  const customFileAppenders: CustomFileAppender[] = []
  const result: Configuration = {
    appenders: {},
    categories: {},
  }

  categories.forEach((category: Category) => {
    customFileAppenders.push({
      name: category.name,
      filename: category.filename,
      stacktrace: category.stack,
    })
    result.categories[category.name] = {
      level: category.level,
      appenders: [
        category.name,
        getStdoutAppenderName(category),
        category.errors ? 'errors' : undefined,
      ].filter(Boolean) as string[],
      enableCallStack: category.stack || category.stdoutStack || category.errors,
    }
  })

  result.appenders = createAppenderConfig(customFileAppenders, basePath)
  return result
}
