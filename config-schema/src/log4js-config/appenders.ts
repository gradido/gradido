import type {
  Appender,
  DateFileAppender,
  LogLevelFilterAppender,
  StandardOutputAppender,
} from 'log4js'
import { CustomFileAppender } from './types'

const pattern = '%d{ISO8601} %p %c [%X{user}] [%f : %l] - %m'
const stacktracePattern = `${pattern} %s`

const fileAppenderTemplate = {
  type: 'dateFile' as const,
  pattern: 'yyyy-MM-dd',
  layout: { type: 'pattern' as const, pattern },
  compress: true,
  keepFileExt: true,
  fileNameSep: '_',
  numBackups: 30,
}

const defaultAppenders = {
  errorFile: {
    type: 'dateFile' as const,
    filename: 'errors',
    pattern: 'yyyy-MM-dd',
    layout: { type: 'pattern' as const, pattern: stacktracePattern },
    compress: true,
    keepFileExt: true,
    fileNameSep: '_',
    numBackups: 30,
  } as DateFileAppender,
  errors: {
    type: 'logLevelFilter' as const,
    level: 'error' as const,
    appender: 'errorFile' as const,
  } as LogLevelFilterAppender,
  out: {
    type: 'stdout' as const,
    layout: { type: 'pattern' as const, pattern },
  } as StandardOutputAppender,
  outStack: {
    type: 'stdout' as const,
    layout: { type: 'pattern' as const, pattern: stacktracePattern },
  } as StandardOutputAppender,
}

/**
 * Creates the appender configuration for log4js.
 *
 * @param {CustomFileAppender[]} fileAppenders
 *   the list of custom file appenders to add to the standard
 *   appenders.
 * @param {string} [basePath]
 *   the base path for all log files.
 * @param {boolean} [stacktraceOnStdout=false]
 *   whether to show the stacktrace on the standard output
 *   appender.
 * @returns {Object<string, Appender>}
 *   the appender configuration as a map
 */
export function createAppenderConfig(
  fileAppenders: CustomFileAppender[],
  basePath?: string,
): { [name: string]: Appender } {
  if (basePath) {
    defaultAppenders.errorFile.filename = `${basePath}/errors`
  }
  const customAppender: { [name: string]: Appender } = { ...defaultAppenders }

  fileAppenders.forEach((appender) => {
    const filename = appender.filename ?? appender.name
    const dateFile: DateFileAppender = {
      ...fileAppenderTemplate,
      filename: basePath ? `${basePath}/${filename}` : filename,
    }
    if (appender.stacktrace) {
      dateFile.layout = { type: 'pattern', pattern: stacktracePattern }
    }
    customAppender[appender.name] = dateFile
  })
  return customAppender
}
