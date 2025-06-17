import { LogLevel } from './LogLevel'
import { ColoredContextLayoutConfig } from './ColoredContextLayoutConfig'
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
 * if stack is shown, no file and no line is shown, because it is already in the stack trace
 * if file:line is shown, no extra line is shown
 * line will be shown after category name:line
 */
export type CustomFileAppender = {
  name: string
  filename?: string
  layout?: ColoredContextLayoutConfig
}
