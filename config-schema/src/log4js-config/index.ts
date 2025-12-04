import { readFileSync, writeFileSync } from 'node:fs'
import { addLayout, Configuration, configure, LoggingEvent } from 'log4js'
import { createAppenderConfig } from './appenders'
import { createColoredContextLayout } from './coloredContext'
import type { Category, CustomFileAppender, LogLevel } from './types'
import { defaultCategory } from './types'

export type { Category, LogLevel }
export { defaultCategory }

/**
 * Creates the log4js configuration.
 *
 * @param {Category[]} categories - the categories to add to the configuration
 * @param {string} [basePath] - the base path for log files
 * @returns {Configuration} the log4js configuration
 */

addLayout('json', function () {
  return function (logEvent: LoggingEvent) {
    return JSON.stringify(logEvent)
  }
})

addLayout('coloredContext', createColoredContextLayout)

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
      layout: category.layout,
    })
    // needed by log4js, show all error message accidentally without (proper) Category
    result.categories.default = {
      level: 'debug',
      appenders: ['out', 'errors'],
      enableCallStack: true,
    }
    const appenders = [category.name, 'out']
    if (category.additionalErrorsFile) {
      appenders.push('errors')
    }
    result.categories[category.name] = {
      level: category.level,
      appenders,
      enableCallStack: true,
    }
  })

  result.appenders = createAppenderConfig(customFileAppenders, basePath)
  return result
}

/**
 * Initializes the logger.
 *
 * @param {Category[]} categories - the categories to add to the configuration
 * @param {string} logFilesPath - the base path for log files
 * @param {string} [log4jsConfigFileName] - the name of the log4js config file
 */
export function initLogger(
  categories: Category[],
  logFilesPath: string,
  log4jsConfigFileName: string = 'log4js-config.json',
): void {
  // if not log4js config file exists, create a default one
  try {
    configure(JSON.parse(readFileSync(log4jsConfigFileName, 'utf-8')))
  } catch (_e) {
    const options = createLog4jsConfig(categories, logFilesPath)
    writeFileSync(log4jsConfigFileName, JSON.stringify(options, null, 2), { encoding: 'utf-8' })
    configure(options)
  }
}
