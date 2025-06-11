import { LogLevel } from './LogLevel'
/**
 * use default dateFile Template for custom file appenders
 *
 * @example use name for key and filename, add .log to name
 * ```
 * const appenderConfig = createAppenderConfig([
 *   { name: 'info' },
 * ])
 * ```
 *
 * @example if log file should contain the stacktrace
 * ```
 * const appenderConfig = createAppenderConfig([
 *   { name: 'warn', filename: 'warn.log', withStack: true },
 * ])
 * ```
 *
 * @example if log file should contain the stacktrace only from log level debug and higher
 * ```
 * const appenderConfig = createAppenderConfig([
 *   { name: 'warn', filename: 'warn.log', withStack: 'debug' },
 * ])
 * ```
 */
export type CustomFileAppender = {
  name: string
  filename?: string
  withStack?: LogLevel | boolean // with stack if boolean or from log level on or above
  withFile?: LogLevel | boolean // with filename and line if boolean or from log level on or above
}
